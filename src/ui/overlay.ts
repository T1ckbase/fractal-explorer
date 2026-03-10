import {
  fractals,
  isFractalId,
  type FractalId,
} from '../fractals.ts';

export interface DebugEntry {
  readonly label: string;
  readonly value: string;
}

interface OverlayPanelOptions {
  readonly fractalId: FractalId;
  readonly onFractalChange: (fractalId: FractalId) => void;
}

export class OverlayPanel {
  readonly element: HTMLElement;

  private readonly fractalSelect: HTMLSelectElement;
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

    this.debugContainer = document.createElement('pre');

    this.element.append(
      this.createSection('fractal', [this.createControlRow('type', this.fractalSelect)]),
      this.createSection('help', [
        this.createTextRow('.      toggle overlay'),
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

  private createControlRow(label: string, control: HTMLElement): HTMLElement {
    const row = document.createElement('label');
    row.className = 'overlay-row';
    row.append(`${indent()}${label} `, control);
    return row;
  }
}

function indent(level = 1): string {
  return '  '.repeat(level);
}
