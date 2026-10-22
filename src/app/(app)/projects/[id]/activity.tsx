import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, EmptyState, InlineNotice } from '@/components/ui';
import { eventKeys, listProjectEvents, type AuditEvent, type AuditEventType, type JsonValue } from '@/features/events';
import { ApiError } from '@/lib/api';
import { colors, spacing, typography } from '@/theme';

const eventCopy: Record<AuditEventType, { title: string; description: string }> = {
  PROJECT_CREATED: { title: 'Proyek dibuat', description: 'Ruang kerja proyek mulai dibuat.' },
  INVITATION_CREATED: { title: 'Undangan dikirim', description: 'Klien diundang untuk bergabung.' },
  INVITATION_ACCEPTED: { title: 'Undangan diterima', description: 'Klien resmi bergabung ke proyek.' },
  AGREEMENT_DRAFT_CREATED: { title: 'Draft kesepakatan dibuat', description: 'Versi kesepakatan baru disiapkan.' },
  AGREEMENT_UPDATED: { title: 'Draft diperbarui', description: 'Isi kesepakatan mengalami perubahan.' },
  AGREEMENT_SUBMITTED: { title: 'Kesepakatan diajukan', description: 'Versi dikirim untuk persetujuan kedua pihak.' },
  AGREEMENT_APPROVED: { title: 'Kesepakatan disetujui', description: 'Salah satu pihak memberi persetujuan.' },
  AGREEMENT_ACCEPTED: { title: 'Kesepakatan aktif', description: 'Kesepakatan telah disetujui kedua pihak.' },
  AGREEMENT_REJECTED: { title: 'Kesepakatan ditolak', description: 'Versi kesepakatan memerlukan tindak lanjut.' },
  CHANGE_REQUEST_CREATED: { title: 'Perubahan diminta', description: 'Klien mengajukan perubahan proyek.' },
  CHANGE_REQUEST_PROPOSED: { title: 'Usulan perubahan dibuat', description: 'Freelancer menyiapkan versi kesepakatan baru.' },
  FILE_UPLOADED: { title: 'File diunggah', description: 'Lampiran baru tersimpan dalam proyek.' },
  DELIVERY_SUBMITTED: { title: 'Hasil kerja dikirim', description: 'Freelancer menyerahkan hasil untuk ditinjau.' },
  DELIVERY_ACCEPTED: { title: 'Hasil kerja diterima', description: 'Klien menerima penyerahan hasil.' },
  REVISION_REQUESTED: { title: 'Revisi diminta', description: 'Klien meminta perbaikan pada hasil kerja.' },
  PAYMENT_SUBMITTED: { title: 'Pembayaran dikirim', description: 'Klien mengunggah bukti pembayaran.' },
  PAYMENT_CONFIRMED: { title: 'Pembayaran dikonfirmasi', description: 'Freelancer mengonfirmasi pembayaran.' },
  PAYMENT_REJECTED: { title: 'Pembayaran ditolak', description: 'Bukti pembayaran tidak dapat dikonfirmasi.' },
};

export default function ProjectActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Array.isArray(id) ? id[0] : id;
  const eventsQuery = useInfiniteQuery({
    queryKey: eventKeys.list(projectId ?? ''),
    queryFn: ({ pageParam }) => listProjectEvents(projectId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(projectId),
  });
  const events = eventsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const error = eventsQuery.error instanceof ApiError
    ? eventsQuery.error.message
    : eventsQuery.error
      ? 'Aktivitas proyek belum bisa dimuat.'
      : null;

  if (eventsQuery.isPending) {
    return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.description}>Memuat aktivitas...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>Aktivitas proyek</Text>
          <Text style={styles.description}>Jejak perubahan proyek berdasarkan waktu server.</Text>
        </View>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        {events.length === 0 ? (
          <EmptyState title="Belum ada aktivitas" description="Perubahan penting proyek akan tercatat otomatis di sini." />
        ) : (
          <Card style={styles.timeline}>
            {events.map((event, index) => (
              <EventRow event={event} isLast={index === events.length - 1} key={event.id} />
            ))}
          </Card>
        )}
        {eventsQuery.hasNextPage ? (
          <ActionButton
            label={eventsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat aktivitas sebelumnya'}
            loading={eventsQuery.isFetchingNextPage}
            onPress={() => void eventsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventRow({ event, isLast }: { event: AuditEvent; isLast: boolean }) {
  const copy = eventCopy[event.type] ?? { title: event.type, description: 'Aktivitas proyek diperbarui.' };
  const details = metadataLines(event.metadata);
  return (
    <View style={styles.eventRow}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={[styles.eventContent, !isLast ? styles.eventBorder : null]}>
        <View style={styles.eventTop}>
          <Text style={styles.eventTitle}>{copy.title}</Text>
          <Text style={styles.eventTime}>{new Date(event.serverTime).toLocaleString('id-ID')}</Text>
        </View>
        <Text style={styles.eventDescription}>{copy.description}</Text>
        <Text style={styles.actor}>oleh {event.actorName}</Text>
        {details.length > 0 ? (
          <View style={styles.metadata}>
            {details.map((detail) => <Text key={detail} style={styles.metadataText}>{detail}</Text>)}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function metadataLines(metadata: JsonValue) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') return [];
  return Object.entries(metadata)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .slice(0, 4)
    .map(([key, value]) => `${metadataLabel(key)}: ${metadataValue(key, value)}`);
}

function metadataLabel(key: string) {
  const labels: Record<string, string> = {
    amountRupiah: 'Nominal',
    mimeType: 'Jenis file',
    size: 'Ukuran',
    versionNumber: 'Versi',
    baseAgreementVersionId: 'Versi dasar',
    proposedVersionId: 'Versi usulan',
  };
  return labels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function metadataValue(key: string, value: JsonValue) {
  if (key === 'amountRupiah' && typeof value === 'string' && /^\d+$/.test(value)) {
    return `Rp${BigInt(value).toLocaleString('id-ID')}`;
  }
  if (key === 'size' && typeof value === 'number') return `${Math.ceil(value / 1024)} KB`;
  return String(value);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  heading: { gap: spacing.xs },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  timeline: { paddingVertical: spacing.xs },
  eventRow: { flexDirection: 'row', paddingHorizontal: spacing.md },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary, marginTop: 5, zIndex: 1 },
  line: { position: 'absolute', top: 16, bottom: -5, width: 2, backgroundColor: colors.primarySoft },
  eventContent: { flex: 1, paddingLeft: spacing.sm, paddingBottom: spacing.lg, gap: 4 },
  eventBorder: { borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.lg },
  eventTop: { gap: 3 },
  eventTitle: { color: colors.inkSoft, fontSize: 14, fontWeight: '800' },
  eventTime: { color: colors.textSubtle, fontSize: 10 },
  eventDescription: { color: colors.text, fontSize: 12, lineHeight: 18 },
  actor: { color: colors.primaryAccent, fontSize: 11, fontWeight: '700' },
  metadata: { borderRadius: 10, backgroundColor: colors.background, padding: spacing.sm, gap: 3, marginTop: 4 },
  metadataText: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
