export type FractalView = {
  centerX: number;
  centerY: number;
  scale: number;
  maxIterations: number;
};

const INITIAL_CENTER_X = -0.75;
const INITIAL_CENTER_Y = 0;
const INITIAL_SCALE = 3.2;
const MIN_SCALE = 1e-7;
const MAX_SCALE = 4;
const BASE_ITERATIONS = 180;

export class FractalCamera {
  private centerX = INITIAL_CENTER_X;
  private centerY = INITIAL_CENTER_Y;
  private scale = INITIAL_SCALE;

  get view(): FractalView {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      scale: this.scale,
      maxIterations: this.getMaxIterations(),
    };
  }

  panByPixels(canvas: HTMLCanvasElement, deltaX: number, deltaY: number): boolean {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const start = this.getWorldPoint(rect, rect.left, rect.top);
    const end = this.getWorldPoint(rect, rect.left + deltaX, rect.top + deltaY);
    this.centerX += start.x - end.x;
    this.centerY += start.y - end.y;
    return true;
  }

  zoomAt(canvas: HTMLCanvasElement, clientX: number, clientY: number, zoomFactor: number): boolean {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const world = this.getWorldPoint(rect, clientX, clientY);
    const offset = this.getViewOffset(rect, clientX, clientY);
    const nextScale = clamp(this.scale * zoomFactor, MIN_SCALE, MAX_SCALE);

    if (nextScale === this.scale) {
      return false;
    }

    this.scale = nextScale;
    this.centerX = world.x - offset.x * this.scale;
    this.centerY = world.y - offset.y * this.scale;
    return true;
  }

  private getWorldPoint(rect: DOMRect, clientX: number, clientY: number): { x: number; y: number } {
    const offset = this.getViewOffset(rect, clientX, clientY);

    return {
      x: this.centerX + offset.x * this.scale,
      y: this.centerY + offset.y * this.scale,
    };
  }

  private getViewOffset(rect: DOMRect, clientX: number, clientY: number): { x: number; y: number } {
    const aspect = rect.width / rect.height;
    const x = ((clientX - rect.left) / rect.width - 0.5) * aspect;
    const y = 0.5 - (clientY - rect.top) / rect.height;

    return { x, y };
  }

  private getMaxIterations(): number {
    const zoomDepth = Math.max(0, Math.log2(INITIAL_SCALE / this.scale));
    return Math.round(BASE_ITERATIONS + zoomDepth * 28);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
