import { aDocument } from '../testing/documentBuilder';
import { sortDocuments } from './documentOrder';

const oldest = aDocument({
  id: 'oldest',
  title: 'Stone IPA',
  createdAt: new Date('2020-01-01T00:00:00Z'),
});
const middle = aDocument({
  id: 'middle',
  title: 'hop rod rye',
  createdAt: new Date('2022-03-10T00:00:00Z'),
});
const newest = aDocument({
  id: 'newest',
  title: 'Bourbon County Stout',
  createdAt: new Date('2024-06-15T00:00:00Z'),
});

function idsOf(documents: ReturnType<typeof sortDocuments>): string[] {
  return documents.map((document) => document.id);
}

describe('sortDocuments', () => {
  it('puts the most recently created first', () => {
    expect(idsOf(sortDocuments([oldest, newest, middle], 'newest'))).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('puts the least recently created first', () => {
    expect(idsOf(sortDocuments([middle, oldest, newest], 'oldest'))).toEqual([
      'oldest',
      'middle',
      'newest',
    ]);
  });

  // Titles come from the server in whatever case it feels like, so ordering
  // that respected it would file "hop rod rye" after every capitalised title.
  it('orders by title without letting the case decide', () => {
    expect(idsOf(sortDocuments([oldest, middle, newest], 'name-asc'))).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('orders by title backwards', () => {
    expect(idsOf(sortDocuments([oldest, middle, newest], 'name-desc'))).toEqual([
      'oldest',
      'middle',
      'newest',
    ]);
  });

  it('leaves the given collection untouched', () => {
    const documents = [oldest, newest];

    sortDocuments(documents, 'name-asc');

    expect(idsOf(documents)).toEqual(['oldest', 'newest']);
  });
});
