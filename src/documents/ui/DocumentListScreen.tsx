import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NotificationBell } from '../../notifications/ui/NotificationBell';
import { useUnseenNotifications } from '../../notifications/ui/useUnseenNotifications';
import { DocumentDraft } from '../domain/document';
import { AddDocumentSheet } from './AddDocumentSheet';
import { DocumentCard } from './DocumentCard';
import { useDocumentsDependencies } from './documentsContext';
import { useCreateDocument } from './useCreateDocument';
import { useDocuments } from './useDocuments';

export function DocumentListScreen() {
  const { state, refresh } = useDocuments();
  const { create } = useCreateDocument();
  const { pickFile } = useDocumentsDependencies();
  const { count, acknowledge } = useUnseenNotifications();
  const [adding, setAdding] = useState(false);

  async function add(draft: DocumentDraft) {
    await create(draft);
    setAdding(false);
    refresh();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Documents</Text>
        <NotificationBell count={count} onPress={acknowledge} />
      </View>

      <View style={styles.content}>
        <Documents state={state} />
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add document"
          onPress={() => setAdding(true)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add document</Text>
        </Pressable>
      </View>

      <AddDocumentSheet
        visible={adding}
        onSubmit={add}
        onDismiss={() => setAdding(false)}
        pickFile={pickFile}
      />
    </View>
  );
}

function Documents({ state }: { state: ReturnType<typeof useDocuments>['state'] }) {
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
      renderItem={({ item }) => <DocumentCard document={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
  },
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
  headline: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reason: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eceff3',
    padding: 16,
  },
  addButton: {
    backgroundColor: '#3b6df6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
