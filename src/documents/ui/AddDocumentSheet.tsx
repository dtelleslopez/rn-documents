import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DocumentDraft } from '../domain/document';

interface AddDocumentSheetProps {
  visible: boolean;
  onSubmit: (draft: DocumentDraft) => Promise<void> | void;
  onDismiss: () => void;
  pickFile: () => Promise<string | null>;
}

export function AddDocumentSheet({
  visible,
  onSubmit,
  onDismiss,
  pickFile,
}: AddDocumentSheetProps) {
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const canSubmit = title.trim().length > 0;

  function reset() {
    setTitle('');
    setVersion('');
    setAttachments([]);
    setFailed(false);
  }

  function dismiss() {
    reset();
    onDismiss();
  }

  // Kept on failure: clearing would throw away work the app could not store.
  async function submit() {
    try {
      await onSubmit({ title, version, attachments });
      reset();
    } catch {
      setFailed(true);
    }
  }

  async function choose() {
    const name = await pickFile();

    if (name !== null) {
      setAttachments((current) => [...current, name]);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>Add document</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close without saving"
              onPress={dismiss}
              style={styles.close}
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.section}>Document information</Text>

            <Field
              label="Name"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <Field label="Version" value={version} onChangeText={setVersion} />

            <Text style={styles.label}>File</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose file"
              onPress={choose}
              style={styles.chooseFile}
            >
              <Ionicons name="document-text-outline" size={18} color="#3b6df6" />
              <Text style={styles.chooseFileText}>Choose file</Text>
            </Pressable>

            {attachments.map((attachment) => (
              <Text key={attachment} style={styles.attachment}>
                {attachment}
              </Text>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {failed && (
              <Text style={styles.failure}>Could not save the document</Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit"
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              onPress={submit}
              style={[styles.submit, !canSubmit && styles.submitDisabled]}
            >
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
}

function Field({ label, value, onChangeText, autoFocus }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        placeholder="Placeholder"
        placeholderTextColor="#9aa0a6"
        style={styles.input}
      />
    </View>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2933',
  },
  close: {
    padding: 8,
  },
  closeGlyph: {
    fontSize: 18,
    color: '#5f6b7a',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 8,
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe3e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2933',
  },
  chooseFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#dfe3e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chooseFileText: {
    color: '#3b6df6',
    fontWeight: '600',
  },
  attachment: {
    fontSize: 14,
    color: '#5f6b7a',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eceff3',
    padding: 20,
  },
  submit: {
    backgroundColor: '#3b6df6',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  failure: {
    marginBottom: 12,
    fontSize: 14,
    color: '#b42318',
    textAlign: 'center',
  },
  submitDisabled: {
    backgroundColor: '#b9c8f0',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
