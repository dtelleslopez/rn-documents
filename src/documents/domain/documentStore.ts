import { Document } from './document';
import { DocumentRepository } from './documentRepository';

/**
 * Writing lives here and not in `DocumentRepository` because the challenge
 * server exposes no way to create anything: a single writable port would force
 * the HTTP adapter to carry an `add` it could only fail at.
 */
export interface DocumentStore extends DocumentRepository {
  add(document: Document): Promise<void>;
}
