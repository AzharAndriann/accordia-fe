export const colors = {
  primary: '#176B5B',
  primaryPressed: '#115448',
  primarySoft: '#E2F2ED',
  primaryMuted: '#CFE5DF',
  primaryAccent: '#408274',
  ink: '#142B27',
  inkSoft: '#19332E',
  text: '#344A45',
  textMuted: '#687975',
  textSubtle: '#7A8985',
  placeholder: '#99A6A3',
  background: '#F4F7F6',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFCFB',
  border: '#E0E8E6',
  borderStrong: '#D8E1DF',
  danger: '#AD3D3D',
  dangerStrong: '#8F3030',
  dangerSurface: '#FFF1F1',
  dangerBorder: '#C94F4F',
  warning: '#755714',
  warningSurface: '#FFF5D9',
  info: '#315B8A',
  infoSurface: '#E6F0FB',
  success: '#375E3B',
  successSurface: '#E4F1E5',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.35 },
  body: { fontSize: 14, lineHeight: 21 },
  title: { fontSize: 28, lineHeight: 35, fontWeight: '800' as const },
} as const;
