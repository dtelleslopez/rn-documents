import { createWebSocketConnection, WebSocketLike } from './webSocketConnection';

interface FakeSocket extends WebSocketLike {
  closed: boolean;
}

function aFakeSocket(): FakeSocket {
  return {
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    closed: false,
    close() {
      this.closed = true;
    },
  };
}

function aRawFrame(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    Timestamp: '2020-08-12T07:30:08.28093+02:00',
    UserID: '3ffe27e5-fe2c-45ea-8b3c-879b757b0455',
    UserName: 'Alicia Wolf',
    DocumentID: 'f09acc46-3875-4eff-8831-10ccf3356420',
    DocumentTitle: 'Edmund Fitzgerald Porter',
    ...overrides,
  });
}

function connected() {
  const socket = aFakeSocket();
  const notifications: string[] = [];
  const opened: number[] = [];
  const closings: number[] = [];

  const connect = createWebSocketConnection({
    url: 'ws://server/notifications',
    createSocket: () => socket,
  });

  const disconnect = connect({
    onOpen: () => opened.push(1),
    onNotification: (notification) =>
      notifications.push(notification.documentTitle),
    onClosed: () => closings.push(1),
  });

  return { socket, notifications, opened, closings, disconnect };
}

describe('createWebSocketConnection', () => {
  it('opens the socket at the notifications endpoint', () => {
    const urls: string[] = [];
    const connect = createWebSocketConnection({
      url: 'ws://server/notifications',
      createSocket: (url) => {
        urls.push(url);
        return aFakeSocket();
      },
    });

    connect({ onOpen: () => {}, onNotification: () => {}, onClosed: () => {} });

    expect(urls).toEqual(['ws://server/notifications']);
  });

  it('reports every readable frame as a notification', () => {
    const { socket, notifications } = connected();

    socket.onmessage?.({ data: aRawFrame() });

    expect(notifications).toEqual(['Edmund Fitzgerald Porter']);
  });

  it('drops an unreadable frame and keeps listening', () => {
    const { socket, notifications } = connected();

    socket.onmessage?.({ data: 'not json at all' });
    socket.onmessage?.({ data: aRawFrame({ DocumentTitle: 'Stone IPA' }) });

    expect(notifications).toEqual(['Stone IPA']);
  });

  it('announces that the socket is up', () => {
    const { socket, opened } = connected();

    socket.onopen?.();

    expect(opened).toHaveLength(1);
  });

  it('announces a lost socket once, whether it errors or closes', () => {
    const { socket, closings } = connected();

    socket.onerror?.();
    socket.onclose?.();

    expect(closings).toHaveLength(1);
  });

  it('closes the socket on disconnect without reporting a loss', () => {
    const { socket, closings, disconnect } = connected();

    disconnect();
    socket.onclose?.();

    expect(socket.closed).toBe(true);
    expect(closings).toHaveLength(0);
  });
});
