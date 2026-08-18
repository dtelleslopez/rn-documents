import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { ReactNode } from 'react';

import { DocumentsReader, DocumentsReading } from '../domain/documentsReader';
import { aDocument } from '../testing/documentBuilder';
import { testDependencies } from '../testing/testDependencies';
import { DocumentsProvider } from './documentsContext';
import { useDocuments } from './useDocuments';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function renderUseDocuments(reader: DocumentsReader) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DocumentsProvider dependencies={testDependencies({ reader })}>
      {children}
    </DocumentsProvider>
  );

  return renderHook(() => useDocuments(), { wrapper });
}

describe('useDocuments', () => {
  it('is loading while the repository has not answered yet', async () => {
    const { result } = await renderUseDocuments({
      read: () => new Promise(() => {}),
    });

    expect(result.current.state).toEqual({ status: 'loading' });
  });

  it('exposes the documents once they arrive', async () => {
    const { result } = await renderUseDocuments({
      read: async () => ({
        documents: [aDocument({ id: 'arrived' })],
        incomplete: false,
      }),
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'ready',
        documents: [aDocument({ id: 'arrived' })],
        incomplete: false,
      });
    });
  });

  it('exposes a failure when the repository cannot deliver', async () => {
    const { result } = await renderUseDocuments({
      read: async () => {
        throw new Error('The document server answered with status 500');
      },
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'failed',
        message: 'The document server answered with status 500',
      });
    });
  });

  it('carries the news that a source could not be read', async () => {
    const { result } = await renderUseDocuments({
      read: async () => ({ documents: [aDocument()], incomplete: true }),
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'ready',
        documents: [aDocument()],
        incomplete: true,
      });
    });
  });

  it('asks the reader again when refreshed', async () => {
    const read = jest.fn(async () => ({
      documents: [aDocument()],
      incomplete: false,
    }));
    const { result } = await renderUseDocuments({ read });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => {
      result.current.refresh();
    });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('goes back to loading when retrying after a failure', async () => {
    let calls = 0;
    const { result } = await renderUseDocuments({
      read: () => {
        calls += 1;
        return calls === 1
          ? Promise.reject(new Error('the server is down'))
          : new Promise(() => {});
      },
    });
    await waitFor(() => expect(result.current.state.status).toBe('failed'));

    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.state).toEqual({ status: 'loading' });
  });

  it('keeps the documents on screen while a refresh is in flight', async () => {
    let calls = 0;
    const { result } = await renderUseDocuments({
      read: () => {
        calls += 1;
        return calls === 1
          ? Promise.resolve({ documents: [aDocument()], incomplete: false })
          : new Promise<DocumentsReading>(() => {});
      },
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.state.status).toBe('ready');
  });

  it('ignores a slow answer that lost the race against a newer one', async () => {
    const slowFirstLoad = deferred<DocumentsReading>();
    const fastRefresh = deferred<DocumentsReading>();
    const read = jest
      .fn<Promise<DocumentsReading>, []>()
      .mockReturnValueOnce(slowFirstLoad.promise)
      .mockReturnValueOnce(fastRefresh.promise);
    const { result } = await renderUseDocuments({ read });

    await act(async () => {
      result.current.refresh();
    });
    await act(async () => {
      fastRefresh.resolve({
        documents: [aDocument({ id: 'fresh' })],
        incomplete: false,
      });
    });
    await act(async () => {
      slowFirstLoad.resolve({
        documents: [aDocument({ id: 'stale' })],
        incomplete: false,
      });
    });

    expect(result.current.state).toEqual({
      status: 'ready',
      documents: [aDocument({ id: 'fresh' })],
      incomplete: false,
    });
  });
});
