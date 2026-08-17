import {
  NotificationListener,
  NotificationSource,
} from '../domain/notificationSource';
import { ConnectNotifications } from './webSocketConnection';

const DEFAULT_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

type TimerId = ReturnType<typeof setTimeout>;

export interface Schedule {
  setTimeout: (handler: () => void, ms: number) => TimerId;
  clearTimeout: (id: TimerId) => void;
}

interface ReconnectionConfig {
  delaysMs?: number[];
  schedule?: Schedule;
}

export function createReconnectingNotificationSource(
  connect: ConnectNotifications,
  {
    delaysMs = DEFAULT_DELAYS_MS,
    schedule = { setTimeout, clearTimeout },
  }: ReconnectionConfig = {},
): NotificationSource {
  return {
    subscribe(listener: NotificationListener) {
      let subscribed = true;
      let failures = 0;
      let disconnect: (() => void) | null = null;
      let retry: TimerId | null = null;

      const open = () => {
        disconnect = connect({
          // A socket that opens and dies a second later must not be mistaken
          // for one that never opened, so the ladder resets here and not on
          // the attempt itself.
          onOpen: () => {
            failures = 0;
          },
          onNotification: listener,
          onClosed: () => {
            disconnect = null;
            scheduleRetry();
          },
        });
      };

      const scheduleRetry = () => {
        if (!subscribed) {
          return;
        }

        const delay = delaysMs[Math.min(failures, delaysMs.length - 1)];
        failures += 1;

        retry = schedule.setTimeout(() => {
          retry = null;
          open();
        }, delay);
      };

      open();

      return () => {
        subscribed = false;

        if (retry !== null) {
          schedule.clearTimeout(retry);
          retry = null;
        }

        disconnect?.();
        disconnect = null;
      };
    },
  };
}
