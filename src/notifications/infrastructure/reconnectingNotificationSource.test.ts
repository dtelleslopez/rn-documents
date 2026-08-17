import { Notification } from '../domain/notification';
import { createReconnectingNotificationSource } from './reconnectingNotificationSource';
import { NotificationHandlers } from './webSocketConnection';

function aNotification(): Notification {
  return {
    timestamp: new Date('2020-08-12T05:30:08.280Z'),
    userName: 'Alicia Wolf',
    documentTitle: 'Edmund Fitzgerald Porter',
  };
}

// Records every connection attempt and lets the test drive its handlers.
function aFakeConnection() {
  const attempts: NotificationHandlers[] = [];
  let disconnections = 0;

  return {
    attempts,
    get disconnections() {
      return disconnections;
    },
    get last() {
      return attempts[attempts.length - 1];
    },
    connect: (handlers: NotificationHandlers) => {
      attempts.push(handlers);
      return () => {
        disconnections += 1;
      };
    },
  };
}

// A clock the test advances by hand: no real timers anywhere.
function aFakeSchedule() {
  const pending = new Map<number, { handler: () => void; delay: number }>();
  let nextId = 1;
  const delays: number[] = [];
  let cancellations = 0;

  return {
    delays,
    get cancellations() {
      return cancellations;
    },
    runPending() {
      const due = [...pending.values()];
      pending.clear();
      due.forEach(({ handler }) => handler());
    },
    schedule: {
      setTimeout: (handler: () => void, delay: number) => {
        const id = nextId++;
        delays.push(delay);
        pending.set(id, { handler, delay });
        return id as unknown as ReturnType<typeof setTimeout>;
      },
      clearTimeout: (id: ReturnType<typeof setTimeout>) => {
        cancellations += 1;
        pending.delete(id as unknown as number);
      },
    },
  };
}

function subscribed(delaysMs = [1000, 2000, 4000]) {
  const connection = aFakeConnection();
  const clock = aFakeSchedule();
  const received: string[] = [];

  const source = createReconnectingNotificationSource(connection.connect, {
    delaysMs,
    schedule: clock.schedule,
  });

  const unsubscribe = source.subscribe((notification) =>
    received.push(notification.documentTitle),
  );

  return { connection, clock, received, unsubscribe };
}

describe('createReconnectingNotificationSource', () => {
  it('connects as soon as someone subscribes', () => {
    const { connection } = subscribed();

    expect(connection.attempts).toHaveLength(1);
  });

  it('passes notifications through to the subscriber', () => {
    const { connection, received } = subscribed();

    connection.last.onNotification(aNotification());

    expect(received).toEqual(['Edmund Fitzgerald Porter']);
  });

  it('reconnects after a lost socket', () => {
    const { connection, clock } = subscribed();

    connection.last.onClosed();
    clock.runPending();

    expect(connection.attempts).toHaveLength(2);
    expect(clock.delays).toEqual([1000]);
  });

  it('waits longer after each failure and then holds at the longest delay', () => {
    const { connection, clock } = subscribed();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      connection.last.onClosed();
      clock.runPending();
    }

    expect(clock.delays).toEqual([1000, 2000, 4000, 4000]);
  });

  it('starts the ladder over once a socket actually opens', () => {
    const { connection, clock } = subscribed();

    connection.last.onClosed();
    clock.runPending();
    connection.last.onClosed();
    clock.runPending();
    connection.last.onOpen();
    connection.last.onClosed();
    clock.runPending();

    expect(clock.delays).toEqual([1000, 2000, 1000]);
  });

  it('closes the live socket when the subscriber leaves', () => {
    const { connection, unsubscribe } = subscribed();

    unsubscribe();

    expect(connection.disconnections).toBe(1);
  });

  it('ignores the closure it asked for, however the connection reports it', () => {
    const clock = aFakeSchedule();
    const attempts: NotificationHandlers[] = [];
    // Unlike the WebSocket adapter, this connection announces even the close it
    // was told to perform. Reconnecting to it would leave a socket nobody can
    // reach and a retry loop nobody can stop.
    const connect = (handlers: NotificationHandlers) => {
      attempts.push(handlers);
      return () => handlers.onClosed();
    };

    const source = createReconnectingNotificationSource(connect, {
      delaysMs: [1000],
      schedule: clock.schedule,
    });

    source.subscribe(() => {})();
    clock.runPending();

    expect(attempts).toHaveLength(1);
    expect(clock.delays).toEqual([]);
  });

  it('cancels a pending retry when the subscriber leaves', () => {
    const { connection, clock, unsubscribe } = subscribed();

    connection.last.onClosed();
    unsubscribe();
    clock.runPending();

    expect(clock.cancellations).toBe(1);
    expect(connection.attempts).toHaveLength(1);
  });
});
