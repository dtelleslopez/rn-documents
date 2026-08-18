import { Share } from 'react-native';

import { Document } from '../domain/document';

export function documentShareMessage(document: Document): string {
  const version = document.version.trim();

  return version.length > 0
    ? `${document.title} (version ${version})`
    : document.title;
}

export async function shareDocument(document: Document): Promise<void> {
  try {
    await Share.share({ message: documentShareMessage(document) });
  } catch {
    // A share sheet that fails and one that was dismissed look the same from
    // here: nothing was shared.
  }
}
