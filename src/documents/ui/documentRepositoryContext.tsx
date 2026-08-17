import React, { createContext, ReactNode, useContext } from 'react';

import { DocumentRepository } from '../domain/documentRepository';

const DocumentRepositoryContext = createContext<DocumentRepository | null>(null);

interface DocumentRepositoryProviderProps {
  repository: DocumentRepository;
  children: ReactNode;
}

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
