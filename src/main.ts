import { DebugOverlay } from './debug/overlay';
import { FractalCamera } from './fractal/camera';
import { attachCameraControls } from './fractal/controls';
import { configureCanvasSize } from './webgpu/canvas';
import { MandelbrotRenderer } from './webgpu/mandelbrot-renderer';

async function main(): Promise<void> {
  const canvas = document.querySelector('canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Expected a canvas element in the document.');
  }

  const renderer = await MandelbrotRenderer.create({ canvas });
  const camera = new FractalCamera();
  const debugOverlay = new DebugOverlay();
  let frameHandle = 0;

  const renderFrame = (): void => {
    frameHandle = 0;
    const resized = configureCanvasSize(canvas);
    if (resized) {
      renderer.resize();
    }

    const view = camera.view;
    renderer.render(view);
    debugOverlay.update({
      view,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    });
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

    debugOverlay.toggle();
    requestRender();
  });

  requestRender();
  window.addEventListener('resize', requestRender);
}

void main().catch((error: unknown) => {
  console.error(error);
});
