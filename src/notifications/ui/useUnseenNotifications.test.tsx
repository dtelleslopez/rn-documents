import { act, renderHook } from '@testing-library/react-native';
import React, { ReactNode } from 'react';

import { aFakeNotificationSource } from '../testing/notificationBuilder';
import { testNotificationsDependencies } from '../testing/testNotificationsDependencies';
import { NotificationsProvider } from './notificationsContext';
import { useUnseenNotifications } from './useUnseenNotifications';

function renderUseUnseenNotifications() {
  const notifications = aFakeNotificationSource();
  let announceAppState: (isActive: boolean) => void = () => {};

  const dependencies = testNotificationsDependencies({
    source: notifications.source,
    subscribeToAppState: (listener) => {
      announceAppState = listener;
      return () => {};
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <NotificationsProvider dependencies={dependencies}>
      {children}
    </NotificationsProvider>
  );

  return {
    notifications,
    goTo: (state: 'foreground' | 'background') =>
      act(async () => announceAppState(state === 'foreground')),
    rendered: renderHook(() => useUnseenNotifications(), { wrapper }),
  };
}

describe('useUnseenNotifications', () => {
  it('starts with nothing to see', async () => {
    const { rendered } = renderUseUnseenNotifications();
    const { result } = await rendered;

    expect(result.current.count).toBe(0);
  });

  it('counts every document other users create', async () => {
    const { notifications, rendered } = renderUseUnseenNotifications();
    const { result } = await rendered;

    await act(async () => {
      notifications.emit();
      notifications.emit();
    });

    expect(result.current.count).toBe(2);
  });

  it('goes back to zero once the user looks', async () => {
    const { notifications, rendered } = renderUseUnseenNotifications();
    const { result } = await rendered;

    await act(async () => notifications.emit());
    await act(async () => result.current.acknowledge());

    expect(result.current.count).toBe(0);
  });

  it('lets go of the source while the app is in the background', async () => {
    const { notifications, goTo, rendered } = renderUseUnseenNotifications();
    await rendered;

    await goTo('background');

    expect(notifications.subscriberCount).toBe(0);
  });

  it('ignores what happened while nobody was watching', async () => {
    const { notifications, goTo, rendered } = renderUseUnseenNotifications();
    const { result } = await rendered;

    await goTo('background');
    await act(async () => notifications.emit());

    expect(result.current.count).toBe(0);
  });

  it('listens again when the user comes back', async () => {
    const { notifications, goTo, rendered } = renderUseUnseenNotifications();
    const { result } = await rendered;

    await goTo('background');
    await goTo('foreground');
    await act(async () => notifications.emit());

    expect(result.current.count).toBe(1);
  });
});
