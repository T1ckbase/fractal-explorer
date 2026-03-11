import {
  fractals,
  iterationRange,
  isFractalId,
  type FractalId,
} from '../fractals.ts';
import { isPaletteId, palettes, type PaletteId } from '../palettes.ts';

export interface DebugEntry {
  readonly label: string;
  readonly value: string;
}

interface OverlayPanelOptions {
  readonly fractalId: FractalId;
  readonly iterationCount: number;
  readonly paletteIterationCount: number;
  readonly paletteId: PaletteId;
  readonly onFractalChange: (fractalId: FractalId) => void;
  readonly onPaletteChange: (paletteId: PaletteId) => void;
  readonly onIterationChange: (iterationCount: number) => void;
  readonly onPaletteIterationChange: (iterationCount: number) => void;
  readonly onResetIterations: () => void;
  readonly onResetPaletteIterations: () => void;
}

export class OverlayPanel {
  readonly element: HTMLElement;

  private readonly fractalSelect: HTMLSelectElement;
  private readonly paletteSelect: HTMLSelectElement;
  private readonly iterationInput: HTMLInputElement;
  private readonly paletteIterationInput: HTMLInputElement;
  private readonly debugContainer: HTMLPreElement;
  private visible = true;

  constructor(options: OverlayPanelOptions) {
    this.element = document.createElement('section');
    this.element.className = 'overlay-panel';

    this.fractalSelect = document.createElement('select');
    this.fractalSelect.ariaLabel = 'Fractal type';

    for (const fractal of fractals) {
      const option = document.createElement('option');
      option.value = fractal.id;
      option.textContent = fractal.label;
      this.fractalSelect.append(option);
    }

    this.fractalSelect.value = options.fractalId;
    this.fractalSelect.addEventListener('change', () => {
      const value = this.fractalSelect.value;

      if (!isFractalId(value)) {
        return;
      }

      options.onFractalChange(value);
    });

    this.paletteSelect = document.createElement('select');
    this.paletteSelect.ariaLabel = 'Palette';

    for (const palette of palettes) {
      const option = document.createElement('option');
      option.value = palette;
      option.textContent = palette;
      this.paletteSelect.append(option);
    }

    this.paletteSelect.value = options.paletteId;
    this.paletteSelect.addEventListener('change', () => {
      const value = this.paletteSelect.value;

      if (!isPaletteId(value)) {
        return;
      }

      options.onPaletteChange(value);
    });

    this.iterationInput = document.createElement('input');
    this.iterationInput.type = 'number';
    this.iterationInput.min = String(iterationRange.min);
    this.iterationInput.max = String(iterationRange.max);
    this.iterationInput.step = String(iterationRange.step);
    this.iterationInput.inputMode = 'numeric';
    this.iterationInput.ariaLabel = 'Iteration count';
    this.iterationInput.value = String(options.iterationCount);
    this.iterationInput.addEventListener('change', () => {
      options.onIterationChange(parseIterationCount(this.iterationInput.valueAsNumber));
    });

    const resetIterationsButton = document.createElement('button');
    resetIterationsButton.type = 'button';
    resetIterationsButton.textContent = 'reset';
    resetIterationsButton.addEventListener('click', () => {
      options.onResetIterations();
    });

    this.paletteIterationInput = document.createElement('input');
    this.paletteIterationInput.type = 'number';
    this.paletteIterationInput.min = String(iterationRange.min);
    this.paletteIterationInput.max = String(iterationRange.max);
    this.paletteIterationInput.step = String(iterationRange.step);
    this.paletteIterationInput.inputMode = 'numeric';
    this.paletteIterationInput.ariaLabel = 'Palette max iterations';
    this.paletteIterationInput.value = String(options.paletteIterationCount);
    this.paletteIterationInput.addEventListener('change', () => {
      options.onPaletteIterationChange(parseIterationCount(this.paletteIterationInput.valueAsNumber));
    });

    const resetPaletteIterationsButton = document.createElement('button');
    resetPaletteIterationsButton.type = 'button';
    resetPaletteIterationsButton.textContent = 'reset';
    resetPaletteIterationsButton.addEventListener('click', () => {
      options.onResetPaletteIterations();
    });

    this.debugContainer = document.createElement('pre');

    this.element.append(
      this.createSection('fractal', [
        this.createControlRow('type', this.fractalSelect),
        this.createControlRow('palette', this.paletteSelect),
        this.createControlRow('iterations', this.iterationInput, resetIterationsButton),
        this.createControlRow('palette max', this.paletteIterationInput, resetPaletteIterationsButton),
      ]),
      this.createSection('help', [
        this.createTextRow('.      toggle overlay'),
        this.createTextRow('r      reset view'),
        this.createTextRow('drag   pan'),
        this.createTextRow('wheel  zoom'),
      ]),
      this.createSection('debug', [this.debugContainer]),
    );
  }

  toggleVisibility(): void {
    this.visible = !this.visible;
    this.element.hidden = !this.visible;
  }

  setIterationCount(iterationCount: number): void {
    this.iterationInput.value = String(iterationCount);
  }

  setPaletteIterationCount(iterationCount: number): void {
    this.paletteIterationInput.value = String(iterationCount);
  }

  setDebugEntries(entries: readonly DebugEntry[]): void {
    const labelWidth = entries.reduce((width, entry) => {
      return Math.max(width, entry.label.length);
    }, 0);

    this.debugContainer.textContent = entries
      .map((entry) => `${indent()}${entry.label.padEnd(labelWidth)}  ${entry.value}`)
      .join('\n');
  }

  private createSection(title: string, rows: readonly HTMLElement[]): HTMLElement {
    const section = document.createElement('div');
    const heading = document.createElement('p');
    heading.textContent = title;

    section.append(heading, ...rows);
    return section;
  }

  private createTextRow(text: string): HTMLElement {
    const row = document.createElement('p');
    row.className = 'overlay-row';
    row.textContent = `${indent()}${text}`;
    return row;
  }

  private createControlRow(label: string, ...controls: readonly HTMLElement[]): HTMLElement {
    const row = document.createElement('label');
    row.className = 'overlay-row';
    row.append(`${indent()}${label} `, ...joinControls(controls));
    return row;
  }
}

function indent(level = 1): string {
  return '  '.repeat(level);
}

function parseIterationCount(value: number): number {
  if (!Number.isFinite(value)) {
    return iterationRange.min;
  }

  return Math.min(iterationRange.max, Math.max(iterationRange.min, Math.round(value)));
}

function joinControls(controls: readonly HTMLElement[]): Node[] {
  return controls.flatMap((control, index) => {
    if (index === 0) {
      return [control];
    }

    return [document.createTextNode(' '), control];
  });
}
