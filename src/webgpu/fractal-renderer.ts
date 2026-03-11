import type { CameraSnapshot } from '../camera.ts';
import { fractals, type FractalId } from '../fractals.ts';
import { getPaletteIndex, type PaletteId } from '../palettes.ts';
import shaderSource from '../shaders/fractal.wgsl' with { type: 'text' }; // Handled by bun-plugin-text-asset

const uniformFloatCount = 12;

export interface RenderDiagnostics {
  readonly fractalId: FractalId;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly devicePixelRatio: number;
  readonly presentationFormat: GPUTextureFormat;
  readonly adapterSummary: string;
  readonly lastSubmitDurationMs: number;
  readonly renderCount: number;
}

export class FractalRenderer {
  static async create(canvas: HTMLCanvasElement): Promise<FractalRenderer> {
    if (!navigator.gpu) {
      throw new Error('WebGPU is required for this explorer.');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw new Error('Unable to acquire a WebGPU adapter.');
    }

    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');

    if (!context) {
      throw new Error('Unable to create a WebGPU canvas context.');
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    syncCanvasSize(canvas, device.limits.maxTextureDimension2D);
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    const shaderModule = device.createShaderModule({
      label: 'Fractal shader module',
      code: shaderSource,
    });

    const pipeline = device.createRenderPipeline({
      label: 'Fractal render pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: presentationFormat }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    const uniformBuffer = device.createBuffer({
      label: 'Fractal uniform buffer',
      size: uniformFloatCount * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const bindGroup = device.createBindGroup({
      label: 'Fractal bind group',
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
      ],
    });

    const adapterInfo = adapter.info;
    const adapterSummary = [
      adapterInfo.vendor,
      adapterInfo.architecture,
      adapterInfo.description,
    ]
      .filter((part) => part.length > 0)
      .join(' / ');

    return new FractalRenderer(
      canvas,
      context,
      device,
      presentationFormat,
      pipeline,
      uniformBuffer,
      bindGroup,
      adapterSummary || 'adapter details unavailable',
    );
  }

  private readonly uniformData = new Float32Array(uniformFloatCount);
  private lastSubmitDurationMs = 0;
  private renderCount = 0;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: GPUCanvasContext,
    private readonly device: GPUDevice,
    private readonly presentationFormat: GPUTextureFormat,
    private readonly pipeline: GPURenderPipeline,
    private readonly uniformBuffer: GPUBuffer,
    private readonly bindGroup: GPUBindGroup,
    private readonly adapterSummary: string,
  ) {}

  resize(): void {
    syncCanvasSize(this.canvas, this.device.limits.maxTextureDimension2D);
  }

  render(
    fractalId: FractalId,
    camera: CameraSnapshot,
    iterationCount: number,
    paletteIterationCount: number,
    paletteId: PaletteId,
  ): RenderDiagnostics {
    const fractalIndex = fractals.findIndex((fractal) => fractal.id === fractalId);
    const aspect = this.canvas.width / this.canvas.height;

    if (fractalIndex < 0) {
      throw new Error(`Unknown fractal: ${fractalId}`);
    }

    this.uniformData[0] = this.canvas.width;
    this.uniformData[1] = this.canvas.height;
    this.uniformData[2] = camera.scale;
    this.uniformData[3] = aspect;
    this.uniformData[4] = camera.center[0];
    this.uniformData[5] = camera.center[1];
    this.uniformData[6] = fractalIndex;
    this.uniformData[7] = iterationCount;
    this.uniformData[8] = getPaletteIndex(paletteId);
    this.uniformData[9] = paletteIterationCount;
    this.uniformData[10] = 0;
    this.uniformData[11] = 0;

    const startedAt = performance.now();

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const encoder = this.device.createCommandEncoder({
      label: 'Fractal command encoder',
    });

    const renderPass = encoder.beginRenderPass({
      label: 'Fractal render pass',
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.draw(3);
    renderPass.end();

    this.device.queue.submit([encoder.finish()]);

    this.lastSubmitDurationMs = performance.now() - startedAt;
    this.renderCount += 1;

    return {
      fractalId,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      presentationFormat: this.presentationFormat,
      adapterSummary: this.adapterSummary,
      lastSubmitDurationMs: this.lastSubmitDurationMs,
      renderCount: this.renderCount,
    };
  }
}

function syncCanvasSize(
  canvas: HTMLCanvasElement,
  maxTextureDimension2D: number,
): void {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const width = Math.min(
    maxTextureDimension2D,
    Math.max(1, Math.round(canvas.clientWidth * devicePixelRatio)),
  );
  const height = Math.min(
    maxTextureDimension2D,
    Math.max(1, Math.round(canvas.clientHeight * devicePixelRatio)),
  );

  if (canvas.width === width && canvas.height === height) {
    return;
  }

  canvas.width = width;
  canvas.height = height;
}
