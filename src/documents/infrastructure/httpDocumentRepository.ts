import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';
import { parseDocuments } from './parseDocuments';

interface HttpDocumentRepositoryConfig {
  baseUrl: string;
  /** Injected so tests can drive the adapter without touching the network. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Reads documents from the challenge server over HTTP.
 *
 * Everything the server gets wrong is absorbed here: unexpected statuses,
 * bodies that are not JSON, and records that do not describe a document. The
 * rest of the application only ever sees domain documents or a failed promise.
 */
export function createHttpDocumentRepository({
  baseUrl,
  fetch = globalThis.fetch,
}: HttpDocumentRepositoryConfig): DocumentRepository {
  return {
    async list(): Promise<Document[]> {
      const response = await fetch(`${baseUrl}/documents`);

      if (!response.ok) {
        throw new Error(
          `The document server answered with status ${response.status}`,
        );
      }

      const { documents, discarded } = parseDocuments(await readJson(response));

      if (discarded > 0) {
        console.warn(
          `Discarded ${discarded} unreadable document(s) received from the server`,
        );
      }

      return documents;
    },
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      'The document server answered with a body that is not valid JSON',
    );
  }
}
