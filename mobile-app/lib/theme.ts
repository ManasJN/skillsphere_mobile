/**
 * SkillSphere Design System — v2
 * Single source of truth for all visual tokens.
 */

export const Colors = {
  // ── Backgrounds — darkest to lightest ─────────────────────────────────────
  bg0:  '#04060D',   // screen edge / deepest
  bg1:  '#080C14',   // default screen background
  bg2:  '#0C1220',   // card surface
  bg3:  '#111827',   // elevated card / input bg
  bg4:  '#161F30',   // subtle input / chip

  // ── Borders ───────────────────────────────────────────────────────────────
  border0: '#141E30',  // hairline separator
  border1: '#1C2A3F',  // card border
  border2: '#243450',  // focused/interactive
  border3: '#2D4060',  // strong emphasis border

  // ── Brand Teal ────────────────────────────────────────────────────────────
  accent:      '#2DD4BF',
  accentLight: '#5EEAD4',
  accentDim:   '#091F1D',
  accentSoft:  '#0C2826',
  accentMid:   '#134E4A',

  // ── Indigo / XP ───────────────────────────────────────────────────────────
  xp:     '#818CF8',
  xpSoft: '#13103A',
  xpMid:  '#1E1B4B',
  xpLight:'#A5B4FC',

  // ── Semantic Colours ──────────────────────────────────────────────────────
  success: '#34D399',  low:  '#34D399',
  warning: '#FBBF24',  medium: '#FBBF24',
  danger:  '#F87171',  high: '#F87171',
  info:    '#38BDF8',

  // ── Text ──────────────────────────────────────────────────────────────────
  text0: '#F0F4FF',  // primary — headings
  text1: '#C8D3E8',  // body
  text2: '#8FA0BC',  // secondary
  text3: '#5B6E8A',  // disabled / hint
  text4: '#3D5069',  // placeholder

  // ── Skill category palette ────────────────────────────────────────────────
  skill: {
    'Web Development': '#38BDF8',
    'AI/ML':           '#A78BFA',
    'Cloud':           '#34D399',
    'DSA':             '#818CF8',
    'UI/UX':           '#F472B6',
    'Data Science':    '#FB923C',
    'Mobile':          '#4ADE80',
    'DevOps':          '#94A3B8',
    default:           '#64748B',
  },
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl:36,
} as const;

export const Radius = {
  xs:   6,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 9999,
} as const;

export const Typography = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 40 },
  h1:      { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 34 },
  h2:      { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
  h3:      { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 23 },
  h4:      { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  label:   { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  bodySm:  { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  ui:      { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.1 },
  uiSm:    { fontSize: 13, fontWeight: '600' as const },
  mono:    { fontSize: 13, fontWeight: '600' as const },
  stat:    { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  statSm:  { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  accent: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },
  xp: {
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 9,
  },
} as const;
