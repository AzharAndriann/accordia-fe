import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type ScreenProps = PropsWithChildren<{ title: string; description?: string }>;

export function Screen({ title, description, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, gap: 20 },
  heading: { gap: 8 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '700' },
  description: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
});
