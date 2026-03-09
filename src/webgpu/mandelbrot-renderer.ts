import shaderSource from '../shaders/mandelbrot.wgsl' with { type: 'text' };
import type { FractalView } from '../fractal/camera';

const UNIFORM_BUFFER_SIZE = 24;

type RendererOptions = {
  canvas: HTMLCanvasElement;
};

export class MandelbrotRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;

  private readonly uniformData = new Float32Array(6);
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
      label: 'mandelbrot-shader',
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
      label: 'mandelbrot-pipeline',
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

  static async create(options: RendererOptions): Promise<MandelbrotRenderer> {
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

    return new MandelbrotRenderer(options, device, context);
  }

  resize(): void {
    this.context.configure({
      device: this.device,
      alphaMode: 'opaque',
      format: this.presentationFormat,
    });
  }

  render(view: FractalView): void {
    this.uniformData[0] = this.canvas.width;
    this.uniformData[1] = this.canvas.height;
    this.uniformData[2] = view.centerX;
    this.uniformData[3] = view.centerY;
    this.uniformData[4] = view.scale;
    this.uniformData[5] = view.maxIterations;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'mandelbrot-command-encoder',
    });

    const renderPass = commandEncoder.beginRenderPass({
      label: 'mandelbrot-render-pass',
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
