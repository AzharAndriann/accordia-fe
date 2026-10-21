import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AppStackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Kembali"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F4F7F6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DCE5E2',
  },
  header: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.65, transform: [{ scale: 0.96 }] },
  backIcon: {
    color: '#176B5B',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '400',
    marginTop: -2,
  },
  title: {
    flex: 1,
    color: '#19332E',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  spacer: { width: 38, height: 38 },
});
