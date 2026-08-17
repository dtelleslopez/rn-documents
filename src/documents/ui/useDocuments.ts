import { useCallback, useEffect, useRef, useState } from 'react';

import { listDocuments } from '../application/listDocuments';
import { Document } from '../domain/document';
import { useDocumentRepository } from './documentRepositoryContext';

export type DocumentsState =
  | { status: 'loading' }
  | { status: 'ready'; documents: Document[] }
  | { status: 'failed'; message: string };

interface UseDocumentsResult {
  state: DocumentsState;
  refresh: () => void;
}

export function useDocuments(): UseDocumentsResult {
  const repository = useDocumentRepository();
  const [state, setState] = useState<DocumentsState>({ status: 'loading' });

  // The server sends a fresh random collection every time, so a slow first load
  // landing after a refresh would replace newer data with older data.
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = latestRequest.current + 1;
    latestRequest.current = request;

    try {
      const documents = await listDocuments(repository);

      if (latestRequest.current === request) {
        setState({ status: 'ready', documents });
      }
    } catch (error) {
      if (latestRequest.current === request) {
        setState({ status: 'failed', message: messageOf(error) });
      }
    }
  }, [repository]);

  useEffect(() => {
    // The state updates happen after awaiting the repository, never during
    // this render pass.
    void (async () => {
      await load();
    })();
  }, [load]);

  return { state, refresh: load };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not load documents';
}
