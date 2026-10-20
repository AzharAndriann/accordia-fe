import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { checkHealth } from '@/lib/api';

export default function BootstrapScreen() {
  const health = useQuery({ queryKey: ['public', 'health'], queryFn: checkHealth });

  return (
    <Screen
      title="Accordia"
      description="Fondasi aplikasi mobile freelancer dan klien sudah siap."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Koneksi backend</Text>
        {health.isPending ? <ActivityIndicator color="#176B5B" /> : null}
        {health.isSuccess ? (
          <Text style={styles.success}>API terhubung: {health.data.data.status}</Text>
        ) : null}
        {health.isError ? (
          <>
            <Text style={styles.error}>{health.error.message}</Text>
            <Pressable accessibilityRole="button" onPress={() => health.refetch()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Coba lagi</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Masuk</Text>
          </Pressable>
        </Link>
        <Link href="/(app)/projects" asChild>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Lihat route proyek</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 16, backgroundColor: '#FFFFFF', gap: 12 },
  cardTitle: { color: '#17202A', fontSize: 18, fontWeight: '700' },
  success: { color: '#176B5B', fontSize: 15 },
  error: { color: '#A93226', fontSize: 15, lineHeight: 22 },
  actions: { gap: 12 },
  primaryButton: { borderRadius: 12, backgroundColor: '#176B5B', padding: 15, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#176B5B', borderRadius: 12, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#176B5B', fontSize: 15, fontWeight: '600' },
});
