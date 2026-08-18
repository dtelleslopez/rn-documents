import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const [submitting, setSubmitting] = useState(false);

  // The ref, not the disabled button, is what prevents a double submit: two
  // taps can land in the same frame, before React repaints the button.
  const submitInFlight = useRef(false);

  const canSubmit = title.trim().length > 0 && !submitting;

  function reset() {
    setTitle('');
    setVersion('');
    setAttachments([]);
    setFailed(false);
  }

  // The draft survives the sheet closing, from the cross or a tap outside: a
  // stray touch must not cost the user what they typed. Only a successful
  // submit clears the form.
  function dismiss() {
    setFailed(false);
    onDismiss();
  }

  // Kept on failure: clearing would throw away work the app could not store.
  async function submit() {
    if (submitInFlight.current) {
      return;
    }

    submitInFlight.current = true;
    setSubmitting(true);
    setFailed(false);

    try {
      await onSubmit({ title, version, attachments });
      reset();
    } catch {
      setFailed(true);
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  }

  async function choose() {
    try {
      const name = await pickFile();

      if (name !== null) {
        setAttachments((current) => [...current, name]);
      }
    } catch {
      // A picker that fails looks the same as one that was dismissed from
      // here: no file arrives.
    }
  }

  function removeAttachment(position: number) {
    setAttachments((current) =>
      current.filter((_, index) => index !== position),
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismiss}
    >
      <Pressable style={styles.backdrop} onPress={dismiss} testID="add-document-backdrop">
        {/* On iOS the keyboard would cover the fields and the submit button;
            Android already resizes the window on its own. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.heading}>Add document</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
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

              {/* Keyed by position because two picked files can share a name. */}
              {attachments.map((attachment, position) => (
                <View key={position} style={styles.attachment}>
                  <Text style={styles.attachmentName}>{attachment}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${attachment}`}
                    onPress={() => removeAttachment(position)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={16} color="#5f6b7a" />
                  </Pressable>
                </View>
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
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  attachmentName: {
    flexShrink: 1,
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
