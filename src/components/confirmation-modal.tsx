import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Kembali',
  tone = 'primary',
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const danger = tone === 'danger';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Tutup dialog konfirmasi"
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={[styles.iconTile, danger ? styles.iconTileDanger : null]}>
            <SendIcon danger={danger} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.cancelButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                danger ? styles.confirmButtonDanger : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SendIcon({ danger }: { danger: boolean }) {
  const color = danger ? colors.danger : colors.primary;
  return (
    <View accessible={false} style={styles.sendIcon}>
      <View style={[styles.sendBody, { borderColor: color }]} />
      <View style={[styles.sendShaft, { backgroundColor: color }]} />
      <View style={[styles.sendHead, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(6, 17, 15, 0.58)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 38,
    elevation: 18,
  },
  iconTile: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg,
  },
  iconTileDanger: { backgroundColor: colors.dangerSurface },
  sendIcon: { width: 30, height: 30 },
  sendBody: {
    position: 'absolute',
    left: 3,
    top: 6,
    width: 17,
    height: 19,
    borderWidth: 2.2,
    borderRadius: 6,
  },
  sendShaft: {
    position: 'absolute',
    left: 13,
    top: 14,
    width: 14,
    height: 2.2,
    borderRadius: 2,
  },
  sendHead: {
    position: 'absolute',
    right: 2,
    top: 10,
    width: 9,
    height: 9,
    borderTopWidth: 2.2,
    borderRightWidth: 2.2,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  cancelText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  confirmButtonDanger: { backgroundColor: colors.danger },
  confirmText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
