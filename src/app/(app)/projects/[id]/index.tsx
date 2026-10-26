import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  findProjectById,
  formatProjectDate,
  projectKeys,
  projectRoleLabel,
  ProjectStatusBadge,
} from '@/features/projects';
import type { CursorPage, ProjectSummary } from '@/types/api';
import { colors } from '@/theme';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = Array.isArray(id) ? id[0] : id;
  const cachedProject = queryClient
    .getQueriesData<{ pages: CursorPage<ProjectSummary>[] }>({ queryKey: projectKeys.list() })
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.data) ?? [])
    .find((project) => project.id === projectId);
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => findProjectById(projectId!),
    enabled: Boolean(projectId),
    initialData: cachedProject,
  });

  if (projectQuery.isPending) {
    return <ProjectState message="Memuat detail proyek..." />;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <ProjectState
        message={projectQuery.error?.message ?? 'Proyek tidak ditemukan'}
        onRetry={() => projectQuery.refetch()}
      />
    );
  }

  const project = projectQuery.data;
  const actions = [
    ...(project.role === 'FREELANCER'
      ? [{ label: 'Undang klien', description: 'Kirim dan pantau undangan klien', route: 'invite' }]
      : []),
    { label: 'Kesepakatan', description: 'Ruang lingkup, nilai, dan tenggat', route: 'agreement' },
    { label: 'Perubahan', description: 'Permintaan perubahan pekerjaan', route: 'changes' },
    { label: 'Penyerahan', description: 'Hasil kerja dan revisi', route: 'deliveries' },
    { label: 'Pembayaran', description: 'Riwayat dan bukti pembayaran', route: 'payments' },
    { label: 'Aktivitas', description: 'Riwayat perubahan proyek', route: 'activity' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <ProjectStatusBadge status={project.status} />
            <Text style={styles.role}>{projectRoleLabel(project.role)}</Text>
          </View>
          <Text style={styles.title}>{project.title}</Text>
          <Text style={styles.date}>Diperbarui {formatProjectDate(project.updatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESKRIPSI</Text>
          <Text style={styles.description}>{project.description}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Dibuat</Text>
            <Text style={styles.metaValue}>{formatProjectDate(project.createdAt)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Kesepakatan aktif</Text>
            <Text style={styles.metaValue}>{project.activeAgreementVersionId ? 'Tersedia' : 'Belum ada'}</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionLabel}>KELOLA PROYEK</Text>
          {actions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.route}
              onPress={() => router.push(`/(app)/projects/${project.id}/${action.route}`)}
              style={({ pressed }) => [styles.actionCard, pressed ? styles.pressed : null]}
            >
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>{action.label}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <SafeAreaView style={styles.stateSafeArea}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.stateMessage}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Coba lagi</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  hero: { borderRadius: 24, backgroundColor: colors.primary, padding: 22, gap: 12, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  role: { color: colors.primaryMuted, fontSize: 12, fontWeight: '700' },
  title: { color: colors.white, fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  date: { color: colors.primaryMuted, fontSize: 12 },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.white, padding: 18, gap: 10 },
  sectionLabel: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800', letterSpacing: 1.35 },
  description: { color: colors.text, fontSize: 15, lineHeight: 23 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaCard: { flex: 1, minHeight: 92, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.white, padding: 15, gap: 8 },
  metaLabel: { color: colors.textSubtle, fontSize: 11, lineHeight: 15 },
  metaValue: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  actionSection: { gap: 10, marginTop: 4 },
  actionCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 17, backgroundColor: colors.white, paddingHorizontal: 17, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { opacity: 0.76 },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { color: colors.inkSoft, fontSize: 15, fontWeight: '800' },
  actionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  arrow: { color: colors.primary, fontSize: 25 },
  stateSafeArea: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  stateMessage: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.primary, fontWeight: '800' },
});
