import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AuthRole } from './auth.schema';
import { colors } from '@/theme';

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
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword && !passwordVisible}
          selectionColor={colors.primary}
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
      {isLoading ? <ActivityIndicator color={colors.white} size="small" /> : null}
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

type RoleFieldProps = {
  value?: AuthRole;
  onChange: (role: AuthRole) => void;
  error?: string;
};

const roleOptions: { value: AuthRole; label: string; description: string }[] = [
  {
    value: 'FREELANCER',
    label: 'Freelancer',
    description: 'Saya mengelola pekerjaan dan mengundang klien.',
  },
  {
    value: 'CLIENT',
    label: 'Klien',
    description: 'Saya bekerja sama dan menyetujui pekerjaan.',
  },
];

export function RoleField({ value, onChange, error }: RoleFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>Daftar sebagai</Text>
      <View accessibilityRole="radiogroup" style={styles.roleOptions}>
        {roleOptions.map((option) => {
          const selected = value === option.value;

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.roleOption,
                selected ? styles.roleOptionSelected : null,
                pressed ? styles.roleOptionPressed : null,
              ]}
            >
              <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.roleCopy}>
                <Text style={[styles.roleLabel, selected ? styles.roleLabelSelected : null]}>
                  {option.label}
                </Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 7 },
  label: { color: colors.inkSoft, fontSize: 14, fontWeight: '700' },
  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputShellError: { borderColor: colors.dangerBorder, backgroundColor: colors.dangerSurface },
  input: { flex: 1, color: colors.ink, fontSize: 16, paddingHorizontal: 15, paddingVertical: 14 },
  passwordInput: { paddingRight: 4 },
  visibilityButton: { paddingHorizontal: 15, paddingVertical: 12 },
  visibilityText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 17 },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 2,
  },
  submitPressed: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.99 }] },
  submitDisabled: { opacity: 0.72 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  formError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: colors.dangerSurface,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  formErrorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, marginTop: 6 },
  formErrorText: { flex: 1, color: colors.dangerStrong, fontSize: 13, lineHeight: 19 },
  roleOptions: { gap: 10 },
  roleOption: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  roleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleOptionPressed: { opacity: 0.82 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  roleCopy: { flex: 1, gap: 2 },
  roleLabel: { color: colors.inkSoft, fontSize: 14, fontWeight: '700' },
  roleLabelSelected: { color: colors.primaryPressed },
  roleDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
