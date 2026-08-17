import { act, renderHook } from '@testing-library/react-native';
import React, { ReactNode } from 'react';

import { createInMemoryDocumentStore } from '../infrastructure/inMemoryDocumentStore';
import { testDependencies } from '../testing/testDependencies';
import { DocumentsProvider } from './documentsContext';
import { useCreateDocument } from './useCreateDocument';

function renderUseCreateDocument(store = createInMemoryDocumentStore()) {
  const dependencies = testDependencies({ store, newId: () => 'created-id' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DocumentsProvider dependencies={dependencies}>
      {children}
    </DocumentsProvider>
  );

  return { store, rendered: renderHook(() => useCreateDocument(), { wrapper }) };
}

describe('useCreateDocument', () => {
  it('stores the document the user described', async () => {
    const { store, rendered } = renderUseCreateDocument();
    const { result } = await rendered;

    await act(async () => {
      await result.current.create({
        title: 'Quarterly report',
        version: '1.0.0',
        attachments: [],
      });
    });

    expect((await store.list()).map((document) => document.title)).toEqual([
      'Quarterly report',
    ]);
  });

  it('uses the injected identity instead of inventing one', async () => {
    const { store, rendered } = renderUseCreateDocument();
    const { result } = await rendered;

    await act(async () => {
      await result.current.create({
        title: 'Quarterly report',
        version: '',
        attachments: [],
      });
    });

    expect((await store.list())[0].id).toBe('created-id');
  });
});
