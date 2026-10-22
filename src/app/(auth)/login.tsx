import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/lib/api';
import { AuthScreen } from '@/features/auth/auth-screen';
import { FormError, FormField, SubmitButton } from '@/features/auth/auth-form-controls';
import { login, loginSchema, saveAuthSession, type LoginForm } from '@/features/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    async onSuccess(response) {
      await saveAuthSession(response.data);
      router.replace((redirect?.startsWith('/') ? redirect : '/(app)/projects') as Href);
    },
  });

  const submit = handleSubmit((values) => loginMutation.mutate(values));
  const formError = loginMutation.error
    ? loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.'
    : undefined;

  return (
    <AuthScreen
      title="Senang bertemu lagi!"
      description="Masuk dan lanjutkan kolaborasimu."
      variant="hero"
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Belum punya akun?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text style={styles.footerLink}>Daftar sekarang</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <FormError message={formError} />

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
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <FormField
            autoCapitalize="none"
            autoComplete="current-password"
            error={errors.password?.message}
            label="Password"
            onBlur={onBlur}
            onChangeText={onChange}
            onSubmitEditing={() => void submit()}
            onTogglePassword={() => setShowPassword((visible) => !visible)}
            passwordVisible={showPassword}
            placeholder="Masukkan password"
            returnKeyType="done"
            value={value}
          />
        )}
      />

      <SubmitButton
        isLoading={loginMutation.isPending}
        label="Masuk ke Accordia"
        loadingLabel="Sedang masuk..."
        onPress={submit}
      />

      <Text style={styles.securityNote}>Token sesi disimpan aman di perangkat ini.</Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { color: '#687975', fontSize: 14 },
  footerLink: { color: '#176B5B', fontSize: 14, fontWeight: '800' },
  securityNote: { color: '#7D8C89', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
