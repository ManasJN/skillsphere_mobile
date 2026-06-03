/**
 * SkillSphere design system.
 *
 * Compact, border-led UI inspired by Linear, GitHub, Raycast, and Notion.
 * Keep new components on these tokens instead of hardcoded colors, spacing,
 * radii, shadows, or ad hoc type sizes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

export type ThemeMode = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'skillsphere.theme';

export const ThemePalettes = {
  dark: {
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
  },
  light: {
    bg0: '#FFFFFF',
    bg1: '#F6F8FB',
    bg2: '#FFFFFF',
    bg3: '#F0F3F7',
    bg4: '#E7ECF2',

    border0: '#E5EAF0',
    border1: '#D6DEE8',
    border2: '#C5CEDA',
    border3: '#9FAABC',

    accent: '#2563EB',
    accentLight: '#1D4ED8',
    accentDim: '#EAF1FF',
    accentSoft: '#DBE8FF',
    accentMid: '#B8CCF4',

    success: '#15803D',
    warning: '#B7791F',
    danger: '#C24141',
    info: '#2563EB',

    text0: '#111827',
    text1: '#263140',
    text2: '#526173',
    text3: '#728094',
    text4: '#9AA4B2',

    overlay: 'rgba(15, 23, 42, 0.36)',

    status: {
      dangerBg: '#FFF1F2',
      dangerBorder: '#F4B7BE',
      successBg: '#ECFDF3',
      successBorder: '#B7E4C7',
      warningBg: '#FFF8E7',
      warningBorder: '#EBCB82',
    },

    skill: {
      'Web Development': '#2563EB',
      'AI/ML': '#6D5BD0',
      Cloud: '#15803D',
      DSA: '#4F64C8',
      'UI/UX': '#A43E7C',
      'Data Science': '#B36B20',
      Mobile: '#138A54',
      DevOps: '#637083',
      default: '#728094',
    },
  },
} as const;

type ColorPalette = typeof ThemePalettes.dark;

let activeMode: ThemeMode = 'dark';
const tokenPathByValue = new Map<string, string[]>();

function readPath(source: any, path: string[]) {
  return path.reduce((obj, key) => obj?.[key], source);
}

function indexPaletteValues(source: any, path: string[] = []) {
  Object.entries(source).forEach(([key, value]) => {
    const nextPath = [...path, key];
    if (typeof value === 'string') {
      tokenPathByValue.set(value.toLowerCase(), nextPath);
    } else {
      indexPaletteValues(value, nextPath);
    }
  });
}

indexPaletteValues(ThemePalettes.dark);
indexPaletteValues(ThemePalettes.light);

function activePalette(): ColorPalette {
  return ThemePalettes[activeMode];
}

function makeTokenProxy<T extends Record<string, any>>(path: string[] = []): T {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      const nextPath = [...path, prop];
      const value = readPath(activePalette(), nextPath);
      if (value && typeof value === 'object') return makeTokenProxy(nextPath);
      return value;
    },
  }) as T;
}

export const Colors = makeTokenProxy<ColorPalette>();

const patchMarker = '__skillsphereThemePatched';

function themedStyleValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const tokenPath = tokenPathByValue.get(value.toLowerCase());
    if (!tokenPath) return value;
    return { __themeTokenPath: tokenPath };
  }
  if (Array.isArray(value)) return value.map(themedStyleValue);
  if (value && typeof value === 'object') return wrapThemedStyle(value as Record<string, unknown>);
  return value;
}

function wrapThemedStyle(style: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  Object.entries(style).forEach(([key, value]) => {
    const themed = themedStyleValue(value);
    if (themed && typeof themed === 'object' && '__themeTokenPath' in themed) {
      const token = themed as { __themeTokenPath: string[] };
      Object.defineProperty(out, key, {
        enumerable: true,
        configurable: true,
        get: () => readPath(activePalette(), token.__themeTokenPath),
      });
    } else {
      out[key] = themed;
    }
  });

  return out;
}

const styleSheetRef = StyleSheet as unknown as {
  create: typeof StyleSheet.create;
  __skillsphereThemePatched?: boolean;
};

if (!styleSheetRef[patchMarker]) {
  const create = StyleSheet.create.bind(StyleSheet);
  styleSheetRef.create = (styles: any) => {
    const wrapped: Record<string, unknown> = {};
    Object.entries(styles).forEach(([key, value]) => {
      wrapped[key] = wrapThemedStyle(value as Record<string, unknown>);
    });
    return create(wrapped as any);
  };
  styleSheetRef[patchMarker] = true;
}

type ThemeContextValue = {
  colors: ColorPalette;
  isDark: boolean;
  mode: ThemeMode;
  ready: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: ThemePalettes.dark,
  isDark: true,
  mode: 'dark',
  ready: false,
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        const nextMode: ThemeMode = stored === 'light' ? 'light' : 'dark';
        activeMode = nextMode;
        setMode(nextMode);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => { mounted = false; };
  }, []);

  const setThemeMode = async (nextMode: ThemeMode) => {
    activeMode = nextMode;
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  const value = useMemo<ThemeContextValue>(() => ({
    colors: ThemePalettes[mode],
    isDark: mode === 'dark',
    mode,
    ready,
    setThemeMode,
    toggleTheme: () => setThemeMode(mode === 'dark' ? 'light' : 'dark'),
  }), [mode, ready]);

  if (!ready) return null;

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

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
