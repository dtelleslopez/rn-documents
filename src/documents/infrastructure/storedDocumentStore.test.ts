import { aDocument } from '../testing/documentBuilder';
import { serializeDocuments } from './storedDocuments';
import { createStoredDocumentStore, TextStorage } from './storedDocumentStore';

function storageHolding(text: string | null = null) {
  const reads: number[] = [];
  let stored = text;

  const storage: TextStorage = {
    read: async () => {
      reads.push(1);
      return stored;
    },
    write: async (written) => {
      stored = written;
    },
  };

  return {
    storage,
    reads,
    get stored() {
      return stored;
    },
  };
}

function failingStorage(overrides: Partial<TextStorage> = {}): TextStorage {
  return {
    read: async () => null,
    write: async () => {
      throw new Error('the disk is full');
    },
    ...overrides,
  };
}

describe('createStoredDocumentStore', () => {
  it('starts from what was stored on a previous run', async () => {
    const kept = aDocument({ id: 'kitchen-notes', title: 'Kitchen notes' });
    const { storage } = storageHolding(serializeDocuments([kept]));

    const documents = await createStoredDocumentStore(storage).list();

    expect(documents).toEqual([kept]);
  });

  it('has nothing to offer the first time the app runs', async () => {
    const { storage } = storageHolding(null);

    expect(await createStoredDocumentStore(storage).list()).toEqual([]);
  });

  it('keeps the documents it is given', async () => {
    const { storage } = storageHolding();
    const store = createStoredDocumentStore(storage);
    const document = aDocument({ id: 'kitchen-notes' });

    await store.add(document);

    expect(await store.list()).toEqual([document]);
  });

  it('writes what it keeps, so the next run finds it', async () => {
    const disk = storageHolding();
    const document = aDocument({ id: 'kitchen-notes' });

    await createStoredDocumentStore(disk.storage).add(document);

    const nextRun = createStoredDocumentStore(storageHolding(disk.stored).storage);
    expect(await nextRun.list()).toEqual([document]);
  });

  it('adds to what was already stored instead of replacing it', async () => {
    const kept = aDocument({ id: 'kept' });
    const disk = storageHolding(serializeDocuments([kept]));
    const store = createStoredDocumentStore(disk.storage);

    await store.add(aDocument({ id: 'added' }));

    expect((await store.list()).map((document) => document.id)).toEqual([
      'kept',
      'added',
    ]);
  });

  // Reading is the slow part, and the answer cannot change behind our back:
  // this store is the only writer.
  it('reads the storage once, however many times it is asked', async () => {
    const disk = storageHolding(serializeDocuments([aDocument()]));
    const store = createStoredDocumentStore(disk.storage);

    await store.list();
    await store.list();
    await store.add(aDocument({ id: 'added' }));

    expect(disk.reads).toHaveLength(1);
  });

  it('drops an unreadable entry rather than everything stored with it', async () => {
    const readable = aDocument({ id: 'readable' });
    const corrupt = `[{"nonsense": true},${serializeDocuments([readable]).slice(1)}`;
    const { storage } = storageHolding(corrupt);

    expect(await createStoredDocumentStore(storage).list()).toEqual([readable]);
  });

  it('starts empty when the stored text is not JSON at all', async () => {
    const { storage } = storageHolding('this is not json');

    expect(await createStoredDocumentStore(storage).list()).toEqual([]);
  });

  it('loses neither of two documents added at the same time', async () => {
    const disk = storageHolding();
    const store = createStoredDocumentStore(disk.storage);

    await Promise.all([
      store.add(aDocument({ id: 'first' })),
      store.add(aDocument({ id: 'second' })),
    ]);

    const nextRun = createStoredDocumentStore(storageHolding(disk.stored).storage);
    expect((await nextRun.list()).map((document) => document.id)).toEqual([
      'first',
      'second',
    ]);
  });

  // Remembering a document that was never written would promise the user a
  // permanence the app cannot deliver.
  it('refuses to remember what it could not write', async () => {
    const store = createStoredDocumentStore(failingStorage());

    await expect(store.add(aDocument())).rejects.toThrow('the disk is full');
    expect(await store.list()).toEqual([]);
  });
});
