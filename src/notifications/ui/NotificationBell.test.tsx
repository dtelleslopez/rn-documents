import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { NotificationBell } from './NotificationBell';

describe('NotificationBell', () => {
  it('says how many documents are waiting to be seen', async () => {
    await render(<NotificationBell count={3} onPress={() => {}} />);

    expect(screen.getByLabelText('Notifications, 3 unseen')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows no badge when there is nothing new', async () => {
    await render(<NotificationBell count={0} onPress={() => {}} />);

    expect(screen.getByLabelText('Notifications, none unseen')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('keeps a long burst readable', async () => {
    await render(<NotificationBell count={137} onPress={() => {}} />);

    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('tells the screen the user looked', async () => {
    const looks: number[] = [];
    await render(<NotificationBell count={2} onPress={() => looks.push(1)} />);

    fireEvent.press(screen.getByLabelText('Notifications, 2 unseen'));

    expect(looks).toHaveLength(1);
  });
});
