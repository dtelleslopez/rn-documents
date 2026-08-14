import { Document, sortByMostRecentlyCreated } from './document';

function aDocument(id: string, createdAt: string): Document {
  return {
    id,
    title: `Document ${id}`,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    version: '1.0.0',
    attachments: [],
    contributors: [],
  };
}

describe('sortByMostRecentlyCreated', () => {
  it('orders documents from most to least recently created', () => {
    const oldest = aDocument('oldest', '2020-01-01T00:00:00Z');
    const newest = aDocument('newest', '2024-06-15T00:00:00Z');
    const middle = aDocument('middle', '2022-03-10T00:00:00Z');

    const sorted = sortByMostRecentlyCreated([oldest, newest, middle]);

    expect(sorted.map((document) => document.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('leaves the given collection untouched', () => {
    const oldest = aDocument('oldest', '2020-01-01T00:00:00Z');
    const newest = aDocument('newest', '2024-06-15T00:00:00Z');
    const documents = [oldest, newest];

    sortByMostRecentlyCreated(documents);

    expect(documents.map((document) => document.id)).toEqual([
      'oldest',
      'newest',
    ]);
  });
});
