import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DocumentCardLayout } from './DocumentCard';

interface DocumentListToolbarProps {
  layout: DocumentCardLayout;
  onLayoutChange: (layout: DocumentCardLayout) => void;
  onSortPress: () => void;
}

export function DocumentListToolbar({
  layout,
  onLayoutChange,
  onSortPress,
}: DocumentListToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sort by"
        onPress={onSortPress}
        style={styles.sort}
      >
        <Ionicons name="swap-vertical-outline" size={18} color="#1f2937" />
        <Text style={styles.sortLabel}>Sort by</Text>
        <View style={styles.divider} />
        <Ionicons name="chevron-down" size={18} color="#1f2937" />
      </Pressable>

      <View style={styles.layouts}>
        <LayoutButton
          icon="list-outline"
          label="Show as list"
          active={layout === 'list'}
          onPress={() => onLayoutChange('list')}
        />
        <LayoutButton
          icon="grid-outline"
          label="Show as grid"
          active={layout === 'grid'}
          onPress={() => onLayoutChange('grid')}
        />
      </View>
    </View>
  );
}

interface LayoutButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  onPress: () => void;
}

function LayoutButton({ icon, label, active, onPress }: LayoutButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.layout, active && styles.activeLayout]}
    >
      <Ionicons name={icon} size={20} color={active ? '#3b6df6' : '#6b7280'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dfe3e8',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  sortLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    alignSelf: 'stretch',
    width: 1,
    backgroundColor: '#dfe3e8',
  },
  layouts: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dfe3e8',
    borderRadius: 10,
    backgroundColor: '#eceff3',
    overflow: 'hidden',
  },
  layout: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  activeLayout: {
    backgroundColor: '#fff',
  },
});
