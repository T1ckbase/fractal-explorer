export const palettes = ['blue-gold', 'fire', 'grayscale', 'viridis'] as const;

export type PaletteId = (typeof palettes)[number];

export const defaultPaletteId: PaletteId = palettes[0];

export function isPaletteId(value: string): value is PaletteId {
  return palettes.includes(value as PaletteId);
}

export function getPaletteIndex(paletteId: PaletteId): number {
  const index = palettes.indexOf(paletteId);

  if (index === -1) {
    throw new Error(`Unknown palette: ${paletteId}`);
  }

  return index;
}
