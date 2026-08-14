import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';
import { aDocument } from '../testing/documentBuilder';
import { listDocuments } from './listDocuments';

function repositoryReturning(documents: Document[]): DocumentRepository {
  return { list: () => Promise.resolve(documents) };
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
    const repository = repositoryReturning([oldest, newest]);

    const documents = await listDocuments(repository);

    expect(documents.map((document) => document.id)).toEqual([
      'newest',
      'oldest',
    ]);
  });
});
