import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';

export function Card({ children, style }: PropsWithChildren<{ style?: ComponentProps<typeof View>['style'] }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: PropsWithChildren) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function InlineNotice({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'neutral' | 'error' | 'success' }>) {
  return (
    <View style={[styles.notice, tone === 'error' ? styles.noticeError : null, tone === 'success' ? styles.noticeSuccess : null]}>
      <Text style={[styles.noticeText, tone === 'error' ? styles.noticeErrorText : null, tone === 'success' ? styles.noticeSuccessText : null]}>
        {children}
      </Text>
    </View>
  );
}

type FieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  trailing?: ReactNode;
};

export function Field({ label, error, trailing, style, multiline, ...props }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, multiline ? styles.inputShellMultiline : null, error ? styles.inputError : null]}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          multiline={multiline}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          style={[styles.input, multiline ? styles.multilineInput : null, style]}
        />
        {trailing}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function ActionButton({ label, onPress, loading, disabled, variant = 'primary' }: ActionButtonProps) {
  const inactive = Boolean(loading || disabled);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.buttonSecondary : null,
        variant === 'danger' ? styles.buttonDanger : null,
        pressed && !inactive ? styles.buttonPressed : null,
        inactive ? styles.buttonDisabled : null,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.white} /> : null}
      <Text style={[styles.buttonText, variant === 'secondary' ? styles.buttonTextSecondary : null]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyMark} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  sectionLabel: { color: colors.primaryAccent, ...typography.label },
  notice: { borderRadius: radii.md, backgroundColor: colors.primarySoft, padding: spacing.md },
  noticeError: { backgroundColor: colors.dangerSurface },
  noticeSuccess: { backgroundColor: colors.successSurface },
  noticeText: { color: colors.text, ...typography.body },
  noticeErrorText: { color: colors.dangerStrong },
  noticeSuccessText: { color: colors.success },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: colors.inkSoft, fontSize: 14, fontWeight: '700' },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputShellMultiline: { alignItems: 'flex-start' },
  inputError: { borderColor: colors.dangerBorder },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingHorizontal: 15, paddingVertical: 13 },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  fieldError: { color: colors.danger, fontSize: 12, lineHeight: 17 },
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonSecondary: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface },
  buttonDanger: { backgroundColor: colors.danger },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  buttonTextSecondary: { color: colors.primary },
  emptyCard: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyMark: { width: 44, height: 8, borderRadius: radii.pill, backgroundColor: colors.primarySoft },
  emptyTitle: { color: colors.inkSoft, fontSize: 18, fontWeight: '800', marginTop: spacing.sm },
  emptyDescription: { color: colors.textMuted, ...typography.body, textAlign: 'center' },
});
