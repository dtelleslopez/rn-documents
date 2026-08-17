import * as DocumentPicker from 'expo-document-picker';

import { pickDocumentFileName } from './pickDocumentFileName';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const getDocumentAsync = DocumentPicker.getDocumentAsync as jest.MockedFunction<
  typeof DocumentPicker.getDocumentAsync
>;

function picked(names: string[]) {
  return {
    canceled: false,
    assets: names.map((name) => ({
      name,
      uri: `file:///tmp/${name}`,
      size: 1024,
      mimeType: 'application/pdf',
      lastModified: 0,
    })),
  } satisfies Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
}

describe('pickDocumentFileName', () => {
  it('returns the name of the file the user chose', async () => {
    getDocumentAsync.mockResolvedValue(picked(['contract.pdf']));

    expect(await pickDocumentFileName()).toBe('contract.pdf');
  });

  it('returns nothing when the user backs out', async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    } satisfies Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>);

    expect(await pickDocumentFileName()).toBeNull();
  });

  it('returns nothing when the picker reports success but no file', async () => {
    getDocumentAsync.mockResolvedValue(picked([]));

    expect(await pickDocumentFileName()).toBeNull();
  });
});
