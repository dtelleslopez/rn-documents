import { randomUUID } from 'expo-crypto';

import { createCompositeDocumentRepository } from './documents/infrastructure/compositeDocumentRepository';
import { createFileTextStorage } from './documents/infrastructure/fileTextStorage';
import { createHttpDocumentRepository } from './documents/infrastructure/httpDocumentRepository';
import { pickDocumentFileName } from './documents/infrastructure/pickDocumentFileName';
import { createStoredDocumentStore } from './documents/infrastructure/storedDocumentStore';
import { DocumentsDependencies } from './documents/ui/documentsContext';
import { createReconnectingNotificationSource } from './notifications/infrastructure/reconnectingNotificationSource';
import { subscribeToAppState } from './notifications/infrastructure/subscribeToAppState';
import { createWebSocketConnection } from './notifications/infrastructure/webSocketConnection';
import { NotificationsDependencies } from './notifications/ui/notificationsContext';

// Overridable through `.env`. Reachable from the emulator and from a USB device
// via `adb reverse tcp:8080 tcp:8080`, so the same address works everywhere.
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

function apiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export function createDocumentsDependencies(): DocumentsDependencies {
  const store = createStoredDocumentStore(createFileTextStorage());
  const server = createHttpDocumentRepository({ baseUrl: apiBaseUrl() });

  return {
    reader: createCompositeDocumentRepository([server, store]),
    store,
    newId: randomUUID,
    now: () => new Date(),
    pickFile: pickDocumentFileName,
  };
}

export function createNotificationsDependencies(): NotificationsDependencies {
  return {
    source: createReconnectingNotificationSource(
      createWebSocketConnection({
        url: `${apiBaseUrl().replace(/^http/, 'ws')}/notifications`,
      }),
    ),
    subscribeToAppState,
  };
}
