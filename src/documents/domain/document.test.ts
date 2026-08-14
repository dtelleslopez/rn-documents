import { aDocument } from '../testing/documentBuilder';
import { sortByMostRecentlyCreated } from './document';

describe('sortByMostRecentlyCreated', () => {
  it('orders documents from most to least recently created', () => {
    const oldest = aDocument({
      id: 'oldest',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    });
    const newest = aDocument({
      id: 'newest',
      createdAt: new Date('2024-06-15T00:00:00Z'),
    });
    const middle = aDocument({
      id: 'middle',
      createdAt: new Date('2022-03-10T00:00:00Z'),
    });

    const sorted = sortByMostRecentlyCreated([oldest, newest, middle]);

    expect(sorted.map((document) => document.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('leaves the given collection untouched', () => {
    const oldest = aDocument({
      id: 'oldest',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    });
    const newest = aDocument({
      id: 'newest',
      createdAt: new Date('2024-06-15T00:00:00Z'),
    });
    const documents = [oldest, newest];

    sortByMostRecentlyCreated(documents);

    expect(documents.map((document) => document.id)).toEqual([
      'oldest',
      'newest',
    ]);
  });
});
