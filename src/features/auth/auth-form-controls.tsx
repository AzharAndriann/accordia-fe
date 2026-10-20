import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type FormFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
};

export function FormField({
  label,
  error,
  passwordVisible,
  onTogglePassword,
  style,
  ...inputProps
}: FormFieldProps) {
  const isPassword = Boolean(onTogglePassword);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          placeholderTextColor="#99A6A3"
          secureTextEntry={isPassword && !passwordVisible}
          selectionColor="#176B5B"
          style={[styles.input, isPassword ? styles.passwordInput : null, style]}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={onTogglePassword}
            style={styles.visibilityButton}
          >
            <Text style={styles.visibilityText}>{passwordVisible ? 'Tutup' : 'Lihat'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type SubmitButtonProps = {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  onPress: () => void;
};

export function SubmitButton({ label, loadingLabel, isLoading, onPress }: SubmitButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.submitButton,
        pressed && !isLoading ? styles.submitPressed : null,
        isLoading ? styles.submitDisabled : null,
      ]}
    >
      {isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
      <Text style={styles.submitText}>{isLoading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <View accessibilityRole="alert" style={styles.formError}>
      <View style={styles.formErrorDot} />
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 7 },
  label: { color: '#253B37', fontSize: 14, fontWeight: '700' },
  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D8E1DF',
    borderRadius: 14,
    backgroundColor: '#FAFCFB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputShellError: { borderColor: '#C94F4F', backgroundColor: '#FFF9F9' },
  input: { flex: 1, color: '#152B27', fontSize: 16, paddingHorizontal: 15, paddingVertical: 14 },
  passwordInput: { paddingRight: 4 },
  visibilityButton: { paddingHorizontal: 15, paddingVertical: 12 },
  visibilityText: { color: '#176B5B', fontSize: 13, fontWeight: '800' },
  errorText: { color: '#AD3D3D', fontSize: 12, lineHeight: 17 },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#176B5B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 2,
  },
  submitPressed: { backgroundColor: '#115448', transform: [{ scale: 0.99 }] },
  submitDisabled: { opacity: 0.72 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  formError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: '#FFF1F1',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  formErrorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#B43F3F', marginTop: 6 },
  formErrorText: { flex: 1, color: '#8F3030', fontSize: 13, lineHeight: 19 },
});
