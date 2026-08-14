import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { ReactNode } from 'react';

import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';
import { aDocument } from '../testing/documentBuilder';
import { DocumentRepositoryProvider } from './documentRepositoryContext';
import { useDocuments } from './useDocuments';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function renderUseDocuments(repository: DocumentRepository) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DocumentRepositoryProvider repository={repository}>
      {children}
    </DocumentRepositoryProvider>
  );

  return renderHook(() => useDocuments(), { wrapper });
}

describe('useDocuments', () => {
  it('is loading while the repository has not answered yet', async () => {
    const { result } = await renderUseDocuments({
      list: () => new Promise(() => {}),
    });

    expect(result.current.state).toEqual({ status: 'loading' });
  });

  it('exposes the documents once they arrive', async () => {
    const { result } = await renderUseDocuments({
      list: async () => [aDocument({ id: 'arrived' })],
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: 'ready',
        documents: [aDocument({ id: 'arrived' })],
      });
    });
  });

  it('exposes a failure when the repository cannot deliver', async () => {
    const { result } = await renderUseDocuments({
      list: async () => {
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

  it('asks the repository again when refreshed', async () => {
    const list = jest.fn(async () => [aDocument()]);
    const { result } = await renderUseDocuments({ list });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    await act(async () => {
      result.current.refresh();
    });

    expect(list).toHaveBeenCalledTimes(2);
  });

  it('ignores a slow answer that lost the race against a newer one', async () => {
    const slowFirstLoad = deferred<Document[]>();
    const fastRefresh = deferred<Document[]>();
    const list = jest
      .fn<Promise<Document[]>, []>()
      .mockReturnValueOnce(slowFirstLoad.promise)
      .mockReturnValueOnce(fastRefresh.promise);
    const { result } = await renderUseDocuments({ list });

    await act(async () => {
      result.current.refresh();
    });
    await act(async () => {
      fastRefresh.resolve([aDocument({ id: 'fresh' })]);
    });
    await act(async () => {
      slowFirstLoad.resolve([aDocument({ id: 'stale' })]);
    });

    expect(result.current.state).toEqual({
      status: 'ready',
      documents: [aDocument({ id: 'fresh' })],
    });
  });
});
