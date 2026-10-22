import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/lib/api';
import { AuthScreen } from '@/features/auth/auth-screen';
import {
  FormError,
  FormField,
  RoleField,
  SubmitButton,
} from '@/features/auth/auth-form-controls';
import { register, registerSchema, saveAuthSession, type RegisterForm } from '@/features/auth';
import { colors } from '@/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    async onSuccess(response) {
      await saveAuthSession(response.data);
      router.replace('/(app)/projects');
    },
  });

  const submit = handleSubmit((values) => registerMutation.mutate(values));
  const formError = registerMutation.error
    ? registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.'
    : undefined;

  return (
    <AuthScreen
      title="Mulai kerja lebih jelas"
      description="Buat akun untuk mengelola proyek bersama tanpa kesepakatan yang tercecer."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text style={styles.footerLink}>Masuk</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <FormError message={formError} />

      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name?.message}
            label="Nama lengkap"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Nama kamu"
            returnKeyType="next"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email?.message}
            inputMode="email"
            label="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="nama@email.com"
            returnKeyType="next"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <RoleField error={errors.role?.message} onChange={onChange} value={value} />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.password?.message}
            label="Password"
            onBlur={onBlur}
            onChangeText={onChange}
            onTogglePassword={() => setShowPassword((visible) => !visible)}
            passwordVisible={showPassword}
            placeholder="Minimal 12 karakter"
            returnKeyType="next"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            autoCapitalize="none"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            label="Konfirmasi password"
            onBlur={onBlur}
            onChangeText={onChange}
            onSubmitEditing={() => void submit()}
            onTogglePassword={() => setShowConfirmation((visible) => !visible)}
            passwordVisible={showConfirmation}
            placeholder="Ulangi password"
            returnKeyType="done"
            value={value}
          />
        )}
      />

      <SubmitButton
        isLoading={registerMutation.isPending}
        label="Buat akun"
        loadingLabel="Membuat akun..."
        onPress={submit}
      />

      <Text style={styles.terms}>
        Dengan mendaftar, kamu menyetujui penggunaan data untuk operasional layanan Accordia.
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  terms: { color: colors.textSubtle, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
