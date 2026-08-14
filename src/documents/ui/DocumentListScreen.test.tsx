import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { DocumentRepository } from '../domain/documentRepository';
import { aDocument } from '../testing/documentBuilder';
import { DocumentListScreen } from './DocumentListScreen';
import { DocumentRepositoryProvider } from './documentRepositoryContext';

function renderScreen(repository: DocumentRepository) {
  return render(
    <DocumentRepositoryProvider repository={repository}>
      <DocumentListScreen />
    </DocumentRepositoryProvider>,
  );
}

describe('DocumentListScreen', () => {
  it('reports that documents are on their way', async () => {
    await renderScreen({ list: () => new Promise(() => {}) });

    expect(screen.getByLabelText('Loading documents')).toBeTruthy();
  });

  it('lists every document it received', async () => {
    await renderScreen({
      list: async () => [
        aDocument({ id: '1', title: 'Ten FIDY' }),
        aDocument({ id: '2', title: 'Arrogant Bastard Ale' }),
      ],
    });

    expect(await screen.findByText('Ten FIDY')).toBeTruthy();
    expect(screen.getByText('Arrogant Bastard Ale')).toBeTruthy();
  });

  it('shows the most recently created document first', async () => {
    await renderScreen({
      list: async () => [
        aDocument({
          id: 'older',
          title: 'Older',
          createdAt: new Date('2020-01-01T00:00:00Z'),
        }),
        aDocument({
          id: 'newer',
          title: 'Newer',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        }),
      ],
    });
    await screen.findByText('Newer');

    const titles = screen.getAllByLabelText('Document title');

    expect(titles.map((title) => title.props.children)).toEqual([
      'Newer',
      'Older',
    ]);
  });

  it('explains itself when the documents cannot be loaded', async () => {
    await renderScreen({
      list: async () => {
        throw new Error('The document server answered with status 500');
      },
    });

    expect(await screen.findByText('Could not load the documents')).toBeTruthy();
    expect(
      screen.getByText('The document server answered with status 500'),
    ).toBeTruthy();
  });

  it('says so when the server has no documents to offer', async () => {
    await renderScreen({ list: async () => [] });

    expect(await screen.findByText('There are no documents yet')).toBeTruthy();
  });
});
