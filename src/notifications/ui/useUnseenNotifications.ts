import { useCallback, useEffect, useState } from 'react';

import { useNotificationsDependencies } from './notificationsContext';

interface UseUnseenNotificationsResult {
  count: number;
  acknowledge: () => void;
}

export function useUnseenNotifications(): UseUnseenNotificationsResult {
  const { source, subscribeToAppState } = useNotificationsDependencies();
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => subscribeToAppState(setIsActive), [subscribeToAppState]);

  // Dropping the subscription in the background is what makes the reconnecting
  // source close the socket; coming back reopens it with no extra code.
  useEffect(() => {
    if (!isActive) {
      return;
    }

    return source.subscribe(() => setCount((seen) => seen + 1));
  }, [source, isActive]);

  const acknowledge = useCallback(() => setCount(0), []);

  return { count, acknowledge };
}
