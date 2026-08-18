import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { aDocument } from '../testing/documentBuilder';
import { DocumentCard } from './DocumentCard';

const NOW = new Date('2026-08-18T12:00:00Z');

describe('DocumentCard', () => {
  it('names the document and the version it is at', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        document={aDocument({ title: 'Hop Rod Rye', version: '2.6.16' })}
      />,
    );

    expect(screen.getByLabelText('Document title')).toHaveTextContent('Hop Rod Rye');
    expect(screen.getByText('Version 2.6.16')).toBeTruthy();
  });

  // The form lets a document through without a version, and a bare "Version"
  // label with nothing after it reads as a bug.
  it('says nothing about the version when there is none', async () => {
    await render(<DocumentCard now={NOW}
        onShare={() => {}} document={aDocument({ version: '' })} />);

    expect(screen.queryByText(/Version/)).toBeNull();
  });

  it('says how long ago it was created', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        document={aDocument({ createdAt: new Date('2026-08-18T09:00:00Z') })}
      />,
    );

    expect(screen.getByText('3 hours ago')).toBeTruthy();
  });

  it('says it side by side too, so a document reads the same either way', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        layout="grid"
        document={aDocument({ createdAt: new Date('2026-08-18T09:00:00Z') })}
      />,
    );

    expect(screen.getByText('3 hours ago')).toBeTruthy();
  });

  it('lists who contributed and what is attached', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        document={aDocument({
          contributors: [
            { id: 'first', name: 'Carlie Abott' },
            { id: 'second', name: 'Zoe Buckridge' },
          ],
          attachments: ['Light Lager', 'Porter'],
        })}
      />,
    );

    expect(screen.getByText('Contributors')).toBeTruthy();
    expect(screen.getByText('Carlie Abott')).toBeTruthy();
    expect(screen.getByText('Zoe Buckridge')).toBeTruthy();

    expect(screen.getByText('Attachments')).toBeTruthy();
    expect(screen.getByText('Light Lager')).toBeTruthy();
    expect(screen.getByText('Porter')).toBeTruthy();
  });

  // Documents created in the app never have contributors, so an empty heading
  // would be the common case rather than the exception.
  it('leaves out the sections nobody filled in', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        document={aDocument({ contributors: [], attachments: ['Stout'] })}
      />,
    );

    expect(screen.queryByText('Contributors')).toBeNull();
    expect(screen.getByText('Attachments')).toBeTruthy();
  });

  // Side by side there is half the width, and the mockup spends it on the two
  // things that tell one document from another.
  it('keeps only the name and the version when laid out side by side', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        layout="grid"
        document={aDocument({
          title: 'Stone IPA',
          version: '3.8.11',
          contributors: [{ id: 'first', name: 'Lencra Boyer' }],
          attachments: ['Stout'],
        })}
      />,
    );

    expect(screen.getByLabelText('Document title')).toHaveTextContent('Stone IPA');
    expect(screen.getByText('Version 3.8.11')).toBeTruthy();
    expect(screen.queryByText('Contributors')).toBeNull();
    expect(screen.queryByText('Lencra Boyer')).toBeNull();
    expect(screen.queryByText('Attachments')).toBeNull();
  });

  it('hands the document over when the user shares it', async () => {
    const onShare = jest.fn();
    const document = aDocument({ title: 'Kitchen notes' });
    await render(<DocumentCard now={NOW} onShare={onShare} document={document} />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Share Kitchen notes' }),
    );

    expect(onShare).toHaveBeenCalledWith(document);
  });

  it('offers to share it side by side too', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        layout="grid"
        document={aDocument({ title: 'Kitchen notes' })}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Share Kitchen notes' }),
    ).toBeTruthy();
  });

  it('shows nothing but the title for a document just created', async () => {
    await render(
      <DocumentCard
        now={NOW}
        onShare={() => {}}
        document={aDocument({
          title: 'Notes',
          contributors: [],
          attachments: [],
        })}
      />,
    );

    expect(screen.getByLabelText('Document title')).toHaveTextContent('Notes');
    expect(screen.queryByText('Contributors')).toBeNull();
    expect(screen.queryByText('Attachments')).toBeNull();
  });
});
