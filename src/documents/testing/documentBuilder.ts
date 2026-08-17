import { Document } from '../domain/document';

export function aDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'a-document-id',
    title: 'A document',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    version: '1.0.0',
    attachments: [],
    contributors: [],
    ...overrides,
  };
}
