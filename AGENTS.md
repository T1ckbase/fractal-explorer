- It is 2026. Use the latest stable syntax, APIs, and best practices. No fallbacks, polyfills, or legacy compatibility unless explicitly requested.
- To import a `.wgsl` file as a text file, use an import assertion with `type: 'text'`. Bun’s bundler can handle this correctly.
- Do not import CSS files from JS/TS.
- Refactor if needed; don’t force changes into the existing structure.

The coordinate handling is split cleanly between screen-space normalization and the fractal formula itself:

1. **Standardizing the Screen:** WebGPU naturally measures the screen with the origin `(0,0)` at the top-left (Y goes _down_). To make this match standard math and our JavaScript mouse dragging (where dragging up should move the camera up), the shader flips the normalized screen coordinate:
   `uv.y = -uv.y;`
2. **Burning Ship Reflected:** The fractal formerly called Burning Ship is now treated as `burning-ship-reflected`. Its reflected orientation is encoded directly in the iteration formula, so there should be no extra Burning Ship-specific Y flip elsewhere in the app or shader pipeline.

## References

Don't import code directly from the references directory.

- references/webgpu-samples: The WebGPU Samples are a set of samples and demos
