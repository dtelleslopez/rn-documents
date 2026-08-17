import { DocumentDraft } from '../domain/document';
import { DocumentStore } from '../domain/documentStore';
import { createInMemoryDocumentStore } from '../infrastructure/inMemoryDocumentStore';
import { createDocument } from './createDocument';

const aDraft: DocumentDraft = {
  title: 'Quarterly report',
  version: '1.0.0',
  attachments: ['notes.pdf'],
};

function dependencies(store: DocumentStore) {
  return {
    store,
    newId: () => 'generated-id',
    now: () => new Date('2026-08-17T10:00:00Z'),
  };
}

describe('createDocument', () => {
  it('stores the document built from the draft', async () => {
    const store = createInMemoryDocumentStore();

    await createDocument(dependencies(store), aDraft);

    expect(await store.list()).toEqual([
      {
        id: 'generated-id',
        title: 'Quarterly report',
        version: '1.0.0',
        attachments: ['notes.pdf'],
        createdAt: new Date('2026-08-17T10:00:00Z'),
        updatedAt: new Date('2026-08-17T10:00:00Z'),
        contributors: [],
      },
    ]);
  });

  it('hands back the document it created', async () => {
    const store = createInMemoryDocumentStore();

    const document = await createDocument(dependencies(store), aDraft);

    expect(document.id).toBe('generated-id');
  });

  it('stores nothing when the draft cannot become a document', async () => {
    const store = createInMemoryDocumentStore();

    await expect(
      createDocument(dependencies(store), { ...aDraft, title: '  ' }),
    ).rejects.toThrow('A document needs a title');

    expect(await store.list()).toEqual([]);
  });
});
