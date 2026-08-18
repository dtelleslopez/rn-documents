import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';
import { DocumentsReader, DocumentsReading } from '../domain/documentsReader';

/**
 * A source that fails does not sink the others: losing the server should not
 * hide the documents the user created locally. The caller is told that the
 * reading is incomplete so it can say so instead of showing a convincing empty
 * screen. Only a total failure is reported as one.
 *
 * Ordering is left to the caller, since `listDocuments` already owns that rule.
 */
export function createCompositeDocumentRepository(
  sources: DocumentRepository[],
): DocumentsReader {
  return {
    async read(): Promise<DocumentsReading> {
      const results = await Promise.allSettled(
        sources.map((source) => source.list()),
      );

      const failures = results.filter(isRejected);

      if (failures.length === sources.length) {
        throw failures[0].reason;
      }

      return {
        documents: results.filter(isFulfilled).flatMap((result) => result.value),
        incomplete: failures.length > 0,
      };
    },
  };
}

function isFulfilled(
  result: PromiseSettledResult<Document[]>,
): result is PromiseFulfilledResult<Document[]> {
  return result.status === 'fulfilled';
}

function isRejected(
  result: PromiseSettledResult<Document[]>,
): result is PromiseRejectedResult {
  return result.status === 'rejected';
}
