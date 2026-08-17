import React, { createContext, ReactNode, useContext } from 'react';

import { NotificationSource } from '../domain/notificationSource';

export interface NotificationsDependencies {
  source: NotificationSource;
  subscribeToAppState: (listener: (isActive: boolean) => void) => () => void;
}

const NotificationsContext = createContext<NotificationsDependencies | null>(
  null,
);

interface NotificationsProviderProps {
  dependencies: NotificationsDependencies;
  children: ReactNode;
}

export function NotificationsProvider({
  dependencies,
  children,
}: NotificationsProviderProps) {
  return (
    <NotificationsContext.Provider value={dependencies}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsDependencies(): NotificationsDependencies {
  const dependencies = useContext(NotificationsContext);

  if (dependencies === null) {
    throw new Error(
      'Notification hooks must be used inside a NotificationsProvider',
    );
  }

  return dependencies;
}
