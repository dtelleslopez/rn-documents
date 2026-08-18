import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { aDocument } from '../testing/documentBuilder';
import { DocumentCard } from './DocumentCard';

describe('DocumentCard', () => {
  it('names the document and the version it is at', async () => {
    await render(
      <DocumentCard document={aDocument({ title: 'Hop Rod Rye', version: '2.6.16' })} />,
    );

    expect(screen.getByLabelText('Document title')).toHaveTextContent('Hop Rod Rye');
    expect(screen.getByText('Version 2.6.16')).toBeTruthy();
  });

  // The form lets a document through without a version, and a bare "Version"
  // label with nothing after it reads as a bug.
  it('says nothing about the version when there is none', async () => {
    await render(<DocumentCard document={aDocument({ version: '' })} />);

    expect(screen.queryByText(/Version/)).toBeNull();
  });

  it('lists who contributed and what is attached', async () => {
    await render(
      <DocumentCard
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
        document={aDocument({ contributors: [], attachments: ['Stout'] })}
      />,
    );

    expect(screen.queryByText('Contributors')).toBeNull();
    expect(screen.getByText('Attachments')).toBeTruthy();
  });

  it('shows nothing but the title for a document just created', async () => {
    await render(
      <DocumentCard
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
