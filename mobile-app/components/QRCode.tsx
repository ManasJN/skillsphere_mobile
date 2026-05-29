/**
 * components/QRCode.tsx
 *
 * Renders a QR code matrix as a React Native View grid.
 * No external dependencies — uses only core RN primitives.
 *
 * The QR matrix (boolean[][]) from lib/qr.ts is rendered as a grid
 * of tiny View cells. Each cell is either the dark color or transparent.
 * A quiet zone (white border) surrounds the code as required by the spec.
 *
 * Performance notes:
 *  - The matrix is computed outside render and memoized
 *  - Each row is rendered as a single flex row of cells
 *  - No FlatList needed — QR codes are small (21-57 cells)
 *  - Cell size is derived from total size / matrix size
 */

import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { generateQRMatrix } from '@/lib/qr';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  /** The string to encode — typically a URL */
  value:      string;
  /** Total size of the QR code in points (including quiet zone) */
  size?:      number;
  /** Dark module color */
  darkColor?: string;
  /** Light module color (background) */
  lightColor?: string;
  /** Quiet zone modules on each side (spec requires ≥4) */
  quietZone?: number;
  style?:     StyleProp<ViewStyle>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function QRCode({
  value,
  size       = 200,
  darkColor  = '#F1F3F5',  // theme text0 — warm white on dark bg
  lightColor = 'transparent',
  quietZone  = 4,
  style,
}: Props) {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);

  const moduleCount = matrix.length;
  const totalModules = moduleCount + quietZone * 2;
  const cellSize     = size / totalModules;

  return (
    <View
      style={[
        {
          width:  size,
          height: size,
          backgroundColor: lightColor === 'transparent' ? '#0D0F12' : lightColor,
          padding: quietZone * cellSize,
        },
        style,
      ]}>
      {matrix.map((row, r) => (
        <View key={r} style={S.row}>
          {row.map((dark, c) => (
            <View
              key={c}
              style={{
                width:           cellSize,
                height:          cellSize,
                backgroundColor: dark ? darkColor : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
