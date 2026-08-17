import { NotificationsDependencies } from '../ui/notificationsContext';
import { aFakeNotificationSource } from './notificationBuilder';

export function testNotificationsDependencies(
  overrides: Partial<NotificationsDependencies> = {},
): NotificationsDependencies {
  return {
    source: aFakeNotificationSource().source,
    subscribeToAppState: () => () => {},
    ...overrides,
  };
}
