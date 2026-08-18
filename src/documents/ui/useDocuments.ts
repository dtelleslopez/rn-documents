import { useCallback, useEffect, useRef, useState } from 'react';

import { Document } from '../domain/document';
import { useDocumentsDependencies } from './documentsContext';

export type DocumentsState =
  | { status: 'loading' }
  | { status: 'ready'; documents: Document[]; incomplete: boolean }
  | { status: 'failed'; message: string };

interface UseDocumentsResult {
  state: DocumentsState;
  refresh: () => Promise<void>;
  insert: (document: Document) => void;
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
      const { documents, incomplete } = await reader.read();

      if (latestRequest.current === request) {
        setState({ status: 'ready', documents, incomplete });
      }
    } catch (error) {
      if (latestRequest.current === request) {
        setState({ status: 'failed', message: messageOf(error) });
      }
    }
  }, [reader]);

  // A document created here is already in the local store: asking the server
  // for it again would answer with a different random collection, and the
  // list would change under the user right after they added to it.
  const insert = useCallback(
    (document: Document) => {
      if (state.status !== 'ready') {
        // Nothing on screen to place it into. Reading again shows it, since
        // the store now has it to offer.
        void load();
        return;
      }

      // A reading still in flight predates the creation and may not contain
      // it, so it is not allowed to land on top of this.
      latestRequest.current += 1;

      setState((current) =>
        current.status === 'ready'
          ? { ...current, documents: [...current.documents, document] }
          : current,
      );
    },
    [state.status, load],
  );

  useEffect(() => {
    // The state updates happen after awaiting the repository, never during
    // this render pass.
    void (async () => {
      await load();
    })();
  }, [load]);

  return { state, refresh: load, insert };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not load documents';
}
