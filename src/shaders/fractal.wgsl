struct FractalUniforms {
  render_info: vec4f,
  fractal_info: vec4f,
  style_info: vec4f,
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

fn cosine_palette(t: f32, a: vec3f, b: vec3f, c: vec3f, d: vec3f) -> vec3f {
  return a + b * cos(6.2831853 * (c * t + d));
}

fn palette_blue_gold(t: f32) -> vec3f {
  let clamped = clamp(t, 0.0, 1.0);
  let deep = vec3f(0.0, 0.02, 0.08);
  let blue = vec3f(0.0, 0.14, 0.42);
  let azure = vec3f(0.12, 0.52, 0.86);
  let gold = vec3f(0.96, 0.76, 0.20);
  let ivory = vec3f(1.0, 0.97, 0.88);

  if (clamped < 0.2) {
    return mix(deep, blue, smoothstep(0.0, 0.2, clamped));
  }

  if (clamped < 0.5) {
    return mix(blue, azure, smoothstep(0.2, 0.5, clamped));
  }

  if (clamped < 0.8) {
    return mix(azure, gold, smoothstep(0.5, 0.8, clamped));
  }

  return mix(gold, ivory, smoothstep(0.8, 1.0, clamped));
}

fn palette_fire(t: f32) -> vec3f {
  let clamped = clamp(t, 0.0, 1.0);
  let black = vec3f(0.02, 0.0, 0.0);
  let burgundy = vec3f(0.24, 0.01, 0.01);
  let red = vec3f(0.72, 0.08, 0.01);
  let orange = vec3f(0.98, 0.42, 0.04);
  let yellow = vec3f(1.0, 0.90, 0.35);

  if (clamped < 0.18) {
    return mix(black, burgundy, smoothstep(0.0, 0.18, clamped));
  }

  if (clamped < 0.42) {
    return mix(burgundy, red, smoothstep(0.18, 0.42, clamped));
  }

  if (clamped < 0.75) {
    return mix(red, orange, smoothstep(0.42, 0.75, clamped));
  }

  return mix(orange, yellow, smoothstep(0.75, 1.0, clamped));
}

fn palette_grayscale(t: f32) -> vec3f {
  let clamped = clamp(t, 0.0, 1.0);
  let tone = pow(clamped, 1); // 0.8
  return vec3f(tone);
}

fn palette_viridis(t: f32) -> vec3f {
  let t_clamp = clamp(t, 0.0, 1.0);
  let seg = t_clamp * 9.0;
  let i   = i32(floor(seg));
  let f   = seg - f32(i);

  switch (i) {
    case 0: { return mix(vec3f(0.267004, 0.004874, 0.329415), vec3f(0.281412, 0.155834, 0.469201), f); }
    case 1: { return mix(vec3f(0.281412, 0.155834, 0.469201), vec3f(0.244972, 0.287675, 0.537260), f); }
    case 2: { return mix(vec3f(0.244972, 0.287675, 0.537260), vec3f(0.190631, 0.407061, 0.556089), f); }
    case 3: { return mix(vec3f(0.190631, 0.407061, 0.556089), vec3f(0.147607, 0.511733, 0.557049), f); }
    case 4: { return mix(vec3f(0.147607, 0.511733, 0.557049), vec3f(0.119699, 0.618490, 0.536347), f); }
    case 5: { return mix(vec3f(0.119699, 0.618490, 0.536347), vec3f(0.208030, 0.718701, 0.472873), f); }
    case 6: { return mix(vec3f(0.208030, 0.718701, 0.472873), vec3f(0.430983, 0.808473, 0.346476), f); }
    case 7: { return mix(vec3f(0.430983, 0.808473, 0.346476), vec3f(0.709898, 0.868751, 0.169257), f); }
    case 8: { return mix(vec3f(0.709898, 0.868751, 0.169257), vec3f(0.993248, 0.906157, 0.143936), f); }
    default: { return vec3f(0.993248, 0.906157, 0.143936); }
  }
}

fn palette(t: f32, palette_type: u32) -> vec3f {
  switch palette_type {
    case 1u: {
      return palette_fire(t);
    }
    case 2u: {
      return palette_grayscale(t);
    }
    case 3u: {
      return palette_viridis(t);
    }
    default: {
      return palette_blue_gold(t);
    }
  }
}

fn colorize(result: EscapeResult, max_iterations: u32, palette_type: u32) -> vec4f {
  if (result.iteration >= max_iterations) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }

  let smooth_iteration = f32(result.iteration) + 1.0 - log2(log2(max(result.magnitude_squared, 4.000001)));
  let t = smooth_iteration / f32(max_iterations);
  let color = palette(t, palette_type);

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
  let palette_type = u32(uniforms.style_info.x);

  var uv = (position.xy / resolution) * 2.0 - vec2f(1.0, 1.0);
  uv.y = -uv.y;

  var c = center + vec2f(uv.x * aspect * scale, uv.y * scale);

  if (fractal_type == 0u) {
    c.y = -c.y;
  }

  let result = sample_fractal(c, max_iterations, fractal_type);
  return colorize(result, max_iterations, palette_type);
}
