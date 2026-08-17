import { Document } from '../domain/document';
import { DocumentStore } from '../domain/documentStore';

export function createInMemoryDocumentStore(): DocumentStore {
  const documents: Document[] = [];

  return {
    async add(document: Document): Promise<void> {
      documents.push(document);
    },

    async list(): Promise<Document[]> {
      return [...documents];
    },
  };
}
