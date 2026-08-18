import { act, fireEvent, render, screen } from '@testing-library/react-native';
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

  it('refuses a second submit while the first is still being saved', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    await renderSheet({ onSubmit });

    await type('Name', 'Quarterly report');
    // Both taps in the same frame, before the button repaints as disabled.
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Submit'));
      fireEvent.press(screen.getByLabelText('Submit'));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => resolveSubmit());
  });

  it('lets the user remove an attachment picked by mistake', async () => {
    const onSubmit = jest.fn();
    const picked = ['contract.pdf', 'notes.txt'];
    let picks = 0;
    await renderSheet({ onSubmit, pickFile: async () => picked[picks++] });

    await type('Name', 'Quarterly report');
    await fireEvent.press(screen.getByRole('button', { name: 'Choose file' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Choose file' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove contract.pdf' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: ['notes.txt'] }),
    );
  });

  it('keeps two attachments that share a name apart', async () => {
    await renderSheet({ pickFile: async () => 'contract.pdf' });

    await fireEvent.press(screen.getByRole('button', { name: 'Choose file' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Choose file' }));

    expect(screen.getAllByText('contract.pdf')).toHaveLength(2);
  });

  it('treats a picker that fails like one that was dismissed', async () => {
    const onSubmit = jest.fn();
    await renderSheet({
      onSubmit,
      pickFile: async () => {
        throw new Error('the picker crashed');
      },
    });

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

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('closes from a tap outside the sheet', async () => {
    const onDismiss = jest.fn();
    await renderSheet({ onDismiss });

    await fireEvent.press(screen.getByTestId('add-document-backdrop'));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('keeps the draft when closed, for the next time it opens', async () => {
    await renderSheet();

    await type('Name', 'Half-written');
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByLabelText('Name').props.value).toBe('Half-written');
  });

  it('drops the failure notice when closed, but not the draft', async () => {
    await renderSheet({
      onSubmit: async () => {
        throw new Error('the disk is full');
      },
    });

    await type('Name', 'Kitchen notes');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Submit'));
    });
    await screen.findByText('Could not save the document');

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Could not save the document')).toBeNull();
    expect(screen.getByLabelText('Name').props.value).toBe('Kitchen notes');
  });

  it('stays open and says so when the document could not be saved', async () => {
    await render(
      <AddDocumentSheet
        visible
        onSubmit={async () => {
          throw new Error('the disk is full');
        }}
        onDismiss={() => {}}
        pickFile={async () => null}
      />,
    );

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Kitchen notes');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Submit'));
    });

    expect(screen.getByText('Could not save the document')).toBeTruthy();
    expect(screen.getByLabelText('Name').props.value).toBe('Kitchen notes');
  });
});
