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
      reader: createCompositeDocumentRepository([remote, store]),
    }),
    source,
  );
}

// For the states the screen must render when the server is the only source.
// With the local store alongside it, a failing server is a partial reading
// rather than a failed one, which is a different state on purpose.
function renderScreenReadingFrom(repository: DocumentRepository) {
  return renderWithProviders(
    testDependencies({
      reader: createCompositeDocumentRepository([repository]),
    }),
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

describe('DocumentListScreen refreshing', () => {
  function refreshControl() {
    return screen.getByLabelText('Documents list').props.refreshControl;
  }

  it('asks the server again when the user pulls the list', async () => {
    let calls = 0;
    await renderScreen({
      list: async () => {
        calls += 1;
        return [aDocument({ title: calls === 1 ? 'First' : 'Second' })];
      },
    });
    await screen.findByText('First');

    // Driven through the control the list actually received. Firing 'refresh'
    // on the list instead would be caught by the onRefresh prop of the
    // surrounding component and prove nothing about this wiring.
    await act(async () => refreshControl().props.onRefresh());

    expect(calls).toBe(2);
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('spins while the pull is in flight, and stops when it lands', async () => {
    let releaseReload = () => {};
    let calls = 0;
    await renderScreen({
      list: async () => {
        calls += 1;

        if (calls > 1) {
          await new Promise<void>((resolve) => {
            releaseReload = resolve;
          });
        }

        return [aDocument({ title: 'Ten FIDY' })];
      },
    });
    await screen.findByText('Ten FIDY');

    await act(async () => {
      refreshControl().props.onRefresh();
    });

    expect(refreshControl().props.refreshing).toBe(true);

    await act(async () => releaseReload());

    expect(refreshControl().props.refreshing).toBe(false);
  });

  // Without this the app is stuck: a server that is down at launch leaves a
  // screen with nothing to press.
  it('retries after a failure', async () => {
    let calls = 0;
    await renderScreenReadingFrom({
      list: async () => {
        calls += 1;

        if (calls === 1) {
          throw new Error('The document server answered with status 500');
        }

        return [aDocument({ title: 'Back online' })];
      },
    });
    await screen.findByText('Could not load the documents');

    await fireEvent.press(screen.getByLabelText('Try again'));

    expect(await screen.findByText('Back online')).toBeTruthy();
  });

  // Creating a document reloads the list too, and the pull indicator there
  // would look like the app went to the server for something the user did
  // locally.
  it('leaves the pull indicator alone when a document is created', async () => {
    // The reload that follows a creation is left hanging, so the indicator is
    // observed while it would be spinning rather than after it settled.
    let releaseReload = () => {};
    let calls = 0;
    await renderScreen({
      list: async () => {
        calls += 1;

        if (calls > 1) {
          await new Promise<void>((resolve) => {
            releaseReload = resolve;
          });
        }

        return [aDocument({ title: 'Ten FIDY' })];
      },
    });
    await screen.findByText('Ten FIDY');

    await fireEvent.press(screen.getByLabelText('Add document'));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Notes');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Submit'));
    });

    expect(refreshControl().props.refreshing).toBe(false);

    await act(async () => releaseReload());
  });
});

describe('DocumentListScreen partial readings', () => {
  const unreachable = {
    list: async () => {
      throw new Error('The document server did not answer within 10000ms');
    },
  };

  // The local store keeps answering when the server does not, so without this
  // the screen would claim there is nothing rather than admit it could not ask.
  it('admits it could not reach the server instead of showing an empty list', async () => {
    await renderScreen(unreachable);

    expect(await screen.findByText('Could not reach the server')).toBeTruthy();
    expect(screen.queryByText('There are no documents yet')).toBeNull();
  });

  it('keeps showing the documents it does have', async () => {
    const store = createInMemoryDocumentStore();
    await store.add(aDocument({ title: 'Kitchen notes' }));

    await renderWithProviders(
      testDependencies({
        store,
        reader: createCompositeDocumentRepository([unreachable, store]),
      }),
    );

    expect(await screen.findByText('Kitchen notes')).toBeTruthy();
    expect(screen.getByText('Could not reach the server')).toBeTruthy();
  });

  it('says nothing when every source answered', async () => {
    await renderScreen({ list: async () => [aDocument({ title: 'Ten FIDY' })] });
    await screen.findByText('Ten FIDY');

    expect(screen.queryByText('Could not reach the server')).toBeNull();
  });

  it('drops the warning once the server answers again', async () => {
    let calls = 0;
    await renderScreen({
      list: async () => {
        calls += 1;

        if (calls === 1) {
          throw new Error('The document server did not answer within 10000ms');
        }

        return [aDocument({ title: 'Back online' })];
      },
    });
    await screen.findByText('Could not reach the server');

    await fireEvent.press(screen.getByLabelText('Try again'));

    expect(await screen.findByText('Back online')).toBeTruthy();
    expect(screen.queryByText('Could not reach the server')).toBeNull();
  });
});

describe('DocumentListScreen when a document cannot be stored', () => {
  it('keeps the sheet open with what the user typed', async () => {
    const store = createInMemoryDocumentStore();
    await renderWithProviders(
      testDependencies({
        store: {
          list: store.list,
          add: async () => {
            throw new Error('the disk is full');
          },
        },
        reader: createCompositeDocumentRepository([store]),
      }),
    );

    await fireEvent.press(screen.getByLabelText('Add document'));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Kitchen notes');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Submit'));
    });

    expect(screen.getByText('Could not save the document')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Kitchen notes');
  });
});
