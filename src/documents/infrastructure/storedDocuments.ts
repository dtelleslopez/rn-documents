import { Document } from '../domain/document';

// The shape the server answers with, so `parseDocuments` reads stored and
// fetched documents alike instead of two parsers to keep in step.
export function serializeDocuments(documents: Document[]): string {
  return JSON.stringify(
    documents.map((document) => ({
      ID: document.id,
      Title: document.title,
      Version: document.version,
      Attachments: document.attachments,
      Contributors: document.contributors.map((contributor) => ({
        ID: contributor.id,
        Name: contributor.name,
      })),
      CreatedAt: document.createdAt.toISOString(),
      UpdatedAt: document.updatedAt.toISOString(),
    })),
  );
}
