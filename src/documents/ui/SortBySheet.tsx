import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DocumentOrder } from '../domain/documentOrder';

const ORDERS: { order: DocumentOrder; label: string }[] = [
  { order: 'newest', label: 'Newest first' },
  { order: 'oldest', label: 'Oldest first' },
  { order: 'name-asc', label: 'Name A-Z' },
  { order: 'name-desc', label: 'Name Z-A' },
];

interface SortBySheetProps {
  visible: boolean;
  order: DocumentOrder;
  onSelect: (order: DocumentOrder) => void;
  onDismiss: () => void;
}

export function SortBySheet({
  visible,
  order,
  onSelect,
  onDismiss,
}: SortBySheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>Sort by</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sort options"
              onPress={onDismiss}
              style={styles.close}
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.options}>
            {ORDERS.map((option) => (
              <Pressable
                key={option.order}
                accessibilityRole="button"
                // The tick is part of the row, so without an explicit label the
                // active option would answer to a different name than the rest.
                accessibilityLabel={option.label}
                accessibilityState={{ selected: option.order === order }}
                onPress={() => onSelect(option.order)}
                style={styles.option}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>

                {option.order === order && (
                  <Ionicons name="checkmark" size={20} color="#3b6df6" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  close: {
    padding: 4,
  },
  closeGlyph: {
    fontSize: 20,
    color: '#4b5563',
  },
  options: {
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
});
