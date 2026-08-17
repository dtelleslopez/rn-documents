import { Document } from './document';

export interface DocumentRepository {
  list(): Promise<Document[]>;
}
