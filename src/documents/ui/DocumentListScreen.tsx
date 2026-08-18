import React, { useMemo, useState } from 'react';
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
import { DocumentOrder, sortDocuments } from '../domain/documentOrder';
import { AddDocumentSheet } from './AddDocumentSheet';
import { DocumentCard, DocumentCardLayout } from './DocumentCard';
import { DocumentListToolbar } from './DocumentListToolbar';
import { SortBySheet } from './SortBySheet';
import { useDocumentsDependencies } from './documentsContext';
import { useCreateDocument } from './useCreateDocument';
import { useDocuments } from './useDocuments';

export function DocumentListScreen() {
  const { state, refresh } = useDocuments();
  const { create } = useCreateDocument();
  const { pickFile } = useDocumentsDependencies();
  const { count, acknowledge } = useUnseenNotifications();
  const [adding, setAdding] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [order, setOrder] = useState<DocumentOrder>('newest');
  const [layout, setLayout] = useState<DocumentCardLayout>('list');

  // Sorting reaches the documents already loaded. Asking the server again
  // would answer with a different random collection, and the list would look
  // shuffled rather than sorted.
  const ordered = useMemo(
    () =>
      state.status === 'ready'
        ? { ...state, documents: sortDocuments(state.documents, order) }
        : state,
    [state, order],
  );

  function pick(next: DocumentOrder) {
    setOrder(next);
    setSorting(false);
  }

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
        <DocumentListToolbar
          layout={layout}
          onLayoutChange={setLayout}
          onSortPress={() => setSorting(true)}
        />

        <Documents state={ordered} layout={layout} />
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

      <SortBySheet
        visible={sorting}
        order={order}
        onSelect={pick}
        onDismiss={() => setSorting(false)}
      />

      <AddDocumentSheet
        visible={adding}
        onSubmit={add}
        onDismiss={() => setAdding(false)}
        pickFile={pickFile}
      />
    </View>
  );
}

interface DocumentsProps {
  state: ReturnType<typeof useDocuments>['state'];
  layout: DocumentCardLayout;
}

function Documents({ state, layout }: DocumentsProps) {
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

  const grid = layout === 'grid';

  return (
    <FlatList
      // React Native refuses to change the number of columns on the fly, so the
      // list is remounted when the layout does.
      key={layout}
      data={state.documents}
      keyExtractor={(document) => document.id}
      renderItem={({ item }) => <DocumentCard document={item} layout={layout} />}
      numColumns={grid ? 2 : 1}
      columnWrapperStyle={grid ? styles.gridRow : undefined}
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
  gridRow: {
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
