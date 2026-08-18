import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { DocumentCardLayout } from './DocumentCard';
import { DocumentListToolbar } from './DocumentListToolbar';

async function renderToolbar(layout: DocumentCardLayout = 'list') {
  const layouts: DocumentCardLayout[] = [];
  const sortRequests: number[] = [];

  await render(
    <DocumentListToolbar
      layout={layout}
      onLayoutChange={(next) => layouts.push(next)}
      onSortPress={() => sortRequests.push(1)}
    />,
  );

  return { layouts, sortRequests };
}

describe('DocumentListToolbar', () => {
  it('marks the layout in use', async () => {
    await renderToolbar('grid');

    expect(
      screen.getByRole('button', { name: 'Show as grid', selected: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Show as list', selected: false }),
    ).toBeTruthy();
  });

  it('asks for the other layout', async () => {
    const { layouts } = await renderToolbar('list');

    fireEvent.press(screen.getByLabelText('Show as grid'));

    expect(layouts).toEqual(['grid']);
  });

  it('opens the sort options', async () => {
    const { sortRequests } = await renderToolbar();

    fireEvent.press(screen.getByLabelText('Sort by'));

    expect(sortRequests).toHaveLength(1);
  });
});
