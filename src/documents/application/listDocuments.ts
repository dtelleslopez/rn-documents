import {
  DEFAULT_DOCUMENT_ORDER,
  sortDocuments,
} from '../domain/documentOrder';
import { DocumentsReader, DocumentsReading } from '../domain/documentsReader';

export async function listDocuments(
  reader: DocumentsReader,
): Promise<DocumentsReading> {
  const { documents, incomplete } = await reader.read();

  return {
    documents: sortDocuments(documents, DEFAULT_DOCUMENT_ORDER),
    incomplete,
  };
}
