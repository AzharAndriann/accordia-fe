import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { Share, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, Field, InlineNotice, SectionLabel } from '@/components/ui';
import {
  createInvitation,
  createInvitationSchema,
  type CreateInvitationForm,
} from '@/features/invitations';
import { ApiError } from '@/lib/api';
import { colors, spacing, typography } from '@/theme';

export default function InviteClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Array.isArray(id) ? id[0] : id;
  const { control, handleSubmit, formState: { errors } } = useForm<CreateInvitationForm>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: '' },
  });
  const invitationMutation = useMutation({
    mutationFn: (values: CreateInvitationForm) => createInvitation(projectId!, values),
  });
  const invitation = invitationMutation.data?.data;
  const invitationUrl = invitation ? Linking.createURL(`/invitations/${invitation.token}`) : null;
  const error = invitationMutation.error instanceof ApiError
    ? invitationMutation.error.message
    : invitationMutation.error
      ? 'Undangan belum bisa dibuat. Coba lagi.'
      : null;

  const submit = handleSubmit((values) => invitationMutation.mutate(values));

  async function shareInvitation() {
    if (!invitationUrl || !invitation) return;
    await Share.share({
      title: 'Undangan proyek Accordia',
      message: `Kamu diundang ke proyek Accordia. Buka tautan ini dengan akun ${invitation.targetEmail}: ${invitationUrl}`,
      url: invitationUrl,
    });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={styles.title}>Undang klien</Text>
          <Text style={styles.description}>Undangan berlaku 48 jam dan hanya bisa dipakai oleh email yang dituju.</Text>
        </View>

        {invitation ? (
          <Card style={styles.resultCard}>
            <SectionLabel>UNDANGAN SIAP</SectionLabel>
            <Text style={styles.resultTitle}>{invitation.targetEmail}</Text>
            <Text style={styles.resultMeta}>Berlaku sampai {new Date(invitation.expiresAt).toLocaleString('id-ID')}</Text>
            <Text selectable style={styles.link}>{invitationUrl}</Text>
            <ActionButton label="Bagikan undangan" onPress={() => void shareInvitation()} />
            <ActionButton
              label="Buat undangan lain"
              onPress={() => invitationMutation.reset()}
              variant="secondary"
            />
          </Card>
        ) : (
          <Card style={styles.formCard}>
            {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <Field
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  inputMode="email"
                  label="Email klien"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={() => void submit()}
                  placeholder="klien@email.com"
                  returnKeyType="send"
                  value={value}
                />
              )}
            />
            <ActionButton
              label={invitationMutation.isPending ? 'Membuat undangan...' : 'Buat undangan'}
              loading={invitationMutation.isPending}
              onPress={submit}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.xl },
  heading: { gap: spacing.sm },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  formCard: { gap: spacing.lg },
  resultCard: { gap: spacing.md },
  resultTitle: { color: colors.inkSoft, fontSize: 18, fontWeight: '800' },
  resultMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  link: { color: colors.primary, fontSize: 12, lineHeight: 18 },
});
