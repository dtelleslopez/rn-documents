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

/**
 * Adapts the `listDocuments` use case to React.
 *
 * The state is a discriminated union rather than a bag of booleans, so a view
 * cannot render a list and an error at the same time, and cannot forget a case.
 */
export function useDocuments(): UseDocumentsResult {
  const repository = useDocumentRepository();
  const [state, setState] = useState<DocumentsState>({ status: 'loading' });

  // Answers to superseded requests must be dropped: the server sends a fresh
  // random collection every time, so a slow first load landing after a refresh
  // would silently replace newer data with older data.
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
    // Kept behind an async boundary: the state updates happen after awaiting
    // the repository, never during this render pass.
    void (async () => {
      await load();
    })();
  }, [load]);

  return { state, refresh: load };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not load documents';
}
