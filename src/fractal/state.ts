import type { FractalView } from './camera';

export type FractalKind = 'mandelbrot' | 'burning-ship';
export type IterationMode = 'dynamic' | 'fixed';

export type FractalSettings = {
  fractalKind: FractalKind;
  iterationMode: IterationMode;
  fixedIterations: number;
};

export type FractalRenderState = FractalView & {
  fractalKind: FractalKind;
  maxIterations: number;
};

const BASE_SCALE = 3.2;
const BASE_ITERATIONS = 180;
const MIN_FIXED_ITERATIONS = 1;
const MAX_FIXED_ITERATIONS = 5000;

const FRACTAL_PRESETS: Record<FractalKind, FractalView> = {
  mandelbrot: {
    centerX: -0.75,
    centerY: 0,
    scale: 3.2,
  },
  'burning-ship': {
    centerX: -0.45,
    centerY: -0.5,
    scale: 3.2,
  },
};

export function getDefaultFractalSettings(): FractalSettings {
  return {
    fractalKind: 'mandelbrot',
    iterationMode: 'dynamic',
    fixedIterations: BASE_ITERATIONS,
  };
}

export function getFractalPreset(fractalKind: FractalKind): FractalView {
  const preset = FRACTAL_PRESETS[fractalKind];
  return { ...preset };
}

export function buildFractalRenderState(
  view: FractalView,
  settings: FractalSettings,
): FractalRenderState {
  const maxIterations =
    settings.iterationMode === 'dynamic'
      ? getDynamicIterations(view.scale)
      : clampIterations(settings.fixedIterations);

  return {
    ...view,
    fractalKind: settings.fractalKind,
    maxIterations,
  };
}

export function clampIterations(value: number): number {
  const rounded = Math.round(value);
  return Math.min(Math.max(rounded, MIN_FIXED_ITERATIONS), MAX_FIXED_ITERATIONS);
}

function getDynamicIterations(scale: number): number {
  const zoomDepth = Math.max(0, Math.log2(BASE_SCALE / scale));
  return Math.round(BASE_ITERATIONS + zoomDepth * 28);
}
