import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { DocumentDraft } from '../domain/document';
import { AddDocumentSheet } from './AddDocumentSheet';

interface Overrides {
  onSubmit?: (draft: DocumentDraft) => void;
  onDismiss?: () => void;
  pickFile?: () => Promise<string | null>;
}

function renderSheet({ onSubmit, onDismiss, pickFile }: Overrides = {}) {
  return render(
    <AddDocumentSheet
      visible
      onSubmit={onSubmit ?? jest.fn()}
      onDismiss={onDismiss ?? jest.fn()}
      pickFile={pickFile ?? (async () => null)}
    />,
  );
}

async function type(label: string, text: string) {
  await fireEvent.changeText(screen.getByLabelText(label), text);
}

describe('AddDocumentSheet', () => {
  it('hands over what the user filled in', async () => {
    const onSubmit = jest.fn();
    await renderSheet({ onSubmit });

    await type('Name', 'Quarterly report');
    await type('Version', '1.0.0');
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Quarterly report',
      version: '1.0.0',
      attachments: [],
    });
  });

  it('refuses to submit until a name has been typed', async () => {
    const onSubmit = jest.fn();
    await renderSheet({ onSubmit });

    await type('Version', '1.0.0');
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the submit button as unavailable while the name is empty', async () => {
    await renderSheet();

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('attaches the file the user picked', async () => {
    const onSubmit = jest.fn();
    await renderSheet({ onSubmit, pickFile: async () => 'contract.pdf' });

    await type('Name', 'Quarterly report');
    await fireEvent.press(screen.getByRole('button', { name: 'Choose file' }));

    expect(await screen.findByText('contract.pdf')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: ['contract.pdf'] }),
    );
  });

  it('leaves the attachments alone when the user picks nothing', async () => {
    const onSubmit = jest.fn();
    await renderSheet({ onSubmit, pickFile: async () => null });

    await type('Name', 'Quarterly report');
    await fireEvent.press(screen.getByRole('button', { name: 'Choose file' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: [] }),
    );
  });

  it('closes when the user dismisses it', async () => {
    const onDismiss = jest.fn();
    await renderSheet({ onDismiss });

    await fireEvent.press(
      screen.getByRole('button', { name: 'Close without saving' }),
    );

    expect(onDismiss).toHaveBeenCalled();
  });
});
