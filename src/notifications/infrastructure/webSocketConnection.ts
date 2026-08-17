import { NotificationListener } from '../domain/notificationSource';
import { parseNotification } from './parseNotification';

export interface NotificationHandlers {
  onOpen: () => void;
  onNotification: NotificationListener;
  onClosed: () => void;
}

export type ConnectNotifications = (
  handlers: NotificationHandlers,
) => () => void;

// The slice of WebSocket this adapter uses. Narrower than the real thing so a
// test can hand over a plain object instead of a socket.
export interface WebSocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  close(): void;
}

interface WebSocketConnectionConfig {
  url: string;
  createSocket?: (url: string) => WebSocketLike;
}

export function createWebSocketConnection({
  url,
  createSocket = (target) => new WebSocket(target) as unknown as WebSocketLike,
}: WebSocketConnectionConfig): ConnectNotifications {
  return ({ onOpen, onNotification, onClosed }) => {
    const socket = createSocket(url);
    let lost = false;

    // A failing socket fires onerror and then onclose; both mean the same to
    // whoever reconnects, and they must not count twice.
    const reportLoss = () => {
      if (lost) {
        return;
      }

      lost = true;
      onClosed();
    };

    socket.onopen = onOpen;
    socket.onerror = reportLoss;
    socket.onclose = reportLoss;
    socket.onmessage = (event) => {
      const notification = parseNotification(readJson(event.data));

      if (notification !== null) {
        onNotification(notification);
      }
    };

    return () => {
      lost = true;
      socket.close();
    };
  };
}

function readJson(data: unknown): unknown {
  if (typeof data !== 'string') {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
