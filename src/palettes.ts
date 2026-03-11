export const palettes = [
  'turbo',
  'grayscale',
  'inferno',
  'viridis',
  'magma',
  'plasma',
  'blue-gold',
  'emerald',
  'fire',
  'cubehelix',
  'test',
] as const;

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
