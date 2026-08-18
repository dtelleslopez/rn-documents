import { useCallback, useEffect, useRef, useState } from 'react';

import { listDocuments } from '../application/listDocuments';
import { Document } from '../domain/document';
import { useDocumentsDependencies } from './documentsContext';

export type DocumentsState =
  | { status: 'loading' }
  | { status: 'ready'; documents: Document[]; incomplete: boolean }
  | { status: 'failed'; message: string };

interface UseDocumentsResult {
  state: DocumentsState;
  refresh: () => Promise<void>;
}

export function useDocuments(): UseDocumentsResult {
  const { reader } = useDocumentsDependencies();
  const [state, setState] = useState<DocumentsState>({ status: 'loading' });

  // The server sends a fresh random collection every time, so a slow first load
  // landing after a refresh would replace newer data with older data.
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = latestRequest.current + 1;
    latestRequest.current = request;

    // Retrying after a failure starts the screen over: keeping the old error
    // up would make the tap look like it did nothing. A refresh over a ready
    // list keeps the list, since blanking it would punish the gesture.
    setState((current) =>
      current.status === 'failed' ? { status: 'loading' } : current,
    );

    try {
      const { documents, incomplete } = await listDocuments(reader);

      if (latestRequest.current === request) {
        setState({ status: 'ready', documents, incomplete });
      }
    } catch (error) {
      if (latestRequest.current === request) {
        setState({ status: 'failed', message: messageOf(error) });
      }
    }
  }, [reader]);

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
