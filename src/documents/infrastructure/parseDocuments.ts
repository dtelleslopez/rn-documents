import { Contributor, Document } from '../domain/document';

export interface ParsedDocuments {
  documents: Document[];
  discarded: number;
}

/**
 * Unreadable entries are dropped rather than failing the whole response, so one
 * broken record does not leave the user on an error screen. `discarded` says
 * how many were lost; the adapters log it as a developer trace, deliberately
 * not on screen — it would name a loss the user can do nothing about.
 *
 * Takes the entries rather than the raw payload: whether a payload that is not
 * a list at all is an error or a fresh start is the caller's decision.
 */
export function parseDocuments(entries: unknown[]): ParsedDocuments {
  const documents: Document[] = [];
  let discarded = 0;

  for (const entry of entries) {
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
