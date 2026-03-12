export const iterationRange = {
  min: 1,
  max: 8192,
  step: 1,
} as const;

export const defaultIterationCount = 512;

export const fractals = [
  {
    id: 'mandelbrot',
    label: 'Mandelbrot',
    center: [-0.5, 0] as const,
    scale: 1.5,
  },
  {
    id: 'burning-ship-reflected',
    label: 'Burning Ship (reflected)',
    center: [-0.5, 0.5] as const,
    scale: 1.8,
  },
  {
    id: 'the-phallus',
    label: 'The Phallus',
    center: [0.8, -0.8] as const,
    scale: 1.5,
  },
] as const;

export type FractalDefinition = (typeof fractals)[number];
export type FractalId = FractalDefinition['id'];

const defaultFractal = fractals[0];

export const defaultFractalId: FractalId = defaultFractal.id;

export function getFractalDefinition(fractalId: FractalId): FractalDefinition {
  const fractal = fractals.find((entry) => entry.id === fractalId);

  if (!fractal) {
    throw new Error(`Unknown fractal: ${fractalId}`);
  }

  return fractal;
}

export function isFractalId(value: string): value is FractalId {
  return fractals.some((fractal) => fractal.id === value);
}
