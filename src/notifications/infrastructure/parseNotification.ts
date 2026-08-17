import { Notification } from '../domain/notification';

// The server also sends UserID and DocumentID, but the documents it names do
// not exist in /documents, so keeping them would only invite dead navigation.
export function parseNotification(payload: unknown): Notification | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const { Timestamp, UserName, DocumentTitle } = payload as Record<
    string,
    unknown
  >;

  if (
    typeof Timestamp !== 'string' ||
    typeof UserName !== 'string' ||
    typeof DocumentTitle !== 'string'
  ) {
    return null;
  }

  const timestamp = new Date(Timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return { timestamp, userName: UserName, documentTitle: DocumentTitle };
}
