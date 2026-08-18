import { Document } from './document';

/**
 * Reading several sources at once can go half right: the server may be
 * unreachable while the documents created on this device are still there. A
 * single `DocumentRepository` has no such middle ground — it answers or it
 * throws — so the distinction lives here and not in that port.
 */
export interface DocumentsReading {
  documents: Document[];
  incomplete: boolean;
}

export interface DocumentsReader {
  read(): Promise<DocumentsReading>;
}
