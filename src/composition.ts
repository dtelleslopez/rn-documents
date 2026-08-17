import { DocumentRepository } from './documents/domain/documentRepository';
import { createHttpDocumentRepository } from './documents/infrastructure/httpDocumentRepository';

// Overridable through `.env`. Reachable from the emulator and from a USB device
// via `adb reverse tcp:8080 tcp:8080`, so the same address works everywhere.
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export function createDocumentRepository(): DocumentRepository {
  return createHttpDocumentRepository({
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  });
}
