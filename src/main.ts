import { FractalExplorerApp } from './app.ts';

async function main(): Promise<void> {
  const canvas = document.querySelector('canvas');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Expected a <canvas> element in index.html.');
  }

  await FractalExplorerApp.create(canvas);
}

void main().catch((error: unknown) => {
  console.error(error);

  const panel = document.createElement('pre');
  panel.className = 'overlay-panel';

  const message = error instanceof Error ? error.message : 'Unknown startup error.';
  panel.textContent = `startup error\n  ${message}`;

  document.body.replaceChildren(panel);
});
