import { Document, DocumentDraft, newDocument } from '../domain/document';
import { DocumentStore } from '../domain/documentStore';

interface CreateDocumentDependencies {
  store: DocumentStore;
  newId: () => string;
  now: () => Date;
}

export async function createDocument(
  { store, newId, now }: CreateDocumentDependencies,
  draft: DocumentDraft,
): Promise<Document> {
  const document = newDocument(draft, { id: newId(), createdAt: now() });

  await store.add(document);

  return document;
}
