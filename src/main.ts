export function getSupportedCanvasExportTypes(): string[] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  const types = ['image/avif', 'image/webp', 'image/png', 'image/jpeg'];
  return types.filter((type) => canvas.toDataURL(type).startsWith(`data:${type}`));
}
