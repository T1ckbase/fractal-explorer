import type { FractalView } from '../fractal/camera';

type DebugSnapshot = {
  view: FractalView;
  canvasWidth: number;
  canvasHeight: number;
  devicePixelRatio: number;
};

export class DebugOverlay {
  private readonly element: HTMLPreElement;
  private visible = true;

  constructor() {
    this.element = document.createElement('pre');
    this.element.className = 'debug-overlay';
    this.element.hidden = false;
    document.body.append(this.element);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.element.hidden = !this.visible;
  }

  update(snapshot: DebugSnapshot): void {
    this.element.textContent = [
      `center.x ${formatNumber(snapshot.view.centerX)}`,
      `center.y ${formatNumber(snapshot.view.centerY)}`,
      `scale    ${formatNumber(snapshot.view.scale)}`,
      `iters    ${snapshot.view.maxIterations}`,
      `canvas   ${snapshot.canvasWidth} x ${snapshot.canvasHeight}`,
      `dpr      ${formatNumber(snapshot.devicePixelRatio)}`,
    ].join('\n');
  }
}

function formatNumber(value: number): string {
  if (value === 0) {
    return '0';
  }

  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1e4 || absoluteValue < 1e-3) {
    return value.toExponential(6);
  }

  return value.toFixed(6);
}
