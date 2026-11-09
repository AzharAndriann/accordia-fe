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
    { label: 'Pembatalan & sengketa', description: 'Permintaan dan solusi bersama', route: 'requests' },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroGlowLarge} />
          <View pointerEvents="none" style={styles.heroGlowSmall} />
          <View pointerEvents="none" style={styles.heroSweep} />
          <View style={styles.heroTop}>
            <ProjectStatusBadge status={project.status} />
            <Text style={styles.role}>{projectRoleLabel(project.role)}</Text>
          </View>
          <Text style={styles.title}>{project.title}</Text>
          <View style={styles.heroFooter}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>DIPERBARUI</Text>
              <Text style={styles.heroMetricValue}>{formatProjectDate(project.updatedAt)}</Text>
            </View>
            <View style={[styles.heroMetric, styles.heroMetricRight]}>
              <Text style={styles.heroMetricLabel}>KESEPAKATAN</Text>
              <Text style={styles.heroMetricValue}>{project.activeAgreementVersionId ? 'Aktif' : 'Belum ada'}</Text>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroCoins}>
            <View style={styles.heroCoinGold} />
            <View style={styles.heroCoinMint} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESKRIPSI</Text>
          <Text style={styles.description}>{project.description}</Text>
        </View>

        <Pressable
          accessibilityLabel="Lihat aktivitas proyek"
          accessibilityRole="button"
          onPress={() => router.push(`/(app)/projects/${project.id}/activity`)}
          style={({ pressed }) => [styles.activityButton, pressed ? styles.pressed : null]}
        >
          <View style={styles.activityIcon}>
            <ActivityTimelineIcon />
          </View>
          <View style={styles.activityCopy}>
            <Text style={styles.activityTitle}>Lihat aktivitas proyek</Text>
            <Text style={styles.activityDescription}>Telusuri perubahan dan keputusan secara berurutan</Text>
          </View>
          <Text style={styles.activityArrow}>›</Text>
        </Pressable>

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

function ActivityTimelineIcon() {
  return (
    <View accessible={false} style={styles.timelineGlyph}>
      <View style={styles.timelineGlyphLine} />
      <View style={[styles.timelineGlyphDot, styles.timelineGlyphDotTop]} />
      <View style={[styles.timelineGlyphDot, styles.timelineGlyphDotMiddle]} />
      <View style={[styles.timelineGlyphDot, styles.timelineGlyphDotBottom]} />
    </View>
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
  hero: { minHeight: 220, borderRadius: 28, backgroundColor: colors.inkDeep, padding: 22, gap: 14, overflow: 'hidden', justifyContent: 'space-between' },
  heroGlowLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -78, top: -105, backgroundColor: colors.primary },
  heroGlowSmall: { position: 'absolute', width: 145, height: 145, borderRadius: 73, right: -30, top: -55, borderWidth: 22, borderColor: colors.primaryAccent, opacity: 0.34 },
  heroSweep: { position: 'absolute', width: 420, height: 145, borderRadius: 210, left: -105, bottom: -96, backgroundColor: colors.primaryBright, opacity: 0.52, transform: [{ rotate: '-6deg' }] },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  role: { color: colors.primaryMuted, fontSize: 12, fontWeight: '600' },
  title: { color: colors.white, fontSize: 29, lineHeight: 36, fontWeight: '700', letterSpacing: -0.45, maxWidth: '84%' },
  heroFooter: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 18, paddingRight: 52 },
  heroMetric: { flex: 1, gap: 4 },
  heroMetricRight: { alignItems: 'flex-end' },
  heroMetricLabel: { color: colors.primaryHighlight, fontSize: 9, fontWeight: '700', letterSpacing: 1.05 },
  heroMetricValue: { color: colors.white, fontSize: 12, fontWeight: '600' },
  heroCoins: { position: 'absolute', right: 18, bottom: 19, width: 42, height: 24 },
  heroCoinGold: { position: 'absolute', left: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gold, opacity: 0.95 },
  heroCoinMint: { position: 'absolute', right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryHighlight, opacity: 0.95 },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.white, padding: 18, gap: 10 },
  sectionLabel: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800', letterSpacing: 1.35 },
  description: { color: colors.text, fontSize: 15, lineHeight: 23 },
  activityButton: {
    minHeight: 82,
    borderRadius: 19,
    backgroundColor: colors.inkDeep,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineGlyph: { width: 26, height: 30 },
  timelineGlyphLine: { position: 'absolute', left: 12, top: 4, bottom: 4, width: 2, borderRadius: 1, backgroundColor: colors.primaryMuted },
  timelineGlyphDot: { position: 'absolute', left: 8, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.white, backgroundColor: colors.primaryBright },
  timelineGlyphDotTop: { top: 0 },
  timelineGlyphDotMiddle: { top: 10 },
  timelineGlyphDotBottom: { top: 20 },
  activityCopy: { flex: 1, gap: 3 },
  activityTitle: { color: colors.white, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  activityDescription: { color: colors.primaryMuted, fontSize: 11, lineHeight: 16 },
  activityArrow: { color: colors.primaryHighlight, fontSize: 28, lineHeight: 30 },
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
