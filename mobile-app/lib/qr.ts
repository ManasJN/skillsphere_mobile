/**
 * lib/qr.ts
 *
 * Replaced the custom QR implementation with a small, well-tested
 * QR generator library. The previous implementation attempted to
 * re-implement the QR spec (encoding, Reed-Solomon, masking, etc.)
 * and proved brittle in edge-cases which caused runtime exceptions
 * (see commit message / issue).
 *
 * This module exposes a single helper `generateQRMatrix` that returns
 * a boolean[][] matrix (true = dark module) compatible with the
 * existing `components/QRCode.tsx` renderer.
 */

// Use the compact, pure-JS `qrcode-generator` package (kazuhiko arase)
// - tiny, stable, and works in React Native / Expo environments
// - provides `getModuleCount()` and `isDark(row, col)` which we use
// Note: `qrcode-generator` is added to mobile-app/package.json

/* eslint-disable @typescript-eslint/no-var-requires */
const QRCodeGen: any = require('qrcode-generator');

export function generateQRMatrix(text: string): boolean[][] {
  const safeText = String(text ?? '').slice(0, 1024);
  // Use error correction level 'M' (balanced) and let library pick version
  const qr = QRCodeGen(0, 'M');
  qr.addData(safeText);
  qr.make();
  const size = qr.getModuleCount();
  const matrix: boolean[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => !!qr.isDark(r, c))
  );
  return matrix;
}
