import { StyleSheet, Text, View } from 'react-native';

import type { ProjectStatus } from '@/types/api';
import { colors } from '@/theme';

const statusCopy: Record<ProjectStatus, { label: string; color: string; background: string }> = {
  DRAFT: { label: 'Draft', color: colors.warning, background: colors.warningSurface },
  ACTIVE: { label: 'Aktif', color: colors.primary, background: colors.primarySoft },
  DELIVERED: { label: 'Diserahkan', color: colors.info, background: colors.infoSurface },
  COMPLETED: { label: 'Selesai', color: colors.success, background: colors.successSurface },
  CANCELLED: { label: 'Dibatalkan', color: colors.danger, background: colors.dangerSurface },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const copy = statusCopy[status];
  return (
    <View style={[styles.badge, { backgroundColor: copy.background }]}>
      <View style={[styles.dot, { backgroundColor: copy.color }]} />
      <Text style={[styles.text, { color: copy.color }]}>{copy.label}</Text>
    </View>
  );
}

export function projectRoleLabel(role: 'FREELANCER' | 'CLIENT') {
  return role === 'FREELANCER' ? 'Freelancer' : 'Klien';
}

export function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '800' },
});
