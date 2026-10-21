import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

type AnimatedSplashProps = {
  onFinish: () => void;
};

const splashMark = require('../../assets/images/accordia-splash-mark.png');

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const [values] = useState(() => ({
    overlayOpacity: new Animated.Value(1),
    markOpacity: new Animated.Value(0),
    markScale: new Animated.Value(0.68),
    markRotation: new Animated.Value(-0.08),
    wordOpacity: new Animated.Value(0),
    wordTranslateY: new Animated.Value(12),
    haloScale: new Animated.Value(0.72),
  }));
  const {
    haloScale,
    markOpacity,
    markRotation,
    markScale,
    overlayOpacity,
    wordOpacity,
    wordTranslateY,
  } = values;

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | undefined;

    async function startAnimation() {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (!mounted) return;

      if (reduceMotion) {
        markOpacity.setValue(1);
        markScale.setValue(1);
        markRotation.setValue(0);
        wordOpacity.setValue(1);
        wordTranslateY.setValue(0);
        haloScale.setValue(1);
      }

      animation = Animated.sequence([
        Animated.parallel([
          Animated.timing(markOpacity, {
            toValue: 1,
            duration: reduceMotion ? 0 : 320,
            useNativeDriver: true,
          }),
          Animated.spring(markScale, {
            toValue: 1,
            damping: 10,
            stiffness: 105,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.spring(markRotation, {
            toValue: 0,
            damping: 12,
            stiffness: 90,
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 1,
            duration: reduceMotion ? 0 : 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(wordOpacity, {
            toValue: 1,
            duration: reduceMotion ? 0 : 360,
            useNativeDriver: true,
          }),
          Animated.timing(wordTranslateY, {
            toValue: 0,
            duration: reduceMotion ? 0 : 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(reduceMotion ? 350 : 650),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: reduceMotion ? 120 : 380,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      animation.start(({ finished }) => {
        if (finished && mounted) onFinish();
      });
    }

    void startAnimation();

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [haloScale, markOpacity, markRotation, markScale, onFinish, overlayOpacity, wordOpacity, wordTranslateY]);

  const rotation = markRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-180deg', '180deg'],
  });

  return (
    <Animated.View
      accessibilityLabel="Accordia sedang dimuat"
      accessibilityRole="progressbar"
      onLayout={() => void SplashScreen.hideAsync()}
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <Animated.View style={[styles.halo, { transform: [{ scale: haloScale }] }]} />
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: markOpacity,
            transform: [{ scale: markScale }, { rotate: rotation }],
          }}
        >
          <Image resizeMode="contain" source={splashMark} style={styles.mark} />
        </Animated.View>

        <Animated.View
          style={{
            alignItems: 'center',
            opacity: wordOpacity,
            transform: [{ translateY: wordTranslateY }],
          }}
        >
          <Text style={styles.wordmark}>accordia</Text>
          <Text style={styles.tagline}>Kesepakatan yang selalu jelas</Text>
        </Animated.View>
      </View>

      <Text style={styles.footer}>PROJECTS · AGREEMENTS · TRUST</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8F7',
  },
  halo: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#E2F0EC',
  },
  content: { alignItems: 'center', gap: 14 },
  mark: { width: 174, height: 174 },
  wordmark: {
    color: '#123D35',
    fontSize: 37,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  tagline: { color: '#6A7C77', fontSize: 13, letterSpacing: 0.2, marginTop: 5 },
  footer: {
    position: 'absolute',
    bottom: 46,
    color: '#77908A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
});
