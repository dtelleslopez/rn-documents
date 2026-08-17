import { AppState } from 'react-native';

export function subscribeToAppState(
  listener: (isActive: boolean) => void,
): () => void {
  const subscription = AppState.addEventListener('change', (state) =>
    listener(state === 'active'),
  );

  return () => subscription.remove();
}
