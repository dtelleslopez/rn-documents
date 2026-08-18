import { Document } from '../domain/document';
import { DocumentsReader } from '../domain/documentsReader';
import { aDocument } from '../testing/documentBuilder';
import { listDocuments } from './listDocuments';

function readerReturning(documents: Document[], incomplete = false): DocumentsReader {
  return { read: async () => ({ documents, incomplete }) };
}

describe('listDocuments', () => {
  it('returns the stored documents ordered by most recently created', async () => {
    const oldest = aDocument({
      id: 'oldest',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    });
    const newest = aDocument({
      id: 'newest',
      createdAt: new Date('2024-06-15T00:00:00Z'),
    });

    const { documents } = await listDocuments(readerReturning([oldest, newest]));

    expect(documents.map((document) => document.id)).toEqual([
      'newest',
      'oldest',
    ]);
  });

  it('passes on that some source could not be read', async () => {
    const reading = await listDocuments(readerReturning([aDocument()], true));

    expect(reading.incomplete).toBe(true);
  });
});
