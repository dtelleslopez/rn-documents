import { Document } from '../domain/document';
import { DocumentRepository } from '../domain/documentRepository';
import { parseDocuments } from './parseDocuments';

const DEFAULT_TIMEOUT_MS = 10_000;

interface HttpDocumentRepositoryConfig {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

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

      const payload = await readJson(response);

      if (!Array.isArray(payload)) {
        // Reading it as an empty list would put a convincing "no documents
        // yet" on screen when the server is misbehaving.
        throw new Error(
          'The document server answered with something that is not a list of documents',
        );
      }

      const { documents, discarded } = parseDocuments(payload);

      if (discarded > 0) {
        console.warn(
          `Discarded ${discarded} unreadable document(s) received from the server`,
        );
      }

      return documents;
    },
  };
}

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
