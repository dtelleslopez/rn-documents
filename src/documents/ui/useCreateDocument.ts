import { useCallback } from 'react';

import { createDocument } from '../application/createDocument';
import { Document, DocumentDraft } from '../domain/document';
import { useDocumentsDependencies } from './documentsContext';

interface UseCreateDocumentResult {
  create: (draft: DocumentDraft) => Promise<Document>;
}

export function useCreateDocument(): UseCreateDocumentResult {
  const { store, newId, now } = useDocumentsDependencies();

  const create = useCallback(
    (draft: DocumentDraft) => createDocument({ store, newId, now }, draft),
    [store, newId, now],
  );

  return { create };
}
