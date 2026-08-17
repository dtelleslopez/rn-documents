import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createDocumentsDependencies } from './src/composition';
import { DocumentListScreen } from './src/documents/ui/DocumentListScreen';
import { DocumentsProvider } from './src/documents/ui/documentsContext';

// Built once, at module level, so the dependency identities stay stable across
// renders and the views never reload just because the app re-rendered.
const dependencies = createDocumentsDependencies();

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentsProvider dependencies={dependencies}>
        <SafeAreaView style={styles.container}>
          <DocumentListScreen />
          <StatusBar style="auto" />
        </SafeAreaView>
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
