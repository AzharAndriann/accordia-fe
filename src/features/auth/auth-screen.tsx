import type { PropsWithChildren, ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  description: string;
  footer: ReactNode;
  variant?: 'card' | 'hero';
}>;

export function AuthScreen({
  title,
  description,
  footer,
  children,
  variant = 'card',
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  if (variant === 'hero') {
    return (
      <View style={styles.heroSafeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.heroContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.heroHeader, { height: 265 + insets.top }]}>
              <Image
                pointerEvents="none"
                resizeMode="stretch"
                source={require('../../../assets/images/accordia-auth-hero.png')}
                style={styles.heroBackground}
              />
              <View style={[styles.heroBrand, { marginTop: 24 + insets.top }]}>
                <View style={styles.heroLogoHalo}>
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="contain"
                    source={require('../../../assets/images/accordia-splash-mark.png')}
                    style={styles.heroLogo}
                  />
                </View>
                <Text style={styles.heroBrandName}>accordia</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroHeading}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroDescription}>{description}</Text>
              </View>
              <View style={styles.heroForm}>{children}</View>
              <View style={styles.heroFooter}>{footer}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

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
  heroSafeArea: { flex: 1, backgroundColor: colors.primary },
  heroContent: { flexGrow: 1, backgroundColor: colors.white },
  heroHeader: {
    height: 265,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroBrand: { alignItems: 'center', zIndex: 2 },
  heroLogoHalo: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: { width: 72, height: 72 },
  heroBrandName: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroBody: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.white,
    paddingHorizontal: 26,
    paddingTop: 6,
    paddingBottom: 32,
  },
  heroHeading: { alignItems: 'center', marginBottom: 24 },
  heroTitle: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  heroDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 350,
    textAlign: 'center',
  },
  heroForm: { gap: 18 },
  heroFooter: { alignItems: 'center', marginTop: 24 },
  safeArea: { flex: 1, backgroundColor: colors.backgroundSplash },
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
    backgroundColor: colors.primarySoft,
    right: -100,
    top: -100,
  },
  decorationBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 34,
    borderColor: colors.border,
    left: -105,
    bottom: 36,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.white,
  },
  logoDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    right: 6,
    top: 6,
  },
  brandName: { color: colors.inkDeep, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  heading: { marginBottom: 24 },
  eyebrow: {
    color: colors.primaryAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: { color: colors.ink, fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -1 },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 23, marginTop: 8, maxWidth: 400 },
  card: {
    borderRadius: 24,
    backgroundColor: colors.white,
    padding: 20,
    gap: 18,
    shadowColor: colors.inkDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  footer: { alignItems: 'center', marginTop: 24 },
});
