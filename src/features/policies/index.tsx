import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { InlineNotice } from '@/components/ui';
import { apiRequest, authenticatedRequest } from '@/lib/api';
import { colors, radii, spacing } from '@/theme';
import type { ApiSuccess } from '@/types/api';

export const consentSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal lahir dari kalender'),
  declaredCapacity: z.boolean().refine(Boolean, 'Pernyataan kecakapan wajib disetujui'),
  acceptedTerms: z.boolean().refine(Boolean, 'Syarat penggunaan wajib disetujui'),
  acceptedPrivacy: z.boolean().refine(Boolean, 'Kebijakan privasi wajib disetujui'),
  termsVersion: z.string().min(1, 'Muat kebijakan terlebih dahulu'),
  privacyVersion: z.string().min(1, 'Muat kebijakan terlebih dahulu'),
});

export type Consent = z.infer<typeof consentSchema>;
export const emptyConsent: Consent = {
  birthDate: '',
  declaredCapacity: false,
  acceptedTerms: false,
  acceptedPrivacy: false,
  termsVersion: '',
  privacyVersion: '',
};
export type Policies = {
  version: string;
  minimumAge: number;
  terms: { title: string; content: string };
  privacy: { title: string; content: string };
};

export const fetchPolicies = () => apiRequest<ApiSuccess<Policies>>('/auth/policies');
export const acceptPolicies = (input: Consent) => authenticatedRequest('/auth/consent', {
  method: 'POST',
  body: JSON.stringify(input),
});

export function ConsentFields({ value, onChange }: { value: Consent; onChange: (value: Consent) => void }) {
  const query = useQuery({ queryKey: ['public-policies'], queryFn: fetchPolicies });
  const version = query.data?.data.version;
  const set = (patch: Partial<Consent>) => onChange({
    ...value,
    ...patch,
    termsVersion: version ?? '',
    privacyVersion: version ?? '',
  });

  return (
    <View style={styles.fields}>
      {query.isError ? (
        <View style={styles.policyError}>
          <InlineNotice tone="error">
            Kebijakan belum dapat dimuat. Pastikan backend aktif, lalu coba lagi.
          </InlineNotice>
          <Pressable
            accessibilityRole="button"
            disabled={query.isFetching}
            onPress={() => void query.refetch()}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.retryText}>{query.isFetching ? 'Memuat ulang...' : 'Coba lagi'}</Text>
          </Pressable>
        </View>
      ) : null}
      {query.isPending ? (
        <View style={styles.loadingPolicy}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingPolicyText}>Menyiapkan kebijakan terbaru...</Text>
        </View>
      ) : null}

      <BirthDatePicker value={value.birthDate} onChange={(birthDate) => set({ birthDate })} />

      <View style={styles.statementCard}>
        <Check
          checked={value.declaredCapacity}
          label="Saya berusia minimal 18 tahun dan mampu membuat kesepakatan atas nama sendiri."
          onPress={() => set({ declaredCapacity: !value.declaredCapacity })}
        />
      </View>

      <View style={styles.policyBlock}>
        <View style={styles.policyHeading}>
          <View style={styles.policyMark}><View style={styles.policyMarkLine} /></View>
          <View style={styles.policyHeadingCopy}>
            <Text style={styles.policyTitle}>Syarat & privasi</Text>
            <Text style={styles.policyDescription}>Baca dokumen sebelum memberikan persetujuan.</Text>
          </View>
        </View>
        <Link href="/policies" asChild>
          <Pressable style={({ pressed }) => [styles.policyLink, pressed ? styles.pressed : null]}>
            <Text style={styles.policyLinkText}>
              Baca dokumen kebijakan{version ? ` · Versi ${version}` : ''}
            </Text>
            <Text style={styles.policyLinkArrow}>›</Text>
          </Pressable>
        </Link>
        <View style={styles.policyChecks}>
          <Check
            checked={value.acceptedTerms}
            disabled={!version}
            label="Saya menyetujui syarat penggunaan."
            onPress={() => set({ acceptedTerms: !value.acceptedTerms })}
          />
          <View style={styles.checkDivider} />
          <Check
            checked={value.acceptedPrivacy}
            disabled={!version}
            label="Saya telah membaca dan menyetujui kebijakan privasi."
            onPress={() => set({ acceptedPrivacy: !value.acceptedPrivacy })}
          />
        </View>
      </View>
    </View>
  );
}

function BirthDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const maximumDate = useMemo(() => {
    const value = new Date();
    value.setFullYear(value.getFullYear() - 18);
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);
  const selectedDate = parseIsoDate(value);
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(() => monthStart(selectedDate ?? maximumDate));
  const calendarDays = useMemo(() => buildCalendar(month), [month]);
  const nextMonth = shiftMonth(month, 1);
  const cannotGoNext = nextMonth > monthStart(maximumDate);
  const changeYear = (amount: number) => {
    const candidate = shiftYear(month, amount);
    setMonth(candidate > monthStart(maximumDate) ? monthStart(maximumDate) : candidate);
  };

  const open = () => {
    setMonth(monthStart(selectedDate ?? maximumDate));
    setVisible(true);
  };
  const choose = (date: Date) => {
    onChange(toIsoDate(date));
    setVisible(false);
  };

  return (
    <>
      <View style={styles.dateGroup}>
        <Text style={styles.fieldLabel}>Tanggal lahir</Text>
        <Pressable
          accessibilityLabel="Pilih tanggal lahir"
          accessibilityRole="button"
          onPress={open}
          style={({ pressed }) => [styles.dateInput, pressed ? styles.dateInputPressed : null]}
        >
          <View style={styles.calendarIcon}>
            <View style={styles.calendarTop} />
            <View style={styles.calendarGrid}>
              <View style={styles.calendarGridDot} /><View style={styles.calendarGridDot} />
              <View style={styles.calendarGridDot} /><View style={styles.calendarGridDot} />
            </View>
          </View>
          <View style={styles.dateCopy}>
            <Text style={value ? styles.dateValue : styles.datePlaceholder}>
              {selectedDate ? formatLongDate(selectedDate) : 'Pilih tanggal lahir'}
            </Text>
            <Text style={styles.dateHint}>Usia minimum 18 tahun</Text>
          </View>
          <Text style={styles.dateArrow}>›</Text>
        </Pressable>
      </View>

      <Modal animationType="fade" onRequestClose={() => setVisible(false)} transparent visible={visible}>
        <Pressable onPress={() => setVisible(false)} style={styles.modalBackdrop}>
          <Pressable accessibilityViewIsModal onPress={() => undefined} style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.calendarEyebrow}>TANGGAL LAHIR</Text>
                <Text style={styles.calendarMonth}>{formatMonth(month)}</Text>
              </View>
              <Pressable hitSlop={8} onPress={() => setVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.monthControls}>
              <Pressable onPress={() => setMonth(shiftMonth(month, -1))} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>‹</Text>
              </Pressable>
              <Pressable
                disabled={cannotGoNext}
                onPress={() => setMonth(nextMonth)}
                style={[styles.monthButton, cannotGoNext ? styles.monthButtonDisabled : null]}
              >
                <Text style={styles.monthButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.yearControls}>
              <Pressable onPress={() => changeYear(-10)} style={styles.yearButton}>
                <Text style={styles.yearButtonText}>−10</Text>
              </Pressable>
              <Pressable onPress={() => changeYear(-1)} style={styles.yearButton}>
                <Text style={styles.yearButtonText}>−1</Text>
              </Pressable>
              <View style={styles.yearValue}><Text style={styles.yearValueText}>{month.getFullYear()}</Text></View>
              <Pressable
                disabled={month.getFullYear() >= maximumDate.getFullYear()}
                onPress={() => changeYear(1)}
                style={[styles.yearButton, month.getFullYear() >= maximumDate.getFullYear() ? styles.monthButtonDisabled : null]}
              >
                <Text style={styles.yearButtonText}>+1</Text>
              </Pressable>
              <Pressable
                disabled={month.getFullYear() >= maximumDate.getFullYear()}
                onPress={() => changeYear(10)}
                style={[styles.yearButton, month.getFullYear() >= maximumDate.getFullYear() ? styles.monthButtonDisabled : null]}
              >
                <Text style={styles.yearButtonText}>+10</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {calendarDays.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const disabled = date > maximumDate;
                const selected = selectedDate ? sameDay(date, selectedDate) : false;
                return (
                  <Pressable
                    accessibilityRole="button"
                    disabled={disabled}
                    key={toIsoDate(date)}
                    onPress={() => choose(date)}
                    style={[styles.dayCell, selected ? styles.dayCellSelected : null]}
                  >
                    <Text style={[
                      styles.dayText,
                      disabled ? styles.dayTextDisabled : null,
                      selected ? styles.dayTextSelected : null,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.calendarFootnote}>
              Kalender dibatasi hingga tanggal yang memenuhi usia minimum 18 tahun.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Check({ label, checked, disabled, onPress }: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.check, disabled ? styles.checkDisabled : null, pressed ? styles.pressed : null]}
    >
      <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
    ? parsed
    : null;
}

function monthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function shiftMonth(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function shiftYear(value: Date, amount: number) {
  return new Date(value.getFullYear() + amount, value.getMonth(), 1);
}

function buildCalendar(month: Date) {
  const mondayOffset = (month.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: mondayOffset }, () => null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function toIsoDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function formatMonth(value: Date) {
  return value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function formatLongDate(value: Date) {
  return value.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  policyError: { gap: spacing.sm },
  retryButton: { alignSelf: 'flex-start', borderRadius: radii.pill, backgroundColor: colors.dangerSurface, paddingHorizontal: 14, paddingVertical: 9 },
  retryText: { color: colors.dangerStrong, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  loadingPolicy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primarySoft, padding: spacing.md },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryHighlight },
  loadingPolicyText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  dateGroup: { gap: spacing.sm },
  fieldLabel: { color: colors.inkSoft, fontSize: 14, fontWeight: '800' },
  dateInput: { minHeight: 72, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.lg, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateInputPressed: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  calendarIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  calendarTop: { position: 'absolute', left: 8, right: 8, top: 8, height: 5, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: colors.primary },
  calendarGrid: { width: 22, height: 16, borderWidth: 2, borderColor: colors.primary, borderRadius: 4, marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', padding: 3, gap: 3 },
  calendarGridDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.primaryAccent },
  dateCopy: { flex: 1, gap: 3 },
  dateValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  datePlaceholder: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  dateHint: { color: colors.textSubtle, fontSize: 10 },
  dateArrow: { color: colors.primaryAccent, fontSize: 27, fontWeight: '400' },
  statementCard: { borderRadius: radii.lg, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  policyBlock: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surface },
  policyHeading: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  policyMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.warningSurface, alignItems: 'center', justifyContent: 'center' },
  policyMarkLine: { width: 17, height: 21, borderRadius: 3, borderWidth: 2, borderColor: colors.warning },
  policyHeadingCopy: { flex: 1, gap: 3 },
  policyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  policyDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  policyLink: { minHeight: 48, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  policyLinkText: { flex: 1, color: colors.primary, fontSize: 12, fontWeight: '800' },
  policyLinkArrow: { color: colors.primary, fontSize: 23 },
  policyChecks: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  check: { minHeight: 54, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  checkDisabled: { opacity: 0.42 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.primaryAccent, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: '900' },
  checkLabel: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20 },
  checkDivider: { height: 1, backgroundColor: colors.divider, marginLeft: 34 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: 'rgba(6,17,15,0.48)' },
  calendarModal: { alignSelf: 'center', width: '100%', maxWidth: 420, borderRadius: 26, backgroundColor: colors.surface, padding: spacing.xl, shadowColor: colors.black, shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.23, shadowRadius: 35, elevation: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  calendarEyebrow: { color: colors.primaryAccent, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  calendarMonth: { color: colors.ink, fontSize: 23, lineHeight: 30, fontWeight: '800', textTransform: 'capitalize', marginTop: 4 },
  closeButton: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 17, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textMuted, fontSize: 25, lineHeight: 27, fontWeight: '400', marginTop: -2 },
  monthControls: { position: 'absolute', right: spacing.xl, top: 74, flexDirection: 'row', gap: spacing.sm },
  monthButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  monthButtonDisabled: { opacity: 0.3 },
  monthButtonText: { color: colors.primary, fontSize: 25, lineHeight: 27 },
  yearControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginTop: 55, borderRadius: radii.md, backgroundColor: colors.background, padding: 5 },
  yearButton: { minWidth: 42, height: 32, borderRadius: 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  yearButtonText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  yearValue: { minWidth: 54, height: 32, alignItems: 'center', justifyContent: 'center' },
  yearValueText: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  weekRow: { flexDirection: 'row', marginTop: spacing.lg, marginBottom: spacing.sm },
  weekDay: { width: '14.2857%', color: colors.textSubtle, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  dayCellSelected: { backgroundColor: colors.primary },
  dayText: { color: colors.inkSoft, fontSize: 13, fontWeight: '700' },
  dayTextDisabled: { color: colors.borderStrong },
  dayTextSelected: { color: colors.white, fontWeight: '900' },
  calendarFootnote: { color: colors.textSubtle, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: spacing.lg },
});
