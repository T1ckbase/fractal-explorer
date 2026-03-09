import { FractalCamera } from './camera';

type ControlsOptions = {
  canvas: HTMLCanvasElement;
  camera: FractalCamera;
  onChange: () => void;
};

export function attachCameraControls({ canvas, camera, onChange }: ControlsOptions): () => void {
  canvas.style.touchAction = 'none';

  let activePointerId: number | null = null;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const releasePointer = (): void => {
    activePointerId = null;
    canvas.style.cursor = 'grab';
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    activePointerId = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    camera.panByPixels(canvas, deltaX, deltaY);
    onChange();
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    releasePointer();
  };

  const handleWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const delta = normalizeWheelDelta(event, canvas);
    const zoomFactor = Math.exp(delta * 0.0015);

    if (camera.zoomAt(canvas, event.clientX, event.clientY, zoomFactor)) {
      onChange();
    }
  };

  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('lostpointercapture', releasePointer);
  canvas.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerUp);
    canvas.removeEventListener('pointercancel', handlePointerUp);
    canvas.removeEventListener('lostpointercapture', releasePointer);
    canvas.removeEventListener('wheel', handleWheel);
  };
}

function normalizeWheelDelta(event: WheelEvent, canvas: HTMLCanvasElement): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * canvas.clientHeight;
  }

  return event.deltaY;
}
