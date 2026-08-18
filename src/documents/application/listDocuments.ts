import { Document } from '../domain/document';
import { sortDocuments } from '../domain/documentOrder';
import { DocumentRepository } from '../domain/documentRepository';

// The order the list opens with; from there the user picks.
export async function listDocuments(
  repository: DocumentRepository,
): Promise<Document[]> {
  return sortDocuments(await repository.list(), 'newest');
}
