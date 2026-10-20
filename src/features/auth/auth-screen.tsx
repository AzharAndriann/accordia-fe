import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  description: string;
  footer: ReactNode;
}>;

export function AuthScreen({ title, description, footer, children }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.decorationTop} />
      <View pointerEvents="none" style={styles.decorationBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logo}>
              <View style={styles.logoRing} />
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.brandName}>accordia</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>RUANG KERJA BERSAMA</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.card}>{children}</View>
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F7' },
  keyboardView: { flex: 1 },
  content: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 32,
  },
  decorationTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#DDEDE8',
    right: -100,
    top: -100,
  },
  decorationBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 34,
    borderColor: '#E6EFEC',
    left: -105,
    bottom: 36,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#176B5B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  logoDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4C95D',
    right: 6,
    top: 6,
  },
  brandName: { color: '#123D35', fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  heading: { marginBottom: 24 },
  eyebrow: {
    color: '#408274',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: { color: '#142B27', fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -1 },
  description: { color: '#62736F', fontSize: 15, lineHeight: 23, marginTop: 8, maxWidth: 400 },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 18,
    shadowColor: '#173D35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  footer: { alignItems: 'center', marginTop: 24 },
});
