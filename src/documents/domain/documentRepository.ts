import { Document } from './document';

/**
 * Port through which the application reads documents, regardless of where they
 * come from: the remote API, local storage, or a combination of both.
 */
export interface DocumentRepository {
  list(): Promise<Document[]>;
}
