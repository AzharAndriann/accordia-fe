import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  dismissDynamicIslandToast,
  getDynamicIslandToastSnapshot,
  subscribeDynamicIslandToast,
} from '@/lib/dynamic-island-toast';
import { colors } from '@/theme';

export function DynamicIslandToast() {
  const toast = useSyncExternalStore(
    subscribeDynamicIslandToast,
    getDynamicIslandToastSnapshot,
    getDynamicIslandToastSnapshot,
  );
  const [progress] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!toast) return;
    progress.stopAnimation();
    progress.setValue(0);

    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      animation = Animated.sequence([
        Animated.delay(reduceMotion ? 0 : 90),
        Animated.spring(progress, {
          toValue: 1,
          damping: 18,
          stiffness: 190,
          mass: 0.8,
          useNativeDriver: false,
        }),
        Animated.delay(reduceMotion ? 1300 : 2300),
        Animated.timing(progress, {
          toValue: 0,
          duration: reduceMotion ? 120 : 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]);
      animation.start(({ finished }) => {
        if (!finished) return;
        dismissDynamicIslandToast(toast.id);
      });
    });

    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [progress, toast]);

  if (!toast) return null;

  const expandedWidth = Math.min(width - 48, 330);
  const shellWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [118, expandedWidth],
  });
  const shellHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [35, 64],
  });
  const contentOpacity = progress.interpolate({
    inputRange: [0, 0.42, 1],
    outputRange: [0, 0, 1],
  });
  const contentTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 0],
  });

  return (
    <View
      accessibilityLabel={`${toast.title}. ${toast.message}`}
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[styles.overlay, { top: Math.max(9, insets.top - 46) }]}
    >
      <Animated.View style={[styles.shell, { height: shellHeight, width: shellWidth }]}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.icon}>
            <View style={styles.checkStem} />
            <View style={styles.checkArm} />
          </View>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>{toast.title}</Text>
            <Text numberOfLines={1} style={styles.message}>{toast.message}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    right: 0,
    left: 0,
    zIndex: 1000,
    alignItems: 'center',
    elevation: 20,
  },
  shell: {
    borderRadius: 32,
    backgroundColor: colors.black,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 15,
  },
  content: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 22,
    paddingBottom: 9,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryHighlight,
  },
  checkStem: {
    position: 'absolute',
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: colors.white,
    left: 8,
    top: 10,
    transform: [{ rotate: '-43deg' }],
  },
  checkArm: {
    position: 'absolute',
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.white,
    left: 15,
    top: 6,
    transform: [{ rotate: '42deg' }],
  },
  copy: { flex: 1, justifyContent: 'center' },
  title: { color: colors.white, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  message: { color: colors.navInactive, fontSize: 9.5, lineHeight: 13, marginTop: 1 },
});
