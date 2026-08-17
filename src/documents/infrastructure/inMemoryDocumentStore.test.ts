import { aDocument } from '../testing/documentBuilder';
import { createInMemoryDocumentStore } from './inMemoryDocumentStore';

describe('createInMemoryDocumentStore', () => {
  it('holds nothing until something is added', async () => {
    const store = createInMemoryDocumentStore();

    expect(await store.list()).toEqual([]);
  });

  it('gives back the documents it was given', async () => {
    const store = createInMemoryDocumentStore();

    await store.add(aDocument({ id: 'first' }));
    await store.add(aDocument({ id: 'second' }));

    expect((await store.list()).map((document) => document.id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('hands out a copy, so callers cannot alter what it holds', async () => {
    const store = createInMemoryDocumentStore();
    await store.add(aDocument({ id: 'kept' }));

    (await store.list()).push(aDocument({ id: 'smuggled' }));

    expect((await store.list()).map((document) => document.id)).toEqual([
      'kept',
    ]);
  });
});
