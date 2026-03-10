import shaderSource from '../shaders/fractal.wgsl' with { type: 'text' };
import type { FractalRenderState } from '../fractal/state';

const UNIFORM_BUFFER_SIZE = 32;

type RendererOptions = {
  canvas: HTMLCanvasElement;
};

export class FractalRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;

  private readonly uniformBytes = new ArrayBuffer(32);
  private readonly uniformFloats = new Float32Array(this.uniformBytes);
  private readonly uniformInts = new Uint32Array(this.uniformBytes);
  private readonly uniformBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPURenderPipeline;
  private presentationFormat: GPUTextureFormat;

  private constructor({ canvas }: RendererOptions, device: GPUDevice, context: GPUCanvasContext) {
    this.canvas = canvas;
    this.device = device;
    this.context = context;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      alphaMode: 'opaque',
      format: this.presentationFormat,
    });

    const shaderModule = this.device.createShaderModule({
      code: shaderSource,
      label: 'fractal-shader',
    });

    this.uniformBuffer = this.device.createBuffer({
      label: 'fractal-uniforms',
      size: UNIFORM_BUFFER_SIZE,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      label: 'fractal-bind-group-layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      label: 'fractal-pipeline-layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      label: 'fractal-pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: this.presentationFormat }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    this.bindGroup = this.device.createBindGroup({
      label: 'fractal-bind-group',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
      ],
    });
  }

  static async create(options: RendererOptions): Promise<FractalRenderer> {
    if (!('gpu' in navigator)) {
      throw new Error('WebGPU is not available in this browser.');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Failed to acquire a WebGPU adapter.');
    }

    const device = await adapter.requestDevice();
    const context = options.canvas.getContext('webgpu');

    if (!context) {
      throw new Error('Failed to create a WebGPU canvas context.');
    }

    return new FractalRenderer(options, device, context);
  }

  resize(): void {
    this.context.configure({
      device: this.device,
      alphaMode: 'opaque',
      format: this.presentationFormat,
    });
  }

  render(view: FractalRenderState): void {
    this.uniformFloats[0] = this.canvas.width;
    this.uniformFloats[1] = this.canvas.height;
    this.uniformFloats[2] = view.centerX;
    this.uniformFloats[3] = view.centerY;
    this.uniformFloats[4] = view.scale;
    this.uniformFloats[5] = view.maxIterations;
    this.uniformInts[6] = view.fractalKind === 'burning-ship' ? 0 : 1;
    this.uniformInts[7] = 0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformBytes);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'fractal-command-encoder',
    });

    const renderPass = commandEncoder.beginRenderPass({
      label: 'fractal-render-pass',
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

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
