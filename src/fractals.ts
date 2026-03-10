export type FractalId = 'mandelbrot' | 'burning-ship';

const shaderFractalTypes = {
  burningShip: 0,
  mandelbrot: 1,
} as const;

type ShaderFractalType = (typeof shaderFractalTypes)[keyof typeof shaderFractalTypes];

export interface FractalDefinition {
  readonly id: FractalId;
  readonly label: string;
  readonly shaderType: ShaderFractalType;
  readonly center: readonly [number, number];
  readonly scale: number;
  readonly maxIterations: number;
}

const fractalDefinitions = [
  {
    id: 'mandelbrot',
    label: 'Mandelbrot',
    shaderType: shaderFractalTypes.mandelbrot,
    center: [-0.5, 0],
    scale: 1.5,
    maxIterations: 256,
  },
  {
    id: 'burning-ship',
    label: 'Burning Ship',
    shaderType: shaderFractalTypes.burningShip,
    center: [-0.5, 0.5],
    scale: 1.8,
    maxIterations: 256,
  },
] as const satisfies readonly FractalDefinition[];

const fractalDefinitionsById = new Map<FractalId, FractalDefinition>(
  fractalDefinitions.map((definition) => [definition.id, definition]),
);

export const fractals = [...fractalDefinitions];

export const defaultFractalId: FractalId = 'mandelbrot';

export function getFractalDefinition(fractalId: FractalId): FractalDefinition {
  const definition = fractalDefinitionsById.get(fractalId);

  if (!definition) {
    throw new Error(`Unknown fractal: ${fractalId}`);
  }

  return definition;
}

export function isFractalId(value: string): value is FractalId {
  return fractalDefinitionsById.has(value as FractalId);
}
