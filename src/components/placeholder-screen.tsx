import { StyleSheet, Text, View } from 'react-native';

import { Screen } from './screen';
import { colors } from '@/theme';

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <Screen title={title} description={description}>
      <View style={styles.card}>
        <Text style={styles.label}>Fondasi route sudah siap</Text>
        <Text style={styles.text}>Implementasi bisnis layar ini dikerjakan pada tahap fitur berikutnya.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, backgroundColor: colors.white, padding: 20, gap: 8 },
  label: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  text: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
});
