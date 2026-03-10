const DEFAULT_EXPORT_TYPES = ['image/avif', 'image/webp', 'image/png', 'image/jpeg'];

export function getSupportedCanvasExportTypes(): string[] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return DEFAULT_EXPORT_TYPES.filter((type) => canvas.toDataURL(type).startsWith(`data:${type}`));
}

export async function downloadCanvasImage(canvas: HTMLCanvasElement, type: string, fileStem: string): Promise<void> {
  const blob = await canvasToBlob(canvas, type);
  const extension = type.split('/')[1] ?? 'img';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileStem}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to export canvas as ${type}.`));
          return;
        }

        resolve(blob);
      },
      type,
      1,
    );
  });
}
