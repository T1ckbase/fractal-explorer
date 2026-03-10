import {
  defaultFractalId,
  getFractalDefinition,
  type FractalId,
} from './fractals.ts';
import { OverlayPanel, type DebugEntry } from './ui/overlay.ts';
import {
  FractalRenderer,
  type RenderDiagnostics,
} from './webgpu/fractal-renderer.ts';

export class FractalExplorerApp {
  static async create(canvas: HTMLCanvasElement): Promise<FractalExplorerApp> {
    const renderer = await FractalRenderer.create(canvas);
    const app = new FractalExplorerApp(canvas, renderer);
    app.start();
    return app;
  }

  private fractalId: FractalId = defaultFractalId;
  private readonly overlay: OverlayPanel;
  private readonly resizeObserver: ResizeObserver;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly renderer: FractalRenderer,
  ) {
    this.overlay = new OverlayPanel({
      fractalId: this.fractalId,
      onFractalChange: (fractalId) => {
        this.fractalId = fractalId;
        this.renderer.setFractal(fractalId);
        this.render();
      },
    });

    document.body.append(this.overlay.element);

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
  }

  private start(): void {
    this.renderer.setFractal(this.fractalId);
    this.resizeObserver.observe(this.canvas);
    window.addEventListener('keydown', this.handleKeydown);
    this.handleResize();
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== '.' || event.repeat) {
      return;
    }

    this.overlay.toggleVisibility();
  };

  private handleResize(): void {
    this.renderer.resize();
    this.render();
  }

  private render(): void {
    const diagnostics = this.renderer.render();
    this.overlay.setDebugEntries(this.formatDiagnostics(diagnostics));
  }

  private formatDiagnostics(diagnostics: RenderDiagnostics): DebugEntry[] {
    const fractal = getFractalDefinition(diagnostics.fractalId);

    return [
      { label: 'fractal', value: fractal.label },
      {
        label: 'resolution',
        value: `${diagnostics.canvasWidth}x${diagnostics.canvasHeight}`,
      },
      {
        label: 'device pixel ratio',
        value: diagnostics.devicePixelRatio.toFixed(2),
      },
      {
        label: 'center',
        value: `(${fractal.center[0].toFixed(4)}, ${fractal.center[1].toFixed(4)})`,
      },
      { label: 'scale', value: fractal.scale.toFixed(4) },
      { label: 'iterations', value: String(fractal.maxIterations) },
      { label: 'format', value: diagnostics.presentationFormat },
      { label: 'adapter', value: diagnostics.adapterSummary },
      {
        label: 'submit',
        value: `${diagnostics.lastSubmitDurationMs.toFixed(2)} ms`,
      },
      { label: 'renders', value: String(diagnostics.renderCount) },
    ];
  }
}
