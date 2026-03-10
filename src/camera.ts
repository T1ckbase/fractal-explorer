import type { FractalDefinition } from './fractals.ts';

const minScale = 1e-8;
const maxScale = 8;

export interface CameraSnapshot {
  readonly center: readonly [number, number];
  readonly scale: number;
}

export class FractalCamera {
  static fromFractal(fractal: FractalDefinition): FractalCamera {
    return new FractalCamera(fractal.center, fractal.scale);
  }

  private centerX: number;
  private centerY: number;
  private scaleValue: number;

  constructor(center: readonly [number, number], scale: number) {
    this.centerX = center[0];
    this.centerY = center[1];
    this.scaleValue = scale;
  }

  reset(fractal: FractalDefinition): void {
    this.centerX = fractal.center[0];
    this.centerY = fractal.center[1];
    this.scaleValue = fractal.scale;
  }

  snapshot(): CameraSnapshot {
    return {
      center: [this.centerX, this.centerY],
      scale: this.scaleValue,
    };
  }

  panByPixels(
    deltaX: number,
    deltaY: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }

    const aspect = viewportWidth / viewportHeight;
    this.centerX -= (deltaX / viewportWidth) * 2 * aspect * this.scaleValue;
    this.centerY += (deltaY / viewportHeight) * 2 * this.scaleValue;
  }

  zoomAt(
    viewportX: number,
    viewportY: number,
    zoomFactor: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    if (viewportWidth <= 0 || viewportHeight <= 0 || zoomFactor <= 0) {
      return;
    }

    const aspect = viewportWidth / viewportHeight;
    const normalizedX = (viewportX / viewportWidth) * 2 - 1;
    const normalizedY = 1 - (viewportY / viewportHeight) * 2;
    const anchorX = this.centerX + normalizedX * aspect * this.scaleValue;
    const anchorY = this.centerY + normalizedY * this.scaleValue;
    const nextScale = clamp(this.scaleValue * zoomFactor, minScale, maxScale);

    this.centerX = anchorX - normalizedX * aspect * nextScale;
    this.centerY = anchorY - normalizedY * nextScale;
    this.scaleValue = nextScale;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
