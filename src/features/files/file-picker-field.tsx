import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InlineNotice } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export function FilePickerField({
  assets,
  disabled,
  label = 'Lampiran',
  maxFiles = 5,
  onChange,
}: {
  assets: DocumentPickerAsset[];
  disabled?: boolean;
  label?: string;
  maxFiles?: number;
  onChange: (assets: DocumentPickerAsset[]) => void;
}) {
  async function pickFiles() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: maxFiles > 1,
    });
    if (result.canceled) return;
    const combined = [...assets, ...result.assets].slice(0, maxFiles);
    const unique = combined.filter((asset, index) =>
      combined.findIndex((candidate) => candidate.uri === asset.uri) === index,
    );
    onChange(unique);
  }

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || assets.length >= maxFiles}
        onPress={() => void pickFiles()}
        style={({ pressed }) => [styles.picker, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
      >
        <Text style={styles.plus}>+</Text>
        <View style={styles.pickerCopy}>
          <Text style={styles.pickerTitle}>Pilih PDF atau gambar</Text>
          <Text style={styles.pickerHint}>Maks. {maxFiles} file, masing-masing 10 MiB</Text>
        </View>
      </Pressable>
      {assets.length > 0 ? (
        <View style={styles.files}>
          {assets.map((asset) => (
            <View key={asset.uri} style={styles.fileRow}>
              <View style={styles.fileCopy}>
                <Text numberOfLines={1} style={styles.fileName}>{asset.name}</Text>
                <Text style={styles.fileSize}>{formatBytes(asset.size)}</Text>
              </View>
              <Pressable disabled={disabled} hitSlop={8} onPress={() => onChange(assets.filter((item) => item.uri !== asset.uri))}>
                <Text style={styles.remove}>Hapus</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <InlineNotice>Format yang diterima backend: PDF, JPEG, atau PNG.</InlineNotice>
      )}
    </View>
  );
}

export function formatBytes(size?: number) {
  if (!size) return 'Ukuran tidak tersedia';
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { color: colors.inkSoft, fontSize: 14, fontWeight: '700' },
  picker: { minHeight: 72, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primaryAccent, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
  plus: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', textAlign: 'center', lineHeight: 36, color: colors.white, backgroundColor: colors.primary, fontSize: 23, fontWeight: '500' },
  pickerCopy: { flex: 1, gap: 3 },
  pickerTitle: { color: colors.inkSoft, fontSize: 13, fontWeight: '800' },
  pickerHint: { color: colors.textSubtle, fontSize: 11 },
  files: { gap: 7 },
  fileRow: { borderRadius: radii.md, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  fileCopy: { flex: 1, gap: 2 },
  fileName: { color: colors.inkSoft, fontSize: 12, fontWeight: '700' },
  fileSize: { color: colors.textSubtle, fontSize: 10 },
  remove: { color: colors.danger, fontSize: 11, fontWeight: '800' },
});
