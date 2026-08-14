import { renderHook } from '@testing-library/react-native';

import { useDocumentRepository } from './documentRepositoryContext';

describe('useDocumentRepository', () => {
  it('fails loudly when no repository has been provided', async () => {
    // React logs the error it caught while rendering; the assertion below is
    // what matters, so keep the test output readable.
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(renderHook(() => useDocumentRepository())).rejects.toThrow(
      'useDocumentRepository must be used inside a DocumentRepositoryProvider',
    );

    error.mockRestore();
  });
});
