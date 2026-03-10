struct FractalUniforms {
  render_info: vec4f,
  fractal_info: vec4f,
}

struct EscapeResult {
  iteration: u32,
  magnitude_squared: f32,
}

@group(0) @binding(0)
var<uniform> uniforms: FractalUniforms;

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4f {
  let positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );

  return vec4f(positions[vertex_index], 0.0, 1.0);
}

fn iterate_mandelbrot(c: vec2f, max_iterations: u32) -> EscapeResult {
  var z = vec2f(0.0, 0.0);
  var iteration = 0u;
  var magnitude_squared = 0.0;

  loop {
    if (iteration >= max_iterations) {
      break;
    }

    let x = z.x * z.x - z.y * z.y + c.x;
    let y = 2.0 * z.x * z.y + c.y;
    z = vec2f(x, y);
    magnitude_squared = dot(z, z);

    if (magnitude_squared > 4.0) {
      break;
    }

    iteration += 1u;
  }

  return EscapeResult(iteration, magnitude_squared);
}

fn iterate_burning_ship(c: vec2f, max_iterations: u32) -> EscapeResult {
  var z = vec2f(0.0, 0.0);
  var iteration = 0u;
  var magnitude_squared = 0.0;

  loop {
    if (iteration >= max_iterations) {
      break;
    }

    let folded = abs(z);
    let x = folded.x * folded.x - folded.y * folded.y + c.x;
    let y = 2.0 * folded.x * folded.y + c.y;
    z = vec2f(x, y);
    magnitude_squared = dot(z, z);

    if (magnitude_squared > 4.0) {
      break;
    }

    iteration += 1u;
  }

  return EscapeResult(iteration, magnitude_squared);
}

fn sample_fractal(c: vec2f, max_iterations: u32, fractal_type: u32) -> EscapeResult {
  switch fractal_type {
    case 0u: {
      return iterate_burning_ship(c, max_iterations);
    }
    default: {
      return iterate_mandelbrot(c, max_iterations);
    }
  }
}

fn palette(t: f32) -> vec3f {
  let offset = vec3f(0.0, 0.14, 0.32);
  return 0.45 + 0.55 * cos(6.2831853 * (vec3f(t) + offset));
}

fn colorize(result: EscapeResult, max_iterations: u32) -> vec4f {
  if (result.iteration >= max_iterations) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }

  let smooth_iteration = f32(result.iteration) + 1.0 - log2(log2(max(result.magnitude_squared, 4.000001)));
  let t = smooth_iteration / f32(max_iterations);
  let color = palette(t);

  return vec4f(color, 1.0);
}

@fragment
fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let resolution = uniforms.render_info.xy;
  let scale = uniforms.render_info.z;
  let aspect = uniforms.render_info.w;
  let center = uniforms.fractal_info.xy;
  let fractal_type = u32(uniforms.fractal_info.z);
  let max_iterations = u32(uniforms.fractal_info.w);

  var uv = (position.xy / resolution) * 2.0 - vec2f(1.0, 1.0);
  uv.y = -uv.y;

  var c = center + vec2f(uv.x * aspect * scale, uv.y * scale);

  if (fractal_type == 0u) {
    c.y = -c.y;
  }

  let result = sample_fractal(c, max_iterations, fractal_type);
  return colorize(result, max_iterations);
}
