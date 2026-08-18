export interface Contributor {
  id: string;
  name: string;
}

export interface Document {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  attachments: string[];
  contributors: Contributor[];
}

export interface DocumentDraft {
  title: string;
  version: string;
  attachments: string[];
}

export interface DocumentOrigin {
  id: string;
  createdAt: Date;
}

/**
 * Takes the identity and the clock reading as arguments so the caller owns
 * those side effects and this stays pure. Contributors start empty: the form
 * has no field for them and the app has no notion of a current user.
 */
export function newDocument(
  draft: DocumentDraft,
  { id, createdAt }: DocumentOrigin,
): Document {
  const title = draft.title.trim();

  if (title.length === 0) {
    throw new Error('A document needs a title');
  }

  return {
    id,
    title,
    version: draft.version.trim(),
    attachments: draft.attachments,
    createdAt,
    updatedAt: createdAt,
    contributors: [],
  };
}

