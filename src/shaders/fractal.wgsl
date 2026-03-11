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

fn iterate_burning_ship_reflected(c: vec2f, max_iterations: u32) -> EscapeResult {
  var z = vec2f(0.0, 0.0);
  var iteration = 0u;
  var magnitude_squared = 0.0;

  loop {
    if (iteration >= max_iterations) {
      break;
    }

    let folded = abs(z);
    let x = folded.x * folded.x - folded.y * folded.y + c.x;
    let y = -2.0 * folded.x * folded.y + c.y;
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
      return iterate_burning_ship_reflected(c, max_iterations);
    }
    default: {
      return iterate_mandelbrot(c, max_iterations);
    }
  }
}

fn cosine_palette(t: f32, a: vec3f, b: vec3f, c: vec3f, d: vec3f) -> vec3f {
  return a + b * cos(6.2831853 * (c * t + d));
}

fn palette_turbo(t: f32) -> vec3f {
  let kRedVec4   = vec4f(0.13572138, 4.61539260, -42.66032258, 132.13108234);
  let kGreenVec4 = vec4f(0.09140261, 2.19418839, 4.84296658, -14.18503333);
  let kBlueVec4  = vec4f(0.10667330, 12.64194608, -60.58204836, 110.36276771);

  let kRedVec2   = vec2f(-152.94239396, 59.28637943);
  let kGreenVec2 = vec2f(4.27729857, 2.82956604);
  let kBlueVec2  = vec2f(-89.90310912, 27.34824973);

  let v4 = vec4f(1.0, t, t * t, t * t * t);
  let v2 = v4.zw * v4.z;

  return vec3f(
    dot(v4, kRedVec4)   + dot(v2, kRedVec2),
    dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
    dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
  );
}

fn palette_grayscale(t: f32) -> vec3f {
  let tone = pow(t, 1); // 0.8
  return vec3f(tone);
}

fn palette_inferno(t: f32) -> vec3f {
  const c0 = vec3f(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
  const c1 = vec3f(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
  const c2 = vec3f(11.60249308247187, -3.972853965665698, -15.9423941062914);
  const c3 = vec3f(-41.70399613139459, 17.43639888205313, 44.35414519872813);
  const c4 = vec3f(77.162935699427, -33.40235894210092, -81.80730925738993);
  const c5 = vec3f(-71.31942824499214, 32.62606426397723, 73.20951985803202);
  const c6 = vec3f(25.13112622477341, -12.24266895238567, -23.07032500287172);

  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn palette_viridis(t: f32) -> vec3f {
  const c0 = vec3f(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
  const c1 = vec3f(0.1050930431085774, 1.404613529898575, 1.384590162594685);
  const c2 = vec3f(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
  const c3 = vec3f(-4.634230498983486, -5.799100973351585, -19.33244095627987);
  const c4 = vec3f(6.228269936347081, 14.17993336680509, 56.69055260068105);
  const c5 = vec3f(4.776384997670288, -13.74514537774601, -65.35303263337234);
  const c6 = vec3f(-5.435455855934631, 4.645852612178535, 26.3124352495832);

  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn palette_magma(t: f32) -> vec3f {
  const c0 = vec3f(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
  const c1 = vec3f(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
  const c2 = vec3f(8.353717279216625, -3.577719514958484, 0.3144679030132573);
  const c3 = vec3f(-27.66873308576866, 14.26473078096533, -13.64921318813922);
  const c4 = vec3f(52.17613981234068, -27.94360607168351, 12.94416944238394);
  const c5 = vec3f(-50.76852536473588, 29.04658282127291, 4.23415299384598);
  const c6 = vec3f(18.65570506591883, -11.48977351997711, -5.601961508734096);

  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn palette_plasma(t: f32) -> vec3f {
  const c0 = vec3f(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
  const c1 = vec3f(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
  const c2 = vec3f(-2.689460476458034, -7.455851135738909, 3.110799939717086);
  const c3 = vec3f(6.130348345893603, 42.3461881477227, -28.51885465332158);
  const c4 = vec3f(-11.10743619062271, -82.66631109428045, 60.13984767418263);
  const c5 = vec3f(10.02306557647065, 71.41361770095349, -54.07218655560067);
  const c6 = vec3f(-3.658713842777788, -22.93153465461149, 18.19190778539828);

  return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
}

fn palette_blue_gold(t: f32) -> vec3f {
    let colors = array<vec3f, 5>(
        vec3f(0.02, 0.02, 0.10), // Deep Blue
        vec3f(0.10, 0.40, 0.80), // Electric Blue
        vec3f(1.00, 1.00, 1.00), // White
        vec3f(1.00, 0.70, 0.00), // Gold
        vec3f(0.10, 0.05, 0.00)  // Dark Coffee
    );

    let m = t * 4.0;
    let i = i32(floor(m));
    let f = fract(m);

    return mix(colors[clamp(i, 0, 4)], colors[clamp(i + 1, 0, 4)], f);
}

fn palette_emerald(t: f32) -> vec3f {
  let colors = array<vec3f, 5>(
    vec3f(0.0, 0.05, 0.05),
    vec3f(0.0, 0.5, 0.4),
    vec3f(0.5, 1.0, 0.8),
    vec3f(1.0, 1.0, 1.0),
    vec3f(0.0, 0.1, 0.2)
  );
  let m = t * 4.0;
  let i = i32(floor(m));
  return mix(colors[clamp(i, 0, 4)], colors[clamp(i + 1, 0, 4)], fract(m));
}

fn palette_fire(t: f32) -> vec3f {
  let colors = array<vec3f, 5>(
    vec3f(0.0, 0.0, 0.0),
    vec3f(0.5, 0.0, 0.0),
    vec3f(1.0, 0.5, 0.0),
    vec3f(1.0, 1.0, 0.5),
    vec3f(1.0, 1.0, 1.0)
  );
  let m = t * 4.0;
  let i = i32(floor(m));
  return mix(colors[clamp(i, 0, 4)], colors[clamp(i + 1, 0, 4)], fract(m));
}

fn palette_cubehelix(t: f32) -> vec3f {
    let start = 0.5;
    let rotations = -1.5;
    let hue = 1.2;
    let gamma = 1.0;

    let angle = 6.2831853 * (start / 3.0 + 1.0 + rotations * t);
    let fract_t = pow(t, gamma);
    let amp = hue * fract_t * (1.0 - fract_t) / 2.0;

    let cos_a = cos(angle);
    let sin_a = sin(angle);

    let r = fract_t + amp * (-0.14861 * cos_a + 1.78277 * sin_a);
    let g = fract_t + amp * (-0.29227 * cos_a - 0.90649 * sin_a);
    let b = fract_t + amp * (1.97294 * cos_a);

    return clamp(vec3f(r, g, b), vec3f(0.0), vec3f(1.0));
}

fn palette_test(t: f32) -> vec3f {
  let tone = pow(t, 0.9);
  return vec3f(tone);
}

fn palette(t: f32, palette_type: u32) -> vec3f {
  switch palette_type {
    case 0u: { return palette_turbo(t); }
    case 1u: { return palette_grayscale(t); }
    case 2u: { return palette_inferno(t); }
    case 3u: { return palette_viridis(t); }
    case 4u: { return palette_magma(t); }
    case 5u: { return palette_plasma(t); }
    case 6u: { return palette_blue_gold(t); }
    case 7u: { return palette_emerald(t); }
    case 8u: { return palette_fire(t); }
    case 9u: { return palette_cubehelix(t); }
    case 10u: { return palette_test(t); }
    default: { return palette_turbo(t); }
  }
}

fn colorize(result: EscapeResult, max_iterations: u32, palette_iterations: u32, palette_type: u32) -> vec4f {
  if (result.iteration >= max_iterations) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }

  let smooth_iteration = f32(result.iteration) + 1.0 - log2(log2(max(result.magnitude_squared, 4.000001)));
  let t = smooth_iteration / f32(max(palette_iterations, 1u));
  let color = palette(clamp(t, 0.0, 1.0), palette_type);

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
  let palette_iterations = u32(uniforms.style_info.y);

  var uv = (position.xy / resolution) * 2.0 - vec2f(1.0, 1.0);
  uv.y = -uv.y;

  var c = center + vec2f(uv.x * aspect * scale, uv.y * scale);

  let result = sample_fractal(c, max_iterations, fractal_type);
  return colorize(result, max_iterations, palette_iterations, palette_type);
}
