import { Document } from '../domain/document';
import { DocumentStore } from '../domain/documentStore';
import { parseDocuments } from './parseDocuments';
import { serializeDocuments } from './storedDocuments';

export interface TextStorage {
  // `null` when nothing has been stored yet.
  read(): Promise<string | null>;
  write(text: string): Promise<void>;
}

export function createStoredDocumentStore(storage: TextStorage): DocumentStore {
  // Read once: this store is the only writer, so the text cannot change behind
  // our back.
  let loading: Promise<Document[]> | null = null;

  function documents(): Promise<Document[]> {
    loading ??= load(storage);

    return loading;
  }

  return {
    async add(document: Document): Promise<void> {
      const kept = await documents();
      const withDocument = [...kept, document];

      // Written before it is remembered: a document kept in memory but never
      // stored would promise a permanence the app cannot deliver.
      await storage.write(serializeDocuments(withDocument));

      loading = Promise.resolve(withDocument);
    },

    async list(): Promise<Document[]> {
      return [...(await documents())];
    },
  };
}

async function load(storage: TextStorage): Promise<Document[]> {
  const text = await storage.read();

  if (text === null) {
    return [];
  }

  const { documents, discarded } = parseDocuments(readJson(text));

  if (discarded > 0) {
    console.warn(`Discarded ${discarded} unreadable stored document(s)`);
  }

  return documents;
}

function readJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
