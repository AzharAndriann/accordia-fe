import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatProjectDate,
  listProjects,
  projectKeys,
  projectRoleLabel,
  ProjectStatusBadge,
} from '@/features/projects';
import { getCurrentUser } from '@/lib/session';
import type { ProjectSummary } from '@/types/api';

export default function ProjectsScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const projectsQuery = useInfiniteQuery({
    queryKey: projectKeys.list(),
    queryFn: ({ pageParam }) => listProjects({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const projects = projectsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={[styles.content, projects.length === 0 ? styles.emptyContent : null]}
        data={projects}
        keyExtractor={(project) => project.id}
        onEndReached={() => {
          if (projectsQuery.hasNextPage && !projectsQuery.isFetchingNextPage) {
            void projectsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        onRefresh={() => projectsQuery.refetch()}
        refreshing={projectsQuery.isRefetching && !projectsQuery.isFetchingNextPage}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>RUANG KERJA</Text>
              <Text style={styles.title}>Proyekmu</Text>
              <Text style={styles.description}>Pantau semua pekerjaan dan kesepakatan dalam satu tempat.</Text>
            </View>
            {currentUser?.role === 'FREELANCER' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(app)/projects/new')}
                style={({ pressed }) => [styles.createButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.createIcon}>＋</Text>
                <Text style={styles.createText}>Proyek baru</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          projectsQuery.isPending ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#176B5B" size="large" />
              <Text style={styles.stateText}>Memuat proyek...</Text>
            </View>
          ) : projectsQuery.isError ? (
            <View style={styles.stateCard}>
              <View style={[styles.stateIcon, styles.errorIcon]}>
                <Text style={styles.errorMark}>!</Text>
              </View>
              <Text style={styles.stateTitle}>Proyek belum bisa dimuat</Text>
              <Text style={styles.stateText}>{projectsQuery.error.message}</Text>
              <Pressable onPress={() => projectsQuery.refetch()} style={styles.retryButton}>
                <Text style={styles.retryText}>Coba lagi</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Text style={styles.folderIcon}>⌁</Text>
              </View>
              <Text style={styles.stateTitle}>Belum ada proyek</Text>
              <Text style={styles.stateText}>
                {currentUser?.role === 'FREELANCER'
                  ? 'Buat proyek pertamamu untuk mulai menyusun kesepakatan.'
                  : 'Proyek yang kamu ikuti akan muncul di sini.'}
              </Text>
              {currentUser?.role === 'FREELANCER' ? (
                <Pressable onPress={() => router.push('/(app)/projects/new')} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Buat proyek pertama</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          projectsQuery.isFetchingNextPage ? (
            <ActivityIndicator color="#176B5B" style={styles.footerLoader} />
          ) : undefined
        }
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => router.push(`/(app)/projects/${item.id}`)} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ProjectCard({ project, onPress }: { project: ProjectSummary; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.cardTop}>
        <ProjectStatusBadge status={project.status} />
        <Text style={styles.cardDate}>{formatProjectDate(project.updatedAt)}</Text>
      </View>
      <Text numberOfLines={2} style={styles.cardTitle}>{project.title}</Text>
      <Text numberOfLines={2} style={styles.cardDescription}>{project.description}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.roleText}>Sebagai {projectRoleLabel(project.role)}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
  content: { paddingHorizontal: 20, paddingBottom: 118, gap: 14 },
  emptyContent: { flexGrow: 1 },
  header: { paddingTop: 22, paddingBottom: 10, gap: 20 },
  headerCopy: { gap: 6 },
  eyebrow: { color: '#398070', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#142B27', fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 },
  description: { color: '#687975', fontSize: 14, lineHeight: 21, maxWidth: 360 },
  createButton: { minHeight: 50, borderRadius: 15, backgroundColor: '#176B5B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pressed: { opacity: 0.82 },
  createIcon: { color: '#FFFFFF', fontSize: 22, lineHeight: 24 },
  createText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  card: { borderWidth: 1, borderColor: '#E0E8E6', borderRadius: 20, backgroundColor: '#FFFFFF', padding: 18, gap: 10, shadowColor: '#0A332B', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 14 },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { color: '#879590', fontSize: 11 },
  cardTitle: { color: '#19332E', fontSize: 18, lineHeight: 24, fontWeight: '800' },
  cardDescription: { color: '#687975', fontSize: 13, lineHeight: 20 },
  cardBottom: { borderTopWidth: 1, borderTopColor: '#EDF1F0', paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleText: { color: '#477067', fontSize: 12, fontWeight: '700' },
  arrow: { color: '#176B5B', fontSize: 25, lineHeight: 25 },
  stateCard: { flex: 1, minHeight: 340, borderWidth: 1, borderColor: '#E0E8E6', borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  stateIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#E2F2ED', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  errorIcon: { backgroundColor: '#FBEAEA' },
  folderIcon: { color: '#176B5B', fontSize: 39, fontWeight: '700', transform: [{ rotate: '-15deg' }] },
  errorMark: { color: '#A64141', fontSize: 28, fontWeight: '800' },
  stateTitle: { color: '#19332E', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  stateText: { color: '#71817D', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  emptyButton: { backgroundColor: '#176B5B', borderRadius: 13, paddingHorizontal: 18, paddingVertical: 12, marginTop: 8 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  retryButton: { borderWidth: 1, borderColor: '#176B5B', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8 },
  retryText: { color: '#176B5B', fontSize: 14, fontWeight: '800' },
  footerLoader: { paddingVertical: 20 },
});
