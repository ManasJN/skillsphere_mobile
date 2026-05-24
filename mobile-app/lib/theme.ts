/**
 * SkillSphere Design System — v3
 * Human-crafted. Notion/Linear/Todoist inspired.
 * Charcoal dark theme. Sky-blue accent only where it earns its place.
 * No neon. No glow. No oversaturated gradients.
 */

// ─── Color Tokens ─────────────────────────────────────────────────────────────

export const Colors = {
  // Backgrounds — natural graphite, not deep-space black
  bg0:  '#0D0F11',   // absolute deepest (status bar, edge bleed)
  bg1:  '#111315',   // default screen background
  bg2:  '#161A1D',   // card / surface
  bg3:  '#1C2025',   // elevated card / input background
  bg4:  '#222830',   // chip / tag / subtle surface

  // Borders — barely visible, just enough structure
  border0: '#1E2329',   // hairline separator
  border1: '#252D36',   // card border (default)
  border2: '#2E3844',   // focused / interactive
  border3: '#3A4858',   // strong emphasis

  // Sky-blue accent — used sparingly: active states, progress, key numbers
  accent:      '#5DADE2',  // primary sky blue
  accentLight: '#7EC8F0',  // lighter tint for text on dark
  accentDim:   '#0E1E2E',  // very dark tinted surface
  accentSoft:  '#122030',  // tinted card background
  accentMid:   '#1E3A52',  // tinted border

  // Semantic — muted, not loud
  success: '#52B788',
  warning: '#E9B558',
  danger:  '#D16666',
  info:    '#5DADE2',  // same as accent — info uses the sky-blue

  // Text — natural hierarchy, not harsh white-on-black
  text0: '#F2F4F7',   // headings / primary
  text1: '#C4CBD6',   // body
  text2: '#8E99A8',   // secondary / captions
  text3: '#5A6472',   // disabled / hints
  text4: '#3D4752',   // placeholder

  // Skill category palette — muted, not neon
  skill: {
    'Web Development': '#5DADE2',
    'AI/ML':           '#9B8FD4',
    'Cloud':           '#52B788',
    'DSA':             '#7F8FD4',
    'UI/UX':           '#C47AB0',
    'Data Science':    '#D4935A',
    'Mobile':          '#5DB888',
    'DevOps':          '#7A8FA0',
    default:           '#5A6472',
  },
} as const;

// ─── Spacing — follows 4pt grid, realistic not mechanical ────────────────────

export const Spacing = {
  xs:    4,
  sm:    8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  xxxl: 36,
} as const;

// ─── Border Radius — restrained, not bubbly ───────────────────────────────────

export const Radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:  12,
  xl:  16,
  xxl: 20,
  full: 9999,
} as const;

// ─── Typography — clean weight hierarchy, mobile-first sizing ─────────────────

export const Typography = {
  // Headings
  h1:    { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 32 },
  h2:    { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 26 },
  h3:    { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 22 },
  h4:    { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },

  // Body
  body:   { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  bodyXs: { fontSize: 12, fontWeight: '400' as const, lineHeight: 17 },

  // UI labels
  label:  { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  ui:     { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.1 },
  uiSm:   { fontSize: 13, fontWeight: '500' as const },
  mono:   { fontSize: 13, fontWeight: '600' as const },

  // Stats
  stat:   { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6 },
  statSm: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
} as const;

// ─── Shadows — subtle elevation, not dramatic ─────────────────────────────────

export const Shadow = {
  // Barely-there depth for cards
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  // Standard card
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  // Modal / overlay
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Nav heights ──────────────────────────────────────────────────────────────
export const NAV_BOTTOM_OFFSET = 90; // scroll padding to clear the tab bar (56px bar + ~34px inset allowance)
