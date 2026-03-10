- It is 2026. Use the latest stable syntax, APIs, and best practices. No fallbacks, polyfills, or legacy compatibility unless explicitly requested.
- To import a `.wgsl` file as a text file, use an import assertion with `type: 'text'`. Bun’s bundler can handle this correctly.
- Do not import CSS files from JS/TS.

The flipping problem was solved by separating the **screen coordinates** from the **mathematical coordinates** inside the WebGPU shader. It happens in two distinct steps:

1. **Standardizing the Screen (The WebGPU Fix):** WebGPU naturally measures the screen with the origin `(0,0)` at the top-left (Y goes *down*). To make this match standard math and our JavaScript mouse dragging (where dragging up should move the camera up), the shader first flips the normalized screen coordinate:
`uv.y = -uv.y;`
2. **The Burning Ship Aesthetic (The Fractal Fix):**
After applying your camera's zoom and offset to figure out exactly what point `c` we are looking at on the grid, the shader applies a conditional flip:
`if (uniforms.fractalType == 0u) { c.y = -c.y; }`
This flips the math *only* for the Burning Ship so it renders in its traditional "upside-down ship" orientation, without messing up the underlying camera logic or the Mandelbrot set.

## References

Don't import code directly from the references directory.

- references/webgpu-samples: The WebGPU Samples are a set of samples and demos

`@std/webgpu` might be helpful for creating custom palettes or exporting images. I'm not sure if you'll use it immediately, but I'm putting it here for your reference.

````
Defined in references/std/webgpu/mod.ts:3:1

  Utilities for interacting with the
  {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API | WebGPU API}.

  ```ts ignore
  import { createTextureWithData } from "@std/webgpu";

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice()!;

  createTextureWithData(device, {
    format: "bgra8unorm-srgb",
    size: {
      width: 3,
      height: 2,
    },
    usage: GPUTextureUsage.COPY_SRC,
  }, new Uint8Array([1, 1, 1, 1, 1, 1, 1]));
  ```

  @module

Defined in references/std/webgpu/create_capture.ts:74:1

function createCapture(device: GPUDevice, width: number, height: number): CreateCapture
  Creates a texture and buffer to use as a capture.

  @example
      Usage

      ```ts ignore
      import { createCapture } from "@std/webgpu/create-capture";
      import { getRowPadding } from "@std/webgpu/row-padding";

      const adapter = await navigator.gpu.requestAdapter();
      const device = await adapter?.requestDevice()!;

      const dimensions = {
        width: 200,
        height: 200,
      };

      const { texture, outputBuffer } = createCapture(device, dimensions.width, dimensions.height);

      const encoder = device.createCommandEncoder();
      encoder.beginRenderPass({
        colorAttachments: [
          {
            view: texture.createView(),
            storeOp: "store",
            loadOp: "clear",
            clearValue: [1, 0, 0, 1],
          },
        ],
      }).end();

      const { padded } = getRowPadding(dimensions.width);

      encoder.copyTextureToBuffer(
        {
          texture,
        },
        {
          buffer: outputBuffer,
          bytesPerRow: padded,
        },
        dimensions,
      );

      device.queue.submit([encoder.finish()]);

      // outputBuffer contains the raw image data, can then be used
      // to save as png or other formats.
      ```

  @param device
      The device to use for creating the capture.

  @param width
      The width of the capture texture.

  @param height
      The height of the capture texture.

  @return
      The texture to render to and buffer to read from.


Defined in references/std/webgpu/texture_with_data.ts:125:1

function createTextureWithData(device: GPUDevice, descriptor: GPUTextureDescriptor, data: Uint8Array_): GPUTexture
  Create a {@linkcode GPUTexture} with data.

  @example
      Usage

      ```ts ignore
      import { createTextureWithData } from "@std/webgpu/texture-with-data";

      const adapter = await navigator.gpu.requestAdapter();
      const device = await adapter?.requestDevice()!;

      createTextureWithData(device, {
        format: "bgra8unorm-srgb",
        size: {
          width: 3,
          height: 2,
        },
        usage: GPUTextureUsage.COPY_SRC,
      }, new Uint8Array([1, 1, 1, 1, 1, 1, 1]));
      ```

  @param device
      The device to create the texture with.

  @param descriptor
      The texture descriptor to create the texture with.

  @param data
      The data to write to the texture.

  @return
      The newly created texture.


Defined in references/std/webgpu/describe_texture_format.ts:50:1

function describeTextureFormat(format: GPUTextureFormat): TextureFormatInfo
  Get various information about a specific {@linkcode GPUTextureFormat}.

  @example
      Basic usage

      ```ts
      import { describeTextureFormat } from "@std/webgpu/describe-texture-format";
      import { assertEquals } from "@std/assert";

      assertEquals(describeTextureFormat("rgba8unorm"), {
        sampleType: "float",
        allowedUsages: 31,
        blockDimensions: [1, 1],
        blockSize: 4,
        components: 4,
      });
      ```

  @param format
      The format to get the information about.

  @return
      An object describing various properties for the provided format.


Defined in references/std/webgpu/row_padding.ts:35:1

function getRowPadding(width: number): Padding
  Calculates the number of bytes including necessary padding when passing a
  {@linkcode GPUImageCopyBuffer}.

  Ref: https://en.wikipedia.org/wiki/Data_structure_alignment#Computing_padding

  @example
      Usage

      ```ts
      import { getRowPadding } from "@std/webgpu/row-padding";
      import { assertEquals } from "@std/assert";

      assertEquals(getRowPadding(1), { unpadded: 4, padded: 256 });
      ```

  @param width
      The width to get the padding for

  @return
      The padded and unpadded values


Defined in references/std/webgpu/row_padding.ts:74:1

function resliceBufferWithPadding(buffer: Uint8Array, width: number, height: number): Uint8Array
  Creates a new buffer while removing any unnecessary empty bytes.
  Useful for when wanting to save an image as a specific format.

  @example
      Usage

      ```ts
      import { resliceBufferWithPadding } from "@std/webgpu/row-padding";
      import { assertEquals } from "@std/assert";

      const input = new Uint8Array([0, 255, 0, 255, 120, 120, 120]);
      const result = resliceBufferWithPadding(input, 1, 1);

      assertEquals(result, new Uint8Array([0, 255, 0, 255]));
      ```

  @param buffer
      The buffer to reslice.

  @param width
      The width of the output buffer.

  @param height
      The height of the output buffer.

  @return
      The resliced buffer.


Defined in references/std/webgpu/row_padding.ts:16:14

const BYTES_PER_PIXEL: 4
  Number of bytes per pixel.

Defined in references/std/webgpu/row_padding.ts:13:14

const COPY_BYTES_PER_ROW_ALIGNMENT: 256
  Buffer-Texture copies must have [`bytes_per_row`] aligned to this number.

Defined in references/std/webgpu/create_capture.ts:6:1

interface CreateCapture
  Return value for {@linkcode createCapture}.

  texture: GPUTexture
    Texture to be used as view to render to.
  outputBuffer: GPUBuffer
    Represents the output buffer of the rendered texture.
    Can then be used to access and retrieve raw image data.

Defined in references/std/webgpu/row_padding.ts:5:1

interface Padding
  Return value for {@linkcode getRowPadding}.

  unpadded: number
    The number of bytes per row without padding calculated.
  padded: number
    The number of bytes per row with padding calculated.

Defined in references/std/webgpu/describe_texture_format.ts:4:1

interface TextureFormatInfo
  Return type for {@linkcode describeTextureFormat}.

  requiredFeature?: GPUFeatureName
    The specific feature needed to use the format, if any.
  sampleType: GPUTextureSampleType
    Type of sampling that is valid for the texture.
  allowedUsages: number
    Valid bits of {@linkcode GPUTextureUsage}.
  blockDimensions: [number, number]
    Dimension of a "block" of texels. This is always `[1, 1]` on
    uncompressed textures.
  blockSize: number
    Size in bytes of a "block" of texels. This is the size per pixel on
    uncompressed textures.
  components: number
    Count of components in the texture. This determines which components
    there will be actual data in the shader for.
````
