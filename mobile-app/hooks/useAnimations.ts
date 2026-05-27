/**
 * useAnimations — Shared animation hooks for SkillSphere
 *
 * Principles:
 *  - All durations 150–250ms (fast and responsive)
 *  - Prefer opacity + scale, avoid position/layout animations
 *  - Natural easing (ease out for entrances, ease in for exits)
 *  - No spring overuse — reserved only for press feedback
 *  - Reanimated worklets for thread-safe 60fps animations
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// ─── Timing presets ───────────────────────────────────────────────────────────

export const Duration = {
  fast:     150,
  standard: 200,
  relaxed:  250,
} as const;

export const Ease = {
  out:    Easing.out(Easing.cubic),
  in:     Easing.in(Easing.cubic),
  inOut:  Easing.inOut(Easing.cubic),
  decel:  Easing.out(Easing.quad),   // for entrances
  accel:  Easing.in(Easing.quad),    // for exits
} as const;

// ─── useFadeIn — subtle entrance animation ───────────────────────────────────

/**
 * Returns an Animated.Value that fades from 0→1 on mount.
 * Optional delay for stagger effects.
 */
export function useFadeIn(delay = 0, duration = Duration.standard) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Ease.decel,
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
}

// ─── useFadeSlideIn — opacity + subtle upward slide ──────────────────────────

/**
 * Combines fade + a gentle translateY entrance.
 * Feels handcrafted, not mechanical.
 */
export function useFadeSlideIn(delay = 0, slideDistance = 8) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: Duration.relaxed,
        delay,
        easing: Ease.decel,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: Duration.relaxed,
        delay,
        easing: Ease.decel,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

// ─── useStaggerFadeIn — stagger a list of items ──────────────────────────────

/**
 * Takes a count; returns an array of Animated.Values,
 * each staggered by `staggerMs`. Mount-only.
 */
export function useStaggerFadeIn(count: number, staggerMs = 40, baseDelay = 0) {
  const values = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const anims = values.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: Duration.standard,
        delay: baseDelay + i * staggerMs,
        easing: Ease.decel,
        useNativeDriver: true,
      })
    );
    Animated.stagger(staggerMs, anims).start();
  }, [count]);

  return values;
}

// ─── usePressScale — tactile press feedback ──────────────────────────────────

/**
 * Returns scale + handlers for press feedback.
 * Use with Animated.View wrapping your Pressable content.
 *
 * Example:
 *   const { scale, onPressIn, onPressOut } = usePressScale();
 *   <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
 *     <Animated.View style={{ transform: [{ scale }] }}>...</Animated.View>
 *   </Pressable>
 */
export function usePressScale(toScale = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: toScale,
      duration: Duration.fast,
      easing: Ease.out,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: Duration.fast,
      easing: Ease.out,
      useNativeDriver: true,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

// ─── useSkeletonPulse — animated skeleton shimmer ────────────────────────────

/**
 * Returns an opacity that pulses between 0.5 and 1.0 for skeleton loaders.
 */
export function useSkeletonPulse() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Ease.inOut,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          easing: Ease.inOut,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return opacity;
}

// ─── useTabIndicator — smooth tab indicator transition ───────────────────────

/**
 * Manages animated tab indicator position/opacity.
 * Use in custom tab bars.
 */
export function useTabFocus(focused: boolean) {
  const scale   = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.55)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1 : 0.85,
        duration: Duration.fast,
        easing: Ease.out,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.55,
        duration: Duration.fast,
        easing: Ease.out,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return { scale, opacity };
}

// ─── useCountUp — animate numeric value change ───────────────────────────────

/**
 * Animates a counter from 0 to `value` over `duration`.
 * Returns the Animated.Value.
 */
export function useCountUp(value: number, duration = 600, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value <= 0) return;
    Animated.timing(anim, {
      toValue: value,
      duration,
      delay,
      easing: Ease.decel,
      useNativeDriver: false, // must be false for interpolated numbers
    }).start();
  }, [value]);

  return anim;
}
