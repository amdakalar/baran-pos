import React from 'react';
import { Product } from '../types';

/**
 * Normalize raw barcode input from any hardware scanner:
 * - Translates Eastern Arabic digits (٠-٩) and Persian digits (۰-۹) to standard Latin digits (0-9)
 * - Strips unprintable control characters, linebreaks (\r, \n, \t), and zero-width spaces
 * - Trims whitespace
 */
export function normalizeBarcode(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // Arabic-Indic ٠-٩
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0)) // Eastern Arabic / Persian ۰-۹
    .replace(/[\r\n\t\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '') // Control & zero-width chars
    .trim();
}

/**
 * Intelligent product lookup by barcode or SKU:
 * 1. Exact normalized barcode match
 * 2. Exact normalized SKU match (case-insensitive)
 * 3. EAN-13 / UPC-A 12-digit vs 13-digit leading zero tolerance
 * 4. Product ID match
 */
export function findProductByBarcode(products: Product[], rawInput: string): Product | undefined {
  const cleanInput = normalizeBarcode(rawInput);
  if (!cleanInput) return undefined;
  const cleanLower = cleanInput.toLowerCase();

  // 1. Direct exact barcode match
  let match = products.find(
    (p) => p.isActive !== false && normalizeBarcode(p.barcode) === cleanInput
  );
  if (match) return match;

  // 2. Direct exact SKU match (case-insensitive)
  match = products.find(
    (p) => p.isActive !== false && normalizeBarcode(p.sku).toLowerCase() === cleanLower
  );
  if (match) return match;

  // 3. EAN-13 vs UPC-A mismatch tolerance (12-digit vs 13-digit with leading '0')
  if (cleanInput.length === 12) {
    const withZero = '0' + cleanInput;
    match = products.find(
      (p) => p.isActive !== false && normalizeBarcode(p.barcode) === withZero
    );
    if (match) return match;
  } else if (cleanInput.length === 13 && cleanInput.startsWith('0')) {
    const withoutZero = cleanInput.slice(1);
    match = products.find(
      (p) => p.isActive !== false && normalizeBarcode(p.barcode) === withoutZero
    );
    if (match) return match;
  }

  // 4. Product ID match
  match = products.find(
    (p) => p.isActive !== false && p.id.toLowerCase() === cleanLower
  );
  if (match) return match;

  // 5. Unpadded leading zeros comparison (e.g. 0346892916704 vs 346892916704)
  const unpaddedInput = cleanInput.replace(/^0+/, '');
  if (unpaddedInput) {
    match = products.find(
      (p) => normalizeBarcode(p.barcode).replace(/^0+/, '') === unpaddedInput
    );
    if (match) return match;
  }

  // 6. Fallback match without isActive constraint
  match = products.find(
    (p) => normalizeBarcode(p.barcode) === cleanInput || normalizeBarcode(p.sku).toLowerCase() === cleanLower
  );
  if (match) return match;

  return undefined;
}

/**
 * Play a crisp POS success beep when a barcode is scanned and matched
 */
export function playBarcodeSuccessBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime); // High pitch crisp POS beep
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

/**
 * Play a low warning tone when a barcode is not found
 */
export function playBarcodeErrorTone(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {}
}

export interface UseBarcodeScannerOptions {
  onScan: (scannedCode: string) => void;
  enabled?: boolean;
  minBarcodeLength?: number;
  maxKeyIntervalMs?: number;
}

/**
 * Global Hardware Barcode Scanner Hook:
 * Listens for rapid keystroke bursts (< 250ms between keys) ending in Enter/Tab
 * from USB / Presentation / Handheld Barcode Scanners anywhere on the screen.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minBarcodeLength = 2,
  maxKeyIntervalMs = 250,
}: UseBarcodeScannerOptions): void {
  const bufferRef = React.useRef<string>('');
  const lastKeyTimeRef = React.useRef<number>(0);
  const flushTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional modifier shortcuts (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // If user is currently focused on an INPUT element, let the input handle typing and Enter submission natively
      if (isInputFocused) {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Handle Enter or Tab indicating end of barcode transmission from scanner
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        const buffered = bufferRef.current.trim();
        bufferRef.current = '';

        if (buffered.length >= minBarcodeLength) {
          e.preventDefault();
          e.stopPropagation();
          onScan(buffered);
        }
        return;
      }

      // Single printable character input outside of inputs
      if (e.key && e.key.length === 1) {
        // If interval between keystrokes was too long (> 250ms), human was idle -> reset buffer
        if (timeSinceLastKey > maxKeyIntervalMs && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }

        bufferRef.current += e.key;

        // Auto-flush fallback for scanners configured with NO Enter terminator (after 180ms of silence)
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(() => {
          const buffered = bufferRef.current.trim();
          if (buffered.length >= minBarcodeLength && Date.now() - lastKeyTimeRef.current >= 150) {
            bufferRef.current = '';
            onScan(buffered);
          }
        }, 180);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, minBarcodeLength, maxKeyIntervalMs, onScan]);
}
