/**
 * SkillSphere Design System
 * One source of truth for all visual tokens.
 */

export const Colors = {
  // Background layers — darkest to lightest
  bg0: '#060810',      // deepest background
  bg1: '#0B0F1A',      // screen background
  bg2: '#0F1520',      // card/surface
  bg3: '#141C2B',      // elevated card
  bg4: '#1A2236',      // input / subtle surface

  // Borders
  border0: '#1A2236',  // hairline dividers
  border1: '#1F2D42',  // card borders
  border2: '#28395A',  // focused/interactive borders

  // Brand / Accent — electric teal
  accent:     '#2DD4BF',  // primary action, active states
  accentSoft: '#0D2926',  // tinted background for accent
  accentDim:  '#0F3330',  // deeper tinted bg
  accentText: '#5EEAD4',  // readable teal text on dark

  // Semantic — XP / Growth — indigo
  xp:     '#818CF8',  // level, XP highlights
  xpSoft: '#1E1B4B',  // XP card background

  // Semantic — Goals / Priority
  high:   '#F87171',  // high priority
  medium: '#FBBF24',  // medium priority
  low:    '#34D399',  // low priority / success

  // Text
  text0: '#F1F5F9',   // primary headings
  text1: '#CBD5E1',   // body
  text2: '#94A3B8',   // secondary/meta
  text3: '#64748B',   // disabled/hint
  text4: '#475569',   // placeholder

  // Status
  success: '#34D399',
  warning: '#FBBF24',
  danger:  '#F87171',

  // Category colors for skills
  skill: {
    webDev:    '#38BDF8',
    aiml:      '#A78BFA',
    cloud:     '#34D399',
    dsa:       '#818CF8',
    uiux:      '#F472B6',
    default:   '#94A3B8',
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const Radius = {
  sm:  8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  // Display — hero headings
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 38 },
  // H1 — screen titles
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3, lineHeight: 32 },
  // H2 — section headers
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 26 },
  // H3 — card titles
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 22 },
  // Label — eyebrows / caps
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  // Body
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  // UI — buttons, tabs
  ui: { fontSize: 15, fontWeight: '700' as const },
  uiSm: { fontSize: 13, fontWeight: '600' as const },
  // Mono — numbers, stats
  mono: { fontSize: 13, fontWeight: '600' as const },
  // Huge numbers
  stat: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  statSm: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
