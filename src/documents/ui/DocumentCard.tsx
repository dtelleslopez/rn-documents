import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Document } from '../domain/document';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Section {
  icon: IconName;
  title: string;
  items: string[];
}

export function DocumentCard({ document }: { document: Document }) {
  const everySection: Section[] = [
    {
      icon: 'people-outline',
      title: 'Contributors',
      items: document.contributors.map((contributor) => contributor.name),
    },
    {
      icon: 'link-outline',
      title: 'Attachments',
      items: document.attachments,
    },
  ];

  // A document created in the app has no contributors and may have no
  // attachments, and a heading over nothing reads as a rendering bug.
  const sections = everySection.filter((section) => section.items.length > 0);

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text accessibilityLabel="Document title" style={styles.title}>
          {document.title}
        </Text>
        {document.version.trim().length > 0 && (
          <Text style={styles.version}>Version {document.version}</Text>
        )}
      </View>

      {sections.length > 0 && (
        <View style={styles.sections}>
          {sections.map((section) => (
            <DocumentSection key={section.title} {...section} />
          ))}
        </View>
      )}
    </View>
  );
}

function DocumentSection({ icon, title, items }: Section) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Ionicons name={icon} size={16} color="#1f2937" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {/* Keyed by position because the server repeats attachment names and
          these lists never reorder. */}
      {items.map((item, position) => (
        <Text key={position} style={styles.item}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  version: {
    fontSize: 13,
    color: '#6b7280',
  },
  sections: {
    flexDirection: 'row',
    gap: 16,
  },
  section: {
    flex: 1,
    gap: 6,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  item: {
    fontSize: 14,
    color: '#6b7280',
  },
});
