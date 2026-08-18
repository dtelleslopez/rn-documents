import { File, Paths } from 'expo-file-system';

import { TextStorage } from './storedDocumentStore';

const DOCUMENTS_FILE = 'documents.json';

// The document directory, not the cache: the system empties that one at will.
export function createFileTextStorage(name = DOCUMENTS_FILE): TextStorage {
  const file = new File(Paths.document, name);

  return {
    async read(): Promise<string | null> {
      return file.exists ? file.text() : null;
    },

    async write(text: string): Promise<void> {
      if (!file.exists) {
        file.create({ intermediates: true });
      }

      file.write(text);
    },
  };
}
