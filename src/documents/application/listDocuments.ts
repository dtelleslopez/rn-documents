import { Document, sortByMostRecentlyCreated } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';

export async function listDocuments(
  repository: DocumentRepository,
): Promise<Document[]> {
  return sortByMostRecentlyCreated(await repository.list());
}
