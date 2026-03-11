import { FractalCamera } from './camera.ts';
import {
  defaultFractalId,
  getFractalDefinition,
  iterationRange,
  type FractalId,
} from './fractals.ts';
import {
  defaultPaletteId,
  type PaletteId,
} from './palettes.ts';
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
  private readonly camera = FractalCamera.fromFractal(
    getFractalDefinition(defaultFractalId),
  );
  private iterationCount = getFractalDefinition(defaultFractalId).defaultIterations;
  private paletteId: PaletteId = defaultPaletteId;
  private readonly overlay: OverlayPanel;
  private readonly resizeObserver: ResizeObserver;
  private activePointerId: number | null = null;
  private lastPointerPosition: readonly [number, number] | null = null;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly renderer: FractalRenderer,
  ) {
    this.overlay = new OverlayPanel({
      fractalId: this.fractalId,
      iterationCount: this.iterationCount,
      paletteId: this.paletteId,
      onFractalChange: (fractalId) => {
        this.fractalId = fractalId;
        const fractal = getFractalDefinition(fractalId);
        this.camera.reset(fractal);
        this.iterationCount = fractal.defaultIterations;
        this.overlay.setIterationCount(this.iterationCount);
        this.render();
      },
      onPaletteChange: (paletteId) => {
        this.paletteId = paletteId;
        this.render();
      },
      onIterationChange: (iterationCount) => {
        this.iterationCount = clampIterationCount(iterationCount);
        this.overlay.setIterationCount(this.iterationCount);
        this.render();
      },
      onResetIterations: () => {
        this.resetIterations();
      },
    });

    document.body.append(this.overlay.element);

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
  }

  private start(): void {
    this.resizeObserver.observe(this.canvas);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('lostpointercapture', this.handleLostPointerCapture);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKeydown);
    this.handleResize();
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.repeat || isEditingControl(event.target)) {
      return;
    }

    switch (event.key) {
      case '.':
        this.overlay.toggleVisibility();
        break;
      case 'r':
      case 'R':
        this.resetView();
        break;
      default:
        break;
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.lastPointerPosition = [event.clientX, event.clientY];
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId || !this.lastPointerPosition) {
      return;
    }

    const [lastX, lastY] = this.lastPointerPosition;
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;
    this.lastPointerPosition = [event.clientX, event.clientY];

    const rect = this.canvas.getBoundingClientRect();
    this.camera.panByPixels(deltaX, deltaY, rect.width, rect.height);
    this.render();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.canvas.releasePointerCapture(event.pointerId);
    this.clearPointerState();
  };

  private readonly handleLostPointerCapture = (): void => {
    this.clearPointerState();
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = event.clientX - rect.left;
    const viewportY = event.clientY - rect.top;
    const deltaY = normalizeWheelDelta(event, rect.height);
    const zoomFactor = Math.exp(deltaY * 0.0015);

    this.camera.zoomAt(viewportX, viewportY, zoomFactor, rect.width, rect.height);
    this.render();
  };

  private handleResize(): void {
    this.renderer.resize();
    this.render();
  }

  private render(): void {
    const camera = this.camera.snapshot();
    const diagnostics = this.renderer.render(
      this.fractalId,
      camera,
      this.iterationCount,
      this.paletteId,
    );
    this.overlay.setDebugEntries(this.formatDiagnostics(diagnostics, camera));
  }

  private formatDiagnostics(
    diagnostics: RenderDiagnostics,
    camera: ReturnType<FractalCamera['snapshot']>,
  ): DebugEntry[] {
    const fractal = getFractalDefinition(diagnostics.fractalId);

    return [
      { label: 'fractal', value: fractal.label },
      { label: 'palette', value: this.paletteId },
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
        value: `(${camera.center[0].toFixed(6)}, ${camera.center[1].toFixed(6)})`,
      },
      { label: 'scale', value: camera.scale.toExponential(6) },
      { label: 'iterations', value: String(this.iterationCount) },
      { label: 'format', value: diagnostics.presentationFormat },
      { label: 'adapter', value: diagnostics.adapterSummary },
      {
        label: 'submit',
        value: `${diagnostics.lastSubmitDurationMs.toFixed(2)} ms`,
      },
      { label: 'renders', value: String(diagnostics.renderCount) },
    ];
  }

  private clearPointerState(): void {
    this.activePointerId = null;
    this.lastPointerPosition = null;
  }

  private resetIterations(): void {
    this.iterationCount = getFractalDefinition(this.fractalId).defaultIterations;
    this.overlay.setIterationCount(this.iterationCount);
    this.render();
  }

  private resetView(): void {
    this.camera.reset(getFractalDefinition(this.fractalId));
    this.render();
  }
}

function normalizeWheelDelta(event: WheelEvent, viewportHeight: number): number {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return event.deltaY * 16;
    case WheelEvent.DOM_DELTA_PAGE:
      return event.deltaY * viewportHeight;
    default:
      return event.deltaY;
  }
}

function clampIterationCount(iterationCount: number): number {
  return Math.min(
    iterationRange.max,
    Math.max(iterationRange.min, Math.round(iterationCount)),
  );
}

function isEditingControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}
