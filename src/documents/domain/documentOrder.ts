import { Document } from './document';

export type DocumentOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

// The order the list opens with, before the user picks another one.
export const DEFAULT_DOCUMENT_ORDER: DocumentOrder = 'newest';

type Comparator = (left: Document, right: Document) => number;

const byCreation: Comparator = (left, right) =>
  left.createdAt.getTime() - right.createdAt.getTime();

const byTitle: Comparator = (left, right) =>
  left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });

const reversed =
  (compare: Comparator): Comparator =>
  (left, right) =>
    compare(right, left);

const comparators: Record<DocumentOrder, Comparator> = {
  newest: reversed(byCreation),
  oldest: byCreation,
  'name-asc': byTitle,
  'name-desc': reversed(byTitle),
};

export function sortDocuments(
  documents: Document[],
  order: DocumentOrder,
): Document[] {
  return [...documents].sort(comparators[order]);
}
