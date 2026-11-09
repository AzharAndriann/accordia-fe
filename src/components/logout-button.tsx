import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type LogoutButtonProps = {
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'compact' | 'card';
};

export function LogoutButton({ onConfirm, loading, disabled, variant = 'compact' }: LogoutButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const insets = useSafeAreaInsets();
  const inactive = Boolean(loading || disabled);
  const card = variant === 'card';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Keluar dari akun"
        accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
        disabled={inactive}
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [
          card ? styles.card : styles.compact,
          pressed ? styles.pressed : null,
          inactive ? styles.disabled : null,
        ]}
      >
        <View style={card ? styles.iconTile : styles.compactIcon}>
          {loading ? <ActivityIndicator size="small" color={colors.danger} /> : <ExitIcon />}
        </View>
        <View style={card ? styles.cardCopy : undefined}>
          <Text style={[styles.label, card ? styles.cardLabel : null]}>
            {loading ? 'Sedang keluar...' : 'Keluar dari akun'}
          </Text>
          {card ? <Text style={styles.caption}>Akhiri sesi pada perangkat ini</Text> : null}
        </View>
        {card ? <Text accessible={false} style={styles.chevron}>›</Text> : null}
      </Pressable>

      <Modal
        animationType="slide"
        transparent
        visible={confirming}
        onRequestClose={() => setConfirming(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup konfirmasi keluar"
            onPress={() => setConfirming(false)}
            style={styles.backdrop}
          />
          <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.handle} />
            <View style={styles.sheetIcon}><ExitIcon /></View>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Keluar dari Accordia?</Text>
            <Text style={styles.sheetDescription}>
              Kamu perlu masuk kembali untuk melanjutkan kerja sama dan melihat proyekmu.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirming(false)}
              style={({ pressed }) => [styles.stayButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.stayText}>Tetap masuk</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirming(false);
                onConfirm();
              }}
              style={({ pressed }) => [styles.confirmButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.confirmText}>Ya, keluar dari akun</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ExitIcon() {
  return (
    <View accessible={false} style={styles.exitIcon}>
      <View style={styles.door} />
      <View style={styles.arrowShaft} />
      <View style={styles.arrowHead} />
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { alignSelf: 'center', minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18, borderRadius: 24 },
  compactIcon: { width: 22, height: 24, justifyContent: 'center', alignItems: 'center' },
  card: { minHeight: 82, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#F1E3E1', flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 16, marginTop: 8 },
  iconTile: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.dangerSurface, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 4 },
  label: { color: colors.danger, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  cardLabel: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  caption: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  chevron: { color: colors.danger, opacity: 0.65, fontSize: 25, lineHeight: 30, marginLeft: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  exitIcon: { width: 22, height: 22 },
  door: { position: 'absolute', top: 3, left: 2, width: 9, height: 16, borderWidth: 1.8, borderColor: colors.danger, borderRightWidth: 0, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  arrowShaft: { position: 'absolute', top: 10, left: 7, width: 12, height: 1.8, backgroundColor: colors.danger, borderRadius: 1 },
  arrowHead: { position: 'absolute', top: 7, right: 2, width: 7, height: 7, borderTopWidth: 1.8, borderRightWidth: 1.8, borderColor: colors.danger, transform: [{ rotate: '45deg' }] },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(6,17,15,0.44)' },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 560, backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 26, paddingTop: 12, alignItems: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: 26 },
  sheetIcon: { width: 64, height: 64, borderRadius: 23, backgroundColor: colors.dangerSurface, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  sheetTitle: { color: colors.ink, fontSize: 23, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  sheetDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 22, maxWidth: 330, textAlign: 'center', marginTop: 9, marginBottom: 26 },
  stayButton: { alignSelf: 'stretch', minHeight: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  stayText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  confirmButton: { alignSelf: 'stretch', minHeight: 52, borderRadius: 18, backgroundColor: colors.dangerSurface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 10 },
  confirmText: { color: colors.dangerStrong, fontSize: 14, fontWeight: '800' },
});
