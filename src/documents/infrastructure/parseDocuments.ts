import { Contributor, Document } from '../domain/document';

export interface ParsedDocuments {
  documents: Document[];
  /** How many entries were dropped because they did not describe a document. */
  discarded: number;
}

/**
 * Anti-corruption layer between the challenge server and the domain.
 *
 * The server speaks Go-flavoured JSON (`PascalCase`, RFC 3339 timestamps) and
 * offers no schema guarantees, so nothing beyond this module is allowed to see
 * its shape. Entries that cannot be turned into a usable document are dropped
 * rather than failing the whole response: one broken record should not leave
 * the user staring at an error screen. The count of dropped entries is
 * reported so the caller can make the loss visible instead of silent.
 */
export function parseDocuments(payload: unknown): ParsedDocuments {
  if (!Array.isArray(payload)) {
    return { documents: [], discarded: 0 };
  }

  const documents: Document[] = [];
  let discarded = 0;

  for (const entry of payload) {
    const document = toDocument(entry);

    if (document === null) {
      discarded += 1;
      continue;
    }

    documents.push(document);
  }

  return { documents, discarded };
}

function toDocument(entry: unknown): Document | null {
  if (!isObject(entry)) {
    return null;
  }

  const id = entry.ID;
  const title = entry.Title;
  const createdAt = toDate(entry.CreatedAt);

  // Without an identity, a name and a creation date there is nothing worth
  // showing, so these three are the only ones that can discard a document.
  if (!isNonEmptyString(id) || !isNonEmptyString(title) || createdAt === null) {
    return null;
  }

  return {
    id,
    title: title.trim(),
    createdAt,
    updatedAt: toDate(entry.UpdatedAt) ?? createdAt,
    version: isNonEmptyString(entry.Version) ? entry.Version : '',
    attachments: toStringList(entry.Attachments),
    contributors: toContributors(entry.Contributors),
  };
}

function toContributors(value: unknown): Contributor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isObject(entry)) {
      return [];
    }

    const id = entry.ID;
    const name = entry.Name;

    if (!isNonEmptyString(id) || !isNonEmptyString(name)) {
      return [];
    }

    return [{ id, name }];
  });
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isNonEmptyString) : [];
}

/** Returns null for anything JavaScript cannot read as a point in time. */
function toDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
