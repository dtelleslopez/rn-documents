import { randomUUID } from 'expo-crypto';

import { createCompositeDocumentRepository } from './documents/infrastructure/compositeDocumentRepository';
import { createHttpDocumentRepository } from './documents/infrastructure/httpDocumentRepository';
import { createInMemoryDocumentStore } from './documents/infrastructure/inMemoryDocumentStore';
import { pickDocumentFileName } from './documents/infrastructure/pickDocumentFileName';
import { DocumentsDependencies } from './documents/ui/documentsContext';

// Overridable through `.env`. Reachable from the emulator and from a USB device
// via `adb reverse tcp:8080 tcp:8080`, so the same address works everywhere.
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export function createDocumentsDependencies(): DocumentsDependencies {
  const store = createInMemoryDocumentStore();
  const server = createHttpDocumentRepository({
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  });

  return {
    repository: createCompositeDocumentRepository([server, store]),
    store,
    newId: randomUUID,
    now: () => new Date(),
    pickFile: pickDocumentFileName,
  };
}
