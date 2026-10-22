import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCurrentUser } from '@/lib/session';
import { colors } from '@/theme';

type IconName = 'home' | 'projects' | 'user';

const destinations = [
  { label: 'Beranda', route: '/(app)', path: '/', icon: 'home' as const },
  { label: 'Proyek', route: '/(app)/projects', path: '/projects', icon: 'projects' as const },
  { label: 'Akun', route: '/(app)/account', path: '/account', icon: 'user' as const },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = getCurrentUser();
  const visible = pathname === '/' || pathname === '/projects' || pathname === '/account';

  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom - 18, 8) }]}
    >
      <View style={styles.bar}>
        {destinations.slice(0, 2).map((item) => (
          <NavButton
            active={pathname === item.path}
            icon={item.icon}
            key={item.path}
            label={item.label}
            onPress={() => router.replace(item.route)}
          />
        ))}

        {currentUser?.role === 'FREELANCER' ? (
          <View style={styles.createSlot}>
            <Pressable
              accessibilityLabel="Buat proyek"
              accessibilityRole="button"
              onPress={() => router.push('/(app)/projects/new')}
              style={({ pressed }) => [styles.createButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.createIcon}>＋</Text>
            </Pressable>
          </View>
        ) : null}

        <NavButton
          active={pathname === destinations[2].path}
          icon={destinations[2].icon}
          label={destinations[2].label}
          onPress={() => router.replace(destinations[2].route)}
        />
      </View>
    </View>
  );
}

function NavButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navButton,
        pressed ? styles.pressed : null,
      ]}
    >
      <NavIcon active={active} name={icon} />
      {active ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
}

function NavIcon({ active, name }: { active: boolean; name: IconName }) {
  const colorStyle = active ? styles.iconActive : styles.iconInactive;

  if (name === 'projects') {
    return (
      <View style={[styles.documentIcon, colorStyle]}>
        <View style={[styles.documentLine, colorStyle]} />
        <View style={[styles.documentLine, styles.documentLineShort, colorStyle]} />
      </View>
    );
  }

  if (name === 'user') {
    return (
      <View style={styles.userIcon}>
        <View style={[styles.userHead, colorStyle]} />
        <View style={[styles.userBody, colorStyle]} />
      </View>
    );
  }

  return (
    <View style={styles.homeIcon}>
      <View style={[styles.homeRoof, colorStyle]} />
      <View style={[styles.homeBody, colorStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 18,
    left: 18,
    borderRadius: 34,
    shadowColor: colors.inkShadow,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 12,
  },
  bar: {
    minHeight: 66,
    alignSelf: 'stretch',
    borderRadius: 34,
    backgroundColor: colors.inkNav,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  navButton: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primaryHighlight },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  createSlot: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  createIcon: { color: colors.primary, fontSize: 27, lineHeight: 29, fontWeight: '500' },
  iconActive: { borderColor: colors.white },
  iconInactive: { borderColor: colors.navInactive },
  homeIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  homeRoof: { position: 'absolute', top: 1, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2, transform: [{ rotate: '45deg' }] },
  homeBody: { width: 15, height: 13, borderWidth: 2, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  documentIcon: { width: 18, height: 22, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', gap: 4 },
  documentLine: { width: 10, borderTopWidth: 2 },
  documentLineShort: { width: 7, alignSelf: 'flex-start', marginLeft: 2 },
  userIcon: { width: 22, height: 22, alignItems: 'center' },
  userHead: { width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  userBody: { position: 'absolute', bottom: 0, width: 18, height: 10, borderWidth: 2, borderRadius: 9, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
});
