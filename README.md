# Fractal Explorer

WebGPU fractal explorer

## Features

- Mandelbrot set
- Burning Ship (reflected)
- The Phallus
- Multiple color palettes (Turbo, Inferno, Viridis, Magma, Plasma, etc.)
- Interactive pan and zoom with mouse/touch

## Fractals

### Mandelbrot

$$z_{n+1} = z_n^2 + c$$

### Burning Ship (reflected)

$$z_{n+1} = (|\Re(z_n)| - i|\Im(z_n)|)^2 + c$$

### The Phallus

$$z_{n+1} = \left( (|\Re(z_n)| + \Im(c)) + i(|\Im(z_n)| - \Re(c)) \right)^2 + c$$

## Requirements

- [Bun](https://bun.com)
- WebGPU-capable browser (Chrome 113+, Edge 113+, Safari & other browsers on iOS 26.0-26.2)

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```
