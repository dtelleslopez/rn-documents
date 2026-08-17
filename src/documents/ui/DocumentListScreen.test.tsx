import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { DocumentRepository } from '../domain/documentRepository';
import { createCompositeDocumentRepository } from '../infrastructure/compositeDocumentRepository';
import { createInMemoryDocumentStore } from '../infrastructure/inMemoryDocumentStore';
import { aDocument } from '../testing/documentBuilder';
import { testDependencies } from '../testing/testDependencies';
import { DocumentListScreen } from './DocumentListScreen';
import { DocumentsProvider } from './documentsContext';

// Wired like production: the screen reads through the composite, so documents
// created locally have to surface without the server knowing about them.
function renderScreen(remote: DocumentRepository) {
  const store = createInMemoryDocumentStore();
  const dependencies = testDependencies({
    store,
    repository: createCompositeDocumentRepository([remote, store]),
  });

  return render(
    <DocumentsProvider dependencies={dependencies}>
      <DocumentListScreen />
    </DocumentsProvider>,
  );
}

// For the states the screen must render, driven straight from one repository.
// Going through the composite would mask a failure, since the local store keeps
// answering and the composite degrades to a partial result on purpose.
function renderScreenReadingFrom(repository: DocumentRepository) {
  return render(
    <DocumentsProvider dependencies={testDependencies({ repository })}>
      <DocumentListScreen />
    </DocumentsProvider>,
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
    await renderScreenReadingFrom({
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

describe('DocumentListScreen creation', () => {
  it('offers to add a document even while the list is failing', async () => {
    await renderScreenReadingFrom({
      list: async () => {
        throw new Error('the server is down');
      },
    });
    await screen.findByText('Could not load the documents');

    expect(screen.getByRole('button', { name: 'Add document' })).toBeTruthy();
  });

  it('shows the created document in the list without a server round trip', async () => {
    await renderScreen({ list: async () => [] });
    await screen.findByText('There are no documents yet');

    await fireEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'My report');
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('My report')).toBeTruthy();
  });

  it('closes the sheet once the document has been created', async () => {
    await renderScreen({ list: async () => [] });
    await screen.findByText('There are no documents yet');

    await fireEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'My report');
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    await screen.findByText('My report');

    expect(screen.queryByText('Document information')).toBeNull();
  });
});
