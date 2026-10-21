import { StyleSheet, Text, View } from 'react-native';

import type { ProjectStatus } from '@/types/api';

const statusCopy: Record<ProjectStatus, { label: string; color: string; background: string }> = {
  DRAFT: { label: 'Draft', color: '#755714', background: '#FFF5D9' },
  ACTIVE: { label: 'Aktif', color: '#176B5B', background: '#DDF3EC' },
  DELIVERED: { label: 'Diserahkan', color: '#315B8A', background: '#E6F0FB' },
  COMPLETED: { label: 'Selesai', color: '#375E3B', background: '#E4F1E5' },
  CANCELLED: { label: 'Dibatalkan', color: '#943B3B', background: '#FBE6E6' },
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
