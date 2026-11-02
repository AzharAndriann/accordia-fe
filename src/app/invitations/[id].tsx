import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, InlineNotice } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { acceptInvitation, invitationKeys } from '@/features/invitations';
import { projectKeys } from '@/features/projects';
import { authenticatedRequest } from '@/lib/api';
import { validInvitationId } from '@/lib/invitation-route';
import { colors } from '@/theme';
import type { ApiSuccess } from '@/types/api';

type Invitation = { id: string; projectId: string; expiresAt: string; expired: boolean; acceptedAt: string | null; cancelledAt: string | null; project: { title: string }; inviter: { name: string } };
export default function InvitationLinkScreen() {
  const { id: input } = useLocalSearchParams<{ id: string }>();
  const id = validInvitationId(input);
  const { user, isReady } = useAuthSession();
  const router = useRouter();
  const cache = useQueryClient();
  const query = useQuery({ queryKey: [...invitationKeys.all, 'link', user?.id, id], queryFn: () => authenticatedRequest<ApiSuccess<Invitation>>(`/invitations/${id}`), enabled: !!id && !!user && user.role === 'CLIENT' && user.needsConsent === false });
  const accept = useMutation({ mutationFn: () => acceptInvitation(id!), onSuccess: async (response) => {
    await Promise.all([cache.invalidateQueries({ queryKey: projectKeys.all }), cache.invalidateQueries({ queryKey: invitationKeys.all })]);
    router.replace(`/(app)/projects/${response.data.projectId}`);
  } });
  const invitation = query.data?.data;
  const unavailable = !!invitation && (!!invitation.cancelledAt || !!invitation.acceptedAt || invitation.expired);
  if (!isReady) return null;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
    <Text style={{ fontSize: 28, fontWeight: '700' }}>Undangan Accordia</Text>
    {!id ? <InlineNotice tone="error">Tautan undangan tidak valid.</InlineNotice> : !user ? <>
      <Text>Masuk atau daftar menggunakan email penerima undangan. Kamu dapat meninjau proyek sebelum menerima.</Text>
      <ActionButton label="Masuk" onPress={() => router.push({ pathname: '/(auth)/login', params: { invitationId: id } })} />
      <ActionButton label="Daftar" variant="secondary" onPress={() => router.push({ pathname: '/(auth)/register', params: { invitationId: id } })} />
    </> : user.needsConsent !== false ? <ActionButton label="Lengkapi persetujuan" onPress={() => router.push({ pathname: '/consent', params: { invitationId: id } } as Href)} />
      : user.role !== 'CLIENT' ? <InlineNotice tone="error">Undangan proyek hanya dapat diterima akun klien. Gunakan akun dengan email tujuan undangan.</InlineNotice>
      : <>
        {query.isPending ? <Text>Memuat undangan...</Text> : null}
        {query.error ? <><InlineNotice tone="error">{query.error.message}</InlineNotice><ActionButton label="Coba lagi" onPress={() => void query.refetch()} /></> : null}
        {invitation ? <><Text style={{ fontSize: 22 }}>{invitation.project.title}</Text><Text>Diundang oleh {invitation.inviter.name}</Text><Text>Berlaku hingga {new Date(invitation.expiresAt).toLocaleString('id-ID')}</Text>
          {unavailable ? <InlineNotice>Undangan sudah diterima, dibatalkan, atau kedaluwarsa.</InlineNotice> : <ActionButton label="Terima undangan" loading={accept.isPending} onPress={() => accept.mutate()} />}
          {invitation.acceptedAt ? <ActionButton label="Buka proyek" onPress={() => router.replace(`/(app)/projects/${invitation.projectId}`)} /> : null}
        </> : null}
        {accept.error ? <InlineNotice tone="error">{accept.error.message}</InlineNotice> : null}
      </>}
    <ActionButton label="Ke beranda" variant="secondary" onPress={() => router.replace('/')} />
  </ScrollView></SafeAreaView>;
}
