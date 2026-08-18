import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NotificationBell } from '../../notifications/ui/NotificationBell';
import { useUnseenNotifications } from '../../notifications/ui/useUnseenNotifications';
import { DocumentDraft } from '../domain/document';
import {
  DEFAULT_DOCUMENT_ORDER,
  DocumentOrder,
  sortDocuments,
} from '../domain/documentOrder';
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
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<DocumentOrder>(DEFAULT_DOCUMENT_ORDER);
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

  // Owned here rather than in the hook because creating a document reloads the
  // list too, and the pull indicator belongs to the gesture alone.
  async function pull() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

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

        <Documents
          state={ordered}
          layout={layout}
          refreshing={refreshing}
          onRefresh={pull}
        />
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
  refreshing: boolean;
  onRefresh: () => void;
}

function Documents({ state, layout, refreshing, onRefresh }: DocumentsProps) {
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRefresh}
          style={styles.retry}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </Centered>
    );
  }

  if (state.documents.length === 0) {
    return (
      <>
        {state.incomplete && <UnreachableServer onRetry={onRefresh} />}

        {!state.incomplete && (
          <Centered>
            <Text style={styles.headline}>There are no documents yet</Text>
          </Centered>
        )}
      </>
    );
  }

  const grid = layout === 'grid';

  return (
    <>
      {state.incomplete && <UnreachableServer onRetry={onRefresh} />}

      <FlatList
        // React Native refuses to change the number of columns on the fly, so
        // the list is remounted when the layout does.
        key={layout}
        accessibilityLabel="Documents list"
        data={state.documents}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyExtractor={(document) => document.id}
        renderItem={({ item }) => (
          <DocumentCard document={item} layout={layout} />
        )}
        numColumns={grid ? 2 : 1}
        columnWrapperStyle={grid ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
      />
    </>
  );
}

// Shown alongside whatever could be read: the documents on this device are
// still real, they are just not the whole picture.
function UnreachableServer({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.warning}>
      <View style={styles.warningText}>
        <Text style={styles.warningHeadline}>Could not reach the server</Text>
        <Text style={styles.reason}>Showing what is on this device.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={onRetry}
        style={styles.retry}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
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
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fdf0d5',
  },
  warningText: {
    flexShrink: 1,
    gap: 2,
  },
  warningHeadline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  retry: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3b6df6',
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
