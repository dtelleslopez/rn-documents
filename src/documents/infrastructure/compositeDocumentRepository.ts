import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';

/**
 * A source that fails does not sink the others: losing the server should not
 * hide the documents the user created locally. Only a total failure is
 * reported, and every partial one is logged rather than swallowed.
 *
 * Ordering is left to the caller, since `listDocuments` already owns that rule.
 */
export function createCompositeDocumentRepository(
  sources: DocumentRepository[],
): DocumentRepository {
  return {
    async list(): Promise<Document[]> {
      const results = await Promise.allSettled(
        sources.map((source) => source.list()),
      );

      const failures = results.filter(isRejected);

      if (failures.length === sources.length) {
        throw failures[0].reason;
      }

      failures.forEach((failure) => {
        console.warn(
          `Could not read documents from one source: ${messageOf(failure.reason)}`,
        );
      });

      return results.filter(isFulfilled).flatMap((result) => result.value);
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

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
