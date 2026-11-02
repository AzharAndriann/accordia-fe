import type { ComponentProps } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type AccordiaWordmarkProps = {
  style?: ComponentProps<typeof View>['style'];
  tone?: 'onDark' | 'onLight';
  width?: number;
};

export function AccordiaWordmark({ style, tone = 'onDark', width = 142 }: AccordiaWordmarkProps) {
  return (
    <View style={[styles.shell, { width }, style]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Accordia"
        resizeMode="contain"
        source={require('../../assets/images/accordia-splash-mark.png')}
        style={styles.mark}
      />
      <Text style={[styles.name, tone === 'onLight' ? styles.nameOnLight : null]}>accordia</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  mark: {
    width: 46,
    height: 46,
  },
  name: { color: colors.white, fontSize: 21, fontWeight: '800', letterSpacing: -0.6 },
  nameOnLight: { color: colors.inkDeep },
});
