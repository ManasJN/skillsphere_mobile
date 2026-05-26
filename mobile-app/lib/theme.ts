/**
 * SkillSphere design system.
 *
 * Dark-only, compact, border-led UI inspired by Linear, GitHub, Raycast,
 * and Notion. Keep new components on these tokens instead of hardcoded
 * colors, spacing, radii, shadows, or ad hoc type sizes.
 */

export const Colors = {
  bg0: '#090B0D',
  bg1: '#0D0F12',
  bg2: '#121519',
  bg3: '#171B20',
  bg4: '#1D232A',

  border0: '#1A2027',
  border1: '#252C35',
  border2: '#323B46',
  border3: '#46515E',

  accent: '#8AB4F8',
  accentLight: '#B8D1FF',
  accentDim: '#101823',
  accentSoft: '#162233',
  accentMid: '#2A3B55',

  success: '#78C690',
  warning: '#D2A85F',
  danger: '#D97979',
  info: '#8AB4F8',

  text0: '#F1F3F5',
  text1: '#CAD0D8',
  text2: '#99A2AE',
  text3: '#6D7683',
  text4: '#4D5663',

  overlay: 'rgba(0, 0, 0, 0.48)',

  status: {
    dangerBg: '#1B0E10',
    dangerBorder: '#3C1B21',
    successBg: '#0D1A13',
    successBorder: '#1C3A27',
    warningBg: '#1B160A',
    warningBorder: '#3A2D12',
  },

  skill: {
    'Web Development': '#8AB4F8',
    'AI/ML': '#A6A1D8',
    Cloud: '#78C690',
    DSA: '#98A6D8',
    'UI/UX': '#C793B7',
    'Data Science': '#D0A06A',
    Mobile: '#7BC798',
    DevOps: '#8A99A8',
    default: '#737D8A',
  },
} as const;

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const Radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: 0, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 22 },
  h4: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 20 },

  body: { fontSize: 15, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 19 },
  bodyXs: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 17 },

  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 15,
    textTransform: 'uppercase' as const,
  },
  ui: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 20 },
  uiSm: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 18 },
  mono: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 18 },

  stat: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0, lineHeight: 34 },
  statSm: { fontSize: 20, fontWeight: '700' as const, letterSpacing: 0, lineHeight: 25 },
} as const;

export const IconSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const Control = {
  inputHeight: 48,
  buttonHeight: 46,
  buttonSmallHeight: 34,
  iconButton: 38,
  tabIcon: 22,
  tabIconBox: 30,
} as const;

export const Layout = {
  screenPadding: Spacing.lg,
  screenGap: Spacing.md,
  sectionGap: Spacing.sm,
  cardPadding: Spacing.lg,
  rowGap: Spacing.sm,
} as const;

export const Surface = {
  screen: {
    backgroundColor: Colors.bg1,
  },
  card: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border1,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  inset: {
    backgroundColor: Colors.bg3,
    borderColor: Colors.border1,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentMid,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: Colors.status.dangerBg,
    borderColor: Colors.status.dangerBorder,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
} as const;

export const Shadow = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  hairline: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

export const NAV_BOTTOM_OFFSET = 88;
