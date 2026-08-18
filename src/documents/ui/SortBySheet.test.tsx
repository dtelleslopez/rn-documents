import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { DocumentOrder } from '../domain/documentOrder';
import { SortBySheet } from './SortBySheet';

async function renderSheet(
  overrides: Partial<React.ComponentProps<typeof SortBySheet>> = {},
) {
  const picked: DocumentOrder[] = [];
  const dismissals: number[] = [];

  await render(
    <SortBySheet
      visible
      order="newest"
      onSelect={(order) => picked.push(order)}
      onDismiss={() => dismissals.push(1)}
      {...overrides}
    />,
  );

  return { picked, dismissals };
}

describe('SortBySheet', () => {
  it('offers every order and marks the one in use', async () => {
    await renderSheet({ order: 'name-asc' });

    expect(screen.getByRole('button', { name: 'Newest first' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Oldest first' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Name Z-A' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Name A-Z', selected: true }),
    ).toBeTruthy();
  });

  it('reports the order the user picked', async () => {
    const { picked } = await renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Oldest first' }));

    expect(picked).toEqual(['oldest']);
  });

  it('closes without reordering anything', async () => {
    const { picked, dismissals } = await renderSheet();

    fireEvent.press(screen.getByLabelText('Close sort options'));

    expect(dismissals).toHaveLength(1);
    expect(picked).toEqual([]);
  });
});
