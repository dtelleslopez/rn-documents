import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';
import { parseDocuments } from './parseDocuments';

/**
 * Long enough for a slow mobile connection, short enough that the user is not
 * left staring at a spinner when the server never answers at all.
 */
const DEFAULT_TIMEOUT_MS = 10_000;

interface HttpDocumentRepositoryConfig {
  baseUrl: string;
  /** Injected so tests can drive the adapter without touching the network. */
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
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
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: HttpDocumentRepositoryConfig): DocumentRepository {
  return {
    async list(): Promise<Document[]> {
      const response = await fetchWithin(
        timeoutMs,
        fetch,
        `${baseUrl}/documents`,
      );

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

/**
 * A request with no deadline is a spinner with no end: mobile connections drop
 * silently and the socket can stay open long past the point the user cares.
 */
async function fetchWithin(
  timeoutMs: number,
  fetch: typeof globalThis.fetch,
  url: string,
): Promise<Response> {
  const controller = new AbortController();
  const countdown = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    // Any failure after our own abort is that abort, not a network problem.
    if (controller.signal.aborted) {
      throw new Error(
        `The document server did not answer within ${timeoutMs}ms`,
      );
    }

    throw error;
  } finally {
    clearTimeout(countdown);
  }
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
