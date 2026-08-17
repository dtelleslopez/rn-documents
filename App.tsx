import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  createDocumentsDependencies,
  createNotificationsDependencies,
} from './src/composition';
import { DocumentListScreen } from './src/documents/ui/DocumentListScreen';
import { DocumentsProvider } from './src/documents/ui/documentsContext';
import { NotificationsProvider } from './src/notifications/ui/notificationsContext';

// Built once, at module level, so the dependency identities stay stable across
// renders and the views never reload just because the app re-rendered. For the
// notification source that also means one socket, not one per render.
const dependencies = createDocumentsDependencies();
const notificationsDependencies = createNotificationsDependencies();

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider dependencies={dependencies}>
        <NotificationsProvider dependencies={notificationsDependencies}>
          <SafeAreaView style={styles.container}>
            <DocumentListScreen />
            <StatusBar style="auto" />
          </SafeAreaView>
        </NotificationsProvider>
      </DocumentsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
