import React, { createContext, ReactNode, useContext } from 'react';

import { DocumentRepository } from '../domain/documentRepository';

const DocumentRepositoryContext = createContext<DocumentRepository | null>(null);

interface DocumentRepositoryProviderProps {
  repository: DocumentRepository;
  children: ReactNode;
}

/**
 * Hands the chosen repository implementation to the views, so that no component
 * ever needs to know whether documents come from the network or from the device.
 */
export function DocumentRepositoryProvider({
  repository,
  children,
}: DocumentRepositoryProviderProps) {
  return (
    <DocumentRepositoryContext.Provider value={repository}>
      {children}
    </DocumentRepositoryContext.Provider>
  );
}

export function useDocumentRepository(): DocumentRepository {
  const repository = useContext(DocumentRepositoryContext);

  if (repository === null) {
    throw new Error(
      'useDocumentRepository must be used inside a DocumentRepositoryProvider',
    );
  }

  return repository;
}
