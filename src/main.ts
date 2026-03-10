import { FractalCamera } from './fractal/camera';
import { attachCameraControls } from './fractal/controls';
import { buildFractalRenderState, clampIterations, getDefaultFractalSettings, getFractalPreset, type FractalKind } from './fractal/state';
import { downloadCanvasImage, getSupportedCanvasExportTypes } from './export/canvas-export';
import { OverlayPanel } from './overlay/panel';
import { configureCanvasSize } from './webgpu/canvas';
import { FractalRenderer } from './webgpu/fractal-renderer';

async function main(): Promise<void> {
  const canvas = document.querySelector('canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Expected a canvas element in the document.');
  }

  const renderer = await FractalRenderer.create({ canvas });
  const settings = getDefaultFractalSettings();
  const camera = new FractalCamera(getFractalPreset(settings.fractalKind));
  const overlay = new OverlayPanel({
    settings,
    exportTypes: getSupportedCanvasExportTypes(),
    onFractalKindChange: (fractalKind) => {
      settings.fractalKind = fractalKind;
      camera.setView(getFractalPreset(fractalKind));
      requestRender();
    },
    onIterationModeChange: (iterationMode) => {
      settings.iterationMode = iterationMode;
      requestRender();
    },
    onFixedIterationsChange: (iterations) => {
      settings.fixedIterations = clampIterations(iterations);
      requestRender();
    },
    onDownload: async (type) => {
      ensureRendered();
      const renderState = buildFractalRenderState(camera.view, settings);
      await downloadCanvasImage(canvas, type, buildExportFileStem(renderState, settings.iterationMode));
    },
  });
  let frameHandle = 0;

  const renderFrame = (): void => {
    frameHandle = 0;
    const resized = configureCanvasSize(canvas);
    if (resized) {
      renderer.resize();
    }

    const renderState = buildFractalRenderState(camera.view, settings);
    renderer.render(renderState);
    overlay.update({
      renderState,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    });
  };

  const ensureRendered = (): void => {
    if (frameHandle === 0) {
      return;
    }

    window.cancelAnimationFrame(frameHandle);
    renderFrame();
  };

  const requestRender = (): void => {
    if (frameHandle !== 0) {
      return;
    }

    frameHandle = window.requestAnimationFrame(renderFrame);
  };

  attachCameraControls({ canvas, camera, onChange: requestRender });

  window.addEventListener('keydown', (event) => {
    if (event.key !== '.') {
      return;
    }

    overlay.toggle();
    requestRender();
  });

  requestRender();
  window.addEventListener('resize', requestRender);
}

void main().catch((error: unknown) => {
  console.error(error);
});

function buildExportFileStem(
  renderState: {
    fractalKind: FractalKind;
    centerX: number;
    centerY: number;
    scale: number;
    maxIterations: number;
  },
  iterationMode: 'dynamic' | 'fixed',
): string {
  return [
    renderState.fractalKind,
    `cx_${formatFilenameNumber(renderState.centerX)}`,
    `cy_${formatFilenameNumber(renderState.centerY)}`,
    `scale_${formatFilenameNumber(renderState.scale)}`,
    `iters_${renderState.maxIterations}`,
    `mode_${iterationMode}`,
  ].join('-');
}

function formatFilenameNumber(value: number): string {
  const formatted = Number(value.toPrecision(8)).toString();
  return formatted.replaceAll('+', '');
}
