import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormError, FormField, SubmitButton } from '@/features/auth/auth-form-controls';
import {
  createProject,
  createProjectSchema,
  projectKeys,
  type CreateProjectForm,
} from '@/features/projects';
import { ApiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { colors } from '@/theme';

export default function CreateProjectScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { title: '', description: '' },
  });
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess(response) {
      queryClient.setQueryData(projectKeys.detail(response.data.id), response.data);
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      router.replace(`/(app)/projects/${response.data.id}`);
    },
  });
  const formError = createMutation.error
    ? createMutation.error instanceof ApiError
      ? createMutation.error.message
      : 'Proyek belum berhasil dibuat. Coba lagi.'
    : undefined;

  if (currentUser?.role !== 'FREELANCER') {
    return (
      <SafeAreaView style={styles.blocked}>
        <View style={styles.blockedIcon}><Text style={styles.blockedMark}>i</Text></View>
        <Text style={styles.blockedTitle}>Khusus freelancer</Text>
        <Text style={styles.blockedText}>Hanya akun freelancer yang dapat membuat proyek baru.</Text>
      </SafeAreaView>
    );
  }

  const submit = handleSubmit((values) => createMutation.mutate(values));

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>PROYEK BARU</Text>
            <Text style={styles.title}>Mulai dari gambaran besarnya</Text>
            <Text style={styles.description}>Judul dan deskripsi ini akan terlihat oleh klien saat mereka bergabung.</Text>
          </View>

          <View style={styles.formCard}>
            <FormError message={formError} />
            <Controller
              control={control}
              name="title"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormField
                  autoCapitalize="sentences"
                  error={errors.title?.message}
                  label="Judul proyek"
                  maxLength={160}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Contoh: Redesain website perusahaan"
                  returnKeyType="next"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormField
                  error={errors.description?.message}
                  label="Deskripsi"
                  maxLength={5_000}
                  multiline
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Ceritakan tujuan proyek dan hasil yang diharapkan"
                  style={styles.textArea}
                  textAlignVertical="top"
                  value={value}
                />
              )}
            />
            <Text style={styles.helper}>Kesepakatan, tenggat, dan pembayaran dapat diatur setelah proyek dibuat.</Text>
            <SubmitButton
              isLoading={createMutation.isPending}
              label="Buat proyek"
              loadingLabel="Membuat proyek..."
              onPress={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 38, gap: 22 },
  heading: { paddingTop: 10, gap: 7 },
  eyebrow: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.7 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  formCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: colors.white, padding: 18, gap: 18 },
  textArea: { minHeight: 130, paddingTop: 15 },
  helper: { color: colors.textSubtle, fontSize: 12, lineHeight: 18 },
  blocked: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 },
  blockedIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  blockedMark: { color: colors.primary, fontSize: 26, fontWeight: '800' },
  blockedTitle: { color: colors.inkSoft, fontSize: 21, fontWeight: '800' },
  blockedText: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
