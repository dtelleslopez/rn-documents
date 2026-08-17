import { Notification } from './notification';

export type NotificationListener = (notification: Notification) => void;

export interface NotificationSource {
  // Returns the function that cancels the subscription, which is exactly what
  // useEffect expects to receive back.
  subscribe(listener: NotificationListener): () => void;
}
