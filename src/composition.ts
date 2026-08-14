import { DocumentRepository } from './documents/domain/documentRepository';
import { createHttpDocumentRepository } from './documents/infrastructure/httpDocumentRepository';

/**
 * Used when no `.env` overrides it, so a fresh clone runs without any setup.
 *
 * Reachable from the Android emulator through `adb reverse tcp:8080 tcp:8080`,
 * which keeps the same address working on a device, on the emulator and on web.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

/**
 * Composition root: the single place that decides which implementations the
 * application runs with. Everything else depends on ports only.
 */
export function createDocumentRepository(): DocumentRepository {
  return createHttpDocumentRepository({
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  });
}
