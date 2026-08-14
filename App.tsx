import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createDocumentRepository } from './src/composition';
import { DocumentListScreen } from './src/documents/ui/DocumentListScreen';
import { DocumentRepositoryProvider } from './src/documents/ui/documentRepositoryContext';

// Built once, at module level, so the repository identity stays stable across
// renders and the views never reload just because the app re-rendered.
const documentRepository = createDocumentRepository();

export default function App() {
  return (
    <SafeAreaProvider>
      <DocumentRepositoryProvider repository={documentRepository}>
        <SafeAreaView style={styles.container}>
          <DocumentListScreen />
          <StatusBar style="auto" />
        </SafeAreaView>
      </DocumentRepositoryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
