import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { NotificationSource } from '../../notifications/domain/notificationSource';
import { aFakeNotificationSource } from '../../notifications/testing/notificationBuilder';
import { testNotificationsDependencies } from '../../notifications/testing/testNotificationsDependencies';
import { NotificationsProvider } from '../../notifications/ui/notificationsContext';
import { DocumentRepository } from '../domain/documentRepository';
import { createCompositeDocumentRepository } from '../infrastructure/compositeDocumentRepository';
import { createInMemoryDocumentStore } from '../infrastructure/inMemoryDocumentStore';
import { aDocument } from '../testing/documentBuilder';
import { testDependencies } from '../testing/testDependencies';
import { DocumentListScreen } from './DocumentListScreen';
import { DocumentsProvider } from './documentsContext';

function renderWithProviders(
  dependencies: ReturnType<typeof testDependencies>,
  source: NotificationSource = aFakeNotificationSource().source,
) {
  return render(
    <DocumentsProvider dependencies={dependencies}>
      <NotificationsProvider
        dependencies={testNotificationsDependencies({ source })}
      >
        <DocumentListScreen />
      </NotificationsProvider>
    </DocumentsProvider>,
  );
}

// Wired like production: the screen reads through the composite, so documents
// created locally have to surface without the server knowing about them.
function renderScreen(remote: DocumentRepository, source?: NotificationSource) {
  const store = createInMemoryDocumentStore();

  return renderWithProviders(
    testDependencies({
      store,
      repository: createCompositeDocumentRepository([remote, store]),
    }),
    source,
  );
}

// For the states the screen must render, driven straight from one repository.
// Going through the composite would mask a failure, since the local store keeps
// answering and the composite degrades to a partial result on purpose.
function renderScreenReadingFrom(repository: DocumentRepository) {
  return renderWithProviders(testDependencies({ repository }));
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

describe('DocumentListScreen notifications', () => {
  it('shows how many documents other users have created', async () => {
    const notifications = aFakeNotificationSource();
    await renderScreen({ list: async () => [] }, notifications.source);

    await act(async () => notifications.emit());

    expect(
      await screen.findByLabelText('Notifications, 1 unseen'),
    ).toBeTruthy();
  });

  it('clears the badge once the user looks at it', async () => {
    const notifications = aFakeNotificationSource();
    await renderScreen({ list: async () => [] }, notifications.source);

    await act(async () => notifications.emit());
    await fireEvent.press(
      await screen.findByLabelText('Notifications, 1 unseen'),
    );

    expect(screen.getByLabelText('Notifications, none unseen')).toBeTruthy();
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

  it('leaves the badge alone when the user creates a document', async () => {
    const notifications = aFakeNotificationSource();
    await renderScreen({ list: async () => [] }, notifications.source);
    await screen.findByText('There are no documents yet');

    await fireEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'My report');
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));
    await screen.findByText('My report');

    expect(screen.getByLabelText('Notifications, none unseen')).toBeTruthy();
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

describe('DocumentListScreen sorting and layout', () => {
  const alphabet = [
    aDocument({
      id: 'stone',
      title: 'Stone IPA',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    }),
    aDocument({
      id: 'hop',
      title: 'Hop Rod Rye',
      createdAt: new Date('2020-01-01T00:00:00Z'),
    }),
  ];

  function shownTitles(): unknown[] {
    return screen
      .getAllByLabelText('Document title')
      .map((title) => title.props.children);
  }

  async function pickOrder(label: string) {
    await fireEvent.press(screen.getByLabelText('Sort by'));
    await fireEvent.press(await screen.findByLabelText(label));
  }

  // Every call to the server answers with a different random collection, so
  // reordering by fetching again would shuffle the list instead of sorting it.
  it('reorders what is already on screen, without asking the server again', async () => {
    let calls = 0;
    await renderScreen({
      list: async () => {
        calls += 1;
        return alphabet;
      },
    });
    await screen.findByText('Stone IPA');

    await pickOrder('Name A-Z');

    expect(shownTitles()).toEqual(['Hop Rod Rye', 'Stone IPA']);
    expect(calls).toBe(1);
  });

  it('goes back to the newest first when asked', async () => {
    await renderScreen({ list: async () => alphabet });
    await screen.findByText('Stone IPA');

    await pickOrder('Name A-Z');
    await pickOrder('Newest first');

    expect(shownTitles()).toEqual(['Stone IPA', 'Hop Rod Rye']);
  });

  it('keeps the toolbar in place when there is nothing to sort', async () => {
    await renderScreen({ list: async () => [] });
    await screen.findByText('There are no documents yet');

    expect(screen.getByLabelText('Sort by')).toBeTruthy();
    expect(screen.getByLabelText('Show as grid')).toBeTruthy();
  });

  it('drops the details when the documents go side by side', async () => {
    await renderScreen({
      list: async () => [
        aDocument({
          title: 'Stone IPA',
          contributors: [{ id: 'first', name: 'Lencra Boyer' }],
        }),
      ],
    });
    await screen.findByText('Stone IPA');

    await fireEvent.press(screen.getByLabelText('Show as grid'));

    expect(screen.getByText('Stone IPA')).toBeTruthy();
    expect(screen.queryByText('Lencra Boyer')).toBeNull();
  });
});
