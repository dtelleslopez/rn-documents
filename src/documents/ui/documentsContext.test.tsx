import { renderHook } from '@testing-library/react-native';

import { useDocumentsDependencies } from './documentsContext';

describe('useDocumentsDependencies', () => {
  it('fails loudly when no dependencies have been provided', async () => {
    // React logs the error it caught while rendering; the assertion below is
    // what matters, so keep the test output readable.
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(renderHook(() => useDocumentsDependencies())).rejects.toThrow(
      'Documents hooks must be used inside a DocumentsProvider',
    );

    error.mockRestore();
  });
});
