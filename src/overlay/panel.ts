import {
  clampIterations,
  type FractalKind,
  type FractalRenderState,
  type FractalSettings,
  type IterationMode,
} from '../fractal/state';

type OverlaySnapshot = {
  renderState: FractalRenderState;
  canvasWidth: number;
  canvasHeight: number;
  devicePixelRatio: number;
};

type OverlayOptions = {
  settings: FractalSettings;
  exportTypes: string[];
  onFractalKindChange: (fractalKind: FractalKind) => void;
  onIterationModeChange: (iterationMode: IterationMode) => void;
  onFixedIterationsChange: (iterations: number) => void;
  onDownload: (type: string) => void | Promise<void>;
};

export class OverlayPanel {
  private readonly element: HTMLElement;
  private readonly fractalSelect: HTMLSelectElement;
  private readonly dynamicIterationsInput: HTMLInputElement;
  private readonly fixedIterationsInput: HTMLInputElement;
  private readonly fixedModeInput: HTMLInputElement;
  private readonly exportTypeSelect: HTMLSelectElement;
  private readonly debugOutput: HTMLPreElement;
  private visible = true;

  constructor(options: OverlayOptions) {
    this.element = document.createElement('aside');
    this.element.className = 'overlay-panel';
    this.element.innerHTML = `
      <form class="overlay-form">
        <div>
          fractal
          <div class="overlay-indent">
            <label>type <select name="fractal"></select></label>
          </div>
        </div>
        <div>
          iterations
          <div class="overlay-indent">
            <label><input type="radio" name="iteration-mode" value="dynamic" /> dynamic</label><br />
            <label><input type="radio" name="iteration-mode" value="fixed" /> fixed <input name="fixed-iterations" type="number" min="1" step="1" /></label>
          </div>
        </div>
        <div>
          export image
          <div class="overlay-indent">
            <label>format <select name="export-type"></select></label>
            <button type="button">download</button>
          </div>
        </div>
      </form>
      <div>help</div>
      <div class="overlay-indent">. toggle overlay</div>
      <div>debug</div>
      <div class="overlay-indent">
        <pre class="overlay-debug"></pre>
      </div>
    `;

    document.body.append(this.element);

    this.fractalSelect = this.requireElement('select[name="fractal"]', HTMLSelectElement);
    this.dynamicIterationsInput = this.requireElement(
      'input[name="iteration-mode"][value="dynamic"]',
      HTMLInputElement,
    );
    this.fixedModeInput = this.requireElement('input[name="iteration-mode"][value="fixed"]', HTMLInputElement);
    this.fixedIterationsInput = this.requireElement('input[name="fixed-iterations"]', HTMLInputElement);
    this.exportTypeSelect = this.requireElement('select[name="export-type"]', HTMLSelectElement);
    this.debugOutput = this.requireElement('.overlay-debug', HTMLPreElement);

    addOption(this.fractalSelect, 'mandelbrot', 'mandelbrot');
    addOption(this.fractalSelect, 'burning-ship', 'burning-ship');
    this.fractalSelect.value = options.settings.fractalKind;

    for (const type of options.exportTypes) {
      addOption(this.exportTypeSelect, type, type);
    }

    this.fixedIterationsInput.value = String(options.settings.fixedIterations);
    this.setIterationMode(options.settings.iterationMode);

    this.fractalSelect.addEventListener('change', () => {
      options.onFractalKindChange(this.fractalSelect.value as FractalKind);
    });

    this.dynamicIterationsInput.addEventListener('change', () => {
      if (!this.dynamicIterationsInput.checked) {
        return;
      }

      this.setIterationMode('dynamic');
      options.onIterationModeChange('dynamic');
    });

    this.fixedModeInput.addEventListener('change', () => {
      if (!this.fixedModeInput.checked) {
        return;
      }

      this.setIterationMode('fixed');
      options.onIterationModeChange('fixed');
    });

    this.fixedIterationsInput.addEventListener('change', () => {
      const value = Number(this.fixedIterationsInput.value);
      const nextValue = clampIterations(Number.isFinite(value) ? value : options.settings.fixedIterations);
      this.fixedIterationsInput.value = String(nextValue);
      options.onFixedIterationsChange(nextValue);
    });

    this.requireElement('button', HTMLButtonElement).addEventListener('click', () => {
      void options.onDownload(this.exportTypeSelect.value);
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.element.hidden = !this.visible;
  }

  update(snapshot: OverlaySnapshot): void {
    this.debugOutput.textContent = [
      `fractal     ${snapshot.renderState.fractalKind}`,
      `center.x    ${formatNumber(snapshot.renderState.centerX)}`,
      `center.y    ${formatNumber(snapshot.renderState.centerY)}`,
      `scale       ${formatNumber(snapshot.renderState.scale)}`,
      `iterations  ${snapshot.renderState.maxIterations}`,
      `canvas      ${snapshot.canvasWidth} x ${snapshot.canvasHeight}`,
      `dpr         ${formatNumber(snapshot.devicePixelRatio)}`,
    ].join('\n');
  }

  private setIterationMode(iterationMode: IterationMode): void {
    const isDynamic = iterationMode === 'dynamic';
    this.dynamicIterationsInput.checked = isDynamic;
    this.fixedModeInput.checked = !isDynamic;
    this.fixedIterationsInput.disabled = isDynamic;
  }

  private requireElement<T extends Element>(selector: string, type: { new (): T }): T {
    const element = this.element.querySelector(selector);
    if (!(element instanceof type)) {
      throw new Error(`Missing overlay element: ${selector}`);
    }

    return element;
  }
}

function addOption(select: HTMLSelectElement, value: string, label: string): void {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.append(option);
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
