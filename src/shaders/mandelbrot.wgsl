struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

struct FractalUniforms {
  resolution : vec2f,
  center : vec2f,
  scale : f32,
  maxIterations : f32,
}

@group(0) @binding(0) var<uniform> uniforms : FractalUniforms;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -3.0),
    vec2f(-1.0, 1.0),
    vec2f(3.0, 1.0),
  );

  let position = positions[vertexIndex];
  var output : VertexOutput;
  output.position = vec4f(position, 0.0, 1.0);
  output.uv = position * 0.5 + vec2f(0.5);
  return output;
}

fn palette(t : f32) -> vec3f {
  let u = clamp(t, 0.0, 1.0);
  let deep = vec3f(0.02, 0.03, 0.08);
  let blue = vec3f(0.12, 0.32, 0.72);
  let cyan = vec3f(0.18, 0.72, 0.88);
  let gold = vec3f(0.95, 0.78, 0.30);
  let warm = vec3f(0.98, 0.46, 0.22);

  let s0 = smoothstep(0.0, 0.22, u);
  let s1 = smoothstep(0.18, 0.5, u);
  let s2 = smoothstep(0.45, 0.78, u);
  let s3 = smoothstep(0.72, 1.0, u);

  let stage0 = mix(deep, blue, s0);
  let stage1 = mix(stage0, cyan, s1);
  let stage2 = mix(stage1, gold, s2);
  return mix(stage2, warm, s3);
}

@fragment
fn fragmentMain(input : VertexOutput) -> @location(0) vec4f {
  let aspect = uniforms.resolution.x / uniforms.resolution.y;
  let view = vec2f((input.uv.x - 0.5) * aspect, input.uv.y - 0.5) * uniforms.scale;
  let c = uniforms.center + view;

  var z = vec2f(0.0, 0.0);
  var iteration = 0.0;

  loop {
    if (iteration >= uniforms.maxIterations || dot(z, z) > 4.0) {
      break;
    }

    let x = z.x * z.x - z.y * z.y + c.x;
    let y = 2.0 * z.x * z.y + c.y;
    z = vec2f(x, y);
    iteration += 1.0;
  }

  if (iteration >= uniforms.maxIterations) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }

  let smoothIteration = iteration + 1.0 - log2(log(length(z)));
  let normalized = clamp(smoothIteration / uniforms.maxIterations, 0.0, 1.0);
  let color = palette(normalized);

  return vec4f(color, 1.0);
}
