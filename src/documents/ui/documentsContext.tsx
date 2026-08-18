import React, { createContext, ReactNode, useContext } from 'react';

import { DocumentsReader } from '../domain/documentsReader';
import { DocumentStore } from '../domain/documentStore';

export interface DocumentsDependencies {
  reader: DocumentsReader;
  store: DocumentStore;
  newId: () => string;
  now: () => Date;
  pickFile: () => Promise<string | null>;
}

const DocumentsContext = createContext<DocumentsDependencies | null>(null);

interface DocumentsProviderProps {
  dependencies: DocumentsDependencies;
  children: ReactNode;
}

export function DocumentsProvider({
  dependencies,
  children,
}: DocumentsProviderProps) {
  return (
    <DocumentsContext.Provider value={dependencies}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocumentsDependencies(): DocumentsDependencies {
  const dependencies = useContext(DocumentsContext);

  if (dependencies === null) {
    throw new Error(
      'Documents hooks must be used inside a DocumentsProvider',
    );
  }

  return dependencies;
}
