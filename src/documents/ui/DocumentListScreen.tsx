import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Document } from '../domain/document';
import { useDocuments } from './useDocuments';

export function DocumentListScreen() {
  const { state } = useDocuments();

  if (state.status === 'loading') {
    return (
      <Centered>
        <ActivityIndicator accessibilityLabel="Loading documents" />
      </Centered>
    );
  }

  if (state.status === 'failed') {
    return (
      <Centered>
        <Text style={styles.headline}>Could not load the documents</Text>
        <Text style={styles.reason}>{state.message}</Text>
      </Centered>
    );
  }

  if (state.documents.length === 0) {
    return (
      <Centered>
        <Text style={styles.headline}>There are no documents yet</Text>
      </Centered>
    );
  }

  return (
    <FlatList
      data={state.documents}
      keyExtractor={(document) => document.id}
      renderItem={({ item }) => <DocumentRow document={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

function DocumentRow({ document }: { document: Document }) {
  return (
    <View style={styles.row}>
      <Text accessibilityLabel="Document title" style={styles.title}>
        {document.title}
      </Text>
      <Text style={styles.createdAt}>
        {document.createdAt.toLocaleDateString()}
      </Text>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  row: {
    gap: 4,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  createdAt: {
    fontSize: 13,
    color: '#666',
  },
  reason: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
