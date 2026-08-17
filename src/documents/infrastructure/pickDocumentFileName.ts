import { getDocumentAsync } from 'expo-document-picker';

export async function pickDocumentFileName(): Promise<string | null> {
  const result = await getDocumentAsync({ copyToCacheDirectory: false });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.name ?? null;
}
