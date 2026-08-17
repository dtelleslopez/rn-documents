import { Notification } from '../domain/notification';
import {
  NotificationListener,
  NotificationSource,
} from '../domain/notificationSource';

export function aNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    timestamp: new Date('2026-08-17T10:00:00Z'),
    userName: 'Alicia Wolf',
    documentTitle: 'Edmund Fitzgerald Porter',
    ...overrides,
  };
}

export function aFakeNotificationSource() {
  const listeners = new Set<NotificationListener>();

  const source: NotificationSource = {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return {
    source,
    emit(notification: Notification = aNotification()) {
      listeners.forEach((listener) => listener(notification));
    },
    get subscriberCount() {
      return listeners.size;
    },
  };
}
