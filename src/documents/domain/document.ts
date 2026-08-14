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

export function sortByMostRecentlyCreated(documents: Document[]): Document[] {
  return [...documents].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
}
