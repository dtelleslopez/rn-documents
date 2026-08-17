import { renderHook } from '@testing-library/react-native';

import { useNotificationsDependencies } from './notificationsContext';

describe('useNotificationsDependencies', () => {
  it('fails loudly when no dependencies have been provided', async () => {
    // React logs the error it caught while rendering; the assertion below is
    // what matters, so keep the test output readable.
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      renderHook(() => useNotificationsDependencies()),
    ).rejects.toThrow(
      'Notification hooks must be used inside a NotificationsProvider',
    );

    error.mockRestore();
  });
});
