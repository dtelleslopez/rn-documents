import { aDocument } from '../testing/documentBuilder';
import { newDocument, sortByMostRecentlyCreated } from './document';

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

describe('newDocument', () => {
  const createdAt = new Date('2026-08-17T10:00:00Z');

  it('builds a document from what the user filled in', () => {
    const document = newDocument(
      { title: 'Quarterly report', version: '1.0.0', attachments: ['notes.pdf'] },
      { id: 'generated-id', createdAt },
    );

    expect(document).toEqual({
      id: 'generated-id',
      title: 'Quarterly report',
      version: '1.0.0',
      attachments: ['notes.pdf'],
      createdAt,
      updatedAt: createdAt,
      contributors: [],
    });
  });

  it('trims the title the user typed', () => {
    const document = newDocument(
      { title: '  Padded  ', version: '', attachments: [] },
      { id: 'generated-id', createdAt },
    );

    expect(document.title).toBe('Padded');
  });

  it('refuses to build a document with no title', () => {
    expect(() =>
      newDocument(
        { title: '   ', version: '1.0.0', attachments: [] },
        { id: 'generated-id', createdAt },
      ),
    ).toThrow('A document needs a title');
  });
});
