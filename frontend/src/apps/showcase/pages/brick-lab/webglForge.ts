/**
 * The Forge — raw WebGL raymarcher for the Brick Lab.
 *
 * A full-screen quad and a single fragment shader sculpt a 2x4 brick from
 * signed distance fields: rounded-box body, hollow underside with internal
 * tubes, and a grid of studs whose rims can be chamfered (the "improved
 * brick" — chamfered rims self-align when stacking). Soft shadows and
 * ambient occlusion are marched per pixel; a cutaway boolean carves the
 * brick open and paints the cross-section in Brick Red.
 */

export interface ForgeState {
    yaw: number;
    pitch: number;
    lightAzimuth: number;
    shadowSoftness: number;
    chamfer: boolean;
    cutaway: boolean;
}

export interface ForgeHandle {
    render: (state: ForgeState) => void;
    dispose: () => void;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uYaw;
uniform float uPitch;
uniform float uLightAzimuth;
uniform float uShadowSoftness;
uniform float uChamfer;
uniform float uCutaway;

const float PITCH = 0.8;     // stud spacing
const float BODY_TOP = 0.96; // brick body height
const float MAX_DIST = 24.0;

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    return sdBox(p, b) - r;
}

// Stud: capped cylinder; rim optionally cut by a 45-degree chamfer plane.
float sdStud(vec3 q) {
    float radial = length(q.xz) - 0.24;
    vec2 d = vec2(radial, abs(q.y - 0.09) - 0.09);
    float cyl = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
    float chamfer = (radial + (q.y - 0.18) + 0.07) * 0.70710678;
    return mix(cyl, max(cyl, chamfer), uChamfer);
}

// Hollow under-tube: a thin-walled cylinder shell.
float sdTube(vec3 q) {
    vec2 d = vec2(abs(length(q.xz) - 0.28) - 0.05, abs(q.y - 0.43) - 0.43);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float cutBox(vec3 p) {
    return sdBox(p - vec3(1.0, 0.62, 0.55), vec3(1.15, 0.85, 0.75));
}

// The brick: shell minus cavity, plus tubes, plus a 4x2 stud grid.
// "cut" enables the cutaway subtraction (pass 0.0 to probe solid material).
float sdBrick(vec3 p, float cut) {
    float body = sdRoundBox(p - vec3(0.0, 0.48, 0.0), vec3(1.56, 0.44, 0.76), 0.04);
    float cavity = sdBox(p - vec3(0.0, 0.40, 0.0), vec3(1.44, 0.46, 0.64));
    float shell = max(body, -cavity);

    vec3 tq = p;
    tq.x -= clamp(floor(p.x / PITCH + 0.5), -1.0, 1.0) * PITCH;
    shell = min(shell, sdTube(tq));

    vec3 sq = p - vec3(0.0, BODY_TOP, 0.0);
    vec2 cell = clamp(floor(p.xz / PITCH), vec2(-2.0, -1.0), vec2(1.0, 0.0));
    sq.xz -= (cell + 0.5) * PITCH;
    shell = min(shell, sdStud(sq));

    return mix(shell, max(shell, -cutBox(p)), cut);
}

float map(vec3 p) {
    return min(sdBrick(p, uCutaway), p.y);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.0015, -0.0015);
    return normalize(
        e.xyy * map(p + e.xyy) +
        e.yyx * map(p + e.yyx) +
        e.yxy * map(p + e.yxy) +
        e.xxx * map(p + e.xxx)
    );
}

float softShadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.02;
    for (int i = 0; i < 48; i++) {
        float h = map(ro + rd * t);
        res = min(res, uShadowSoftness * h / t);
        t += clamp(h, 0.005, 0.25);
        if (res < 0.002 || t > 9.0) { break; }
    }
    return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.13 * float(i);
        occ += (h - map(p + n * h)) * sca;
        sca *= 0.7;
    }
    return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}

float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 96; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001 || t > MAX_DIST) { break; }
        t += h;
    }
    return t;
}

vec3 background(vec2 uv) {
    return mix(vec3(1.0), vec3(0.90, 0.93, 0.97), clamp(uv.y * 0.6 + 0.5, 0.0, 1.0));
}

vec3 shade(vec3 p, vec3 rd) {
    vec3 n = calcNormal(p);
    vec3 lig = normalize(vec3(sin(uLightAzimuth), 1.1, cos(uLightAzimuth)));
    float sha = softShadow(p + n * 0.012, lig);
    float ao = calcAO(p, n);

    // Brick Yellow plastic in linear space; ground plane; section cut in Brick Red.
    vec3 albedo = vec3(0.92, 0.56, 0.012);
    float specStrength = 0.55;
    if (p.y < 0.0035) {
        albedo = vec3(0.62);
        specStrength = 0.06;
    } else if (uCutaway > 0.5 && sdBrick(p, 0.0) < -0.004) {
        albedo = vec3(0.55, 0.012, 0.008);
        specStrength = 0.12;
    }

    float dif = clamp(dot(n, lig), 0.0, 1.0) * sha;
    float sky = 0.55 + 0.45 * n.y;
    vec3 hal = normalize(lig - rd);
    float spe = pow(clamp(dot(n, hal), 0.0, 1.0), 48.0) * sha * specStrength;
    float bounce = clamp(-n.y, 0.0, 1.0) * 0.12;

    vec3 col = albedo * (0.30 * sky * ao + bounce * ao + 1.15 * dif * vec3(1.0, 0.97, 0.92));
    col += spe * vec3(1.0, 0.98, 0.94);
    return col;
}

void main() {
    vec2 uv = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 target = vec3(0.0, 0.5, 0.0);
    vec3 ro = target + 5.4 * vec3(cos(uPitch) * sin(uYaw), sin(uPitch), cos(uPitch) * cos(uYaw));
    vec3 fw = normalize(target - ro);
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fw);
    vec3 rd = normalize(uv.x * rt + uv.y * up + 1.9 * fw);

    vec3 bg = background(uv);
    vec3 col = bg;
    float t = raymarch(ro, rd);
    if (t < MAX_DIST) {
        col = shade(ro + rd * t, rd);
        col = mix(col, bg, 1.0 - exp(-0.00045 * t * t * t));
    }
    col = pow(clamp(col, 0.0, 1.0), vec3(0.4545));
    gl_FragColor = vec4(col, 1.0);
}
`;

interface ForgeUniforms {
    resolution: WebGLUniformLocation | null;
    yaw: WebGLUniformLocation | null;
    pitch: WebGLUniformLocation | null;
    lightAzimuth: WebGLUniformLocation | null;
    shadowSoftness: WebGLUniformLocation | null;
    chamfer: WebGLUniformLocation | null;
    cutaway: WebGLUniformLocation | null;
}

const compileShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

const linkProgram = (gl: WebGLRenderingContext): WebGLProgram | null => {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) {
        return null;
    }
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        return null;
    }
    return program;
};

const lookupUniforms = (gl: WebGLRenderingContext, program: WebGLProgram): ForgeUniforms => ({
    resolution: gl.getUniformLocation(program, 'uResolution'),
    yaw: gl.getUniformLocation(program, 'uYaw'),
    pitch: gl.getUniformLocation(program, 'uPitch'),
    lightAzimuth: gl.getUniformLocation(program, 'uLightAzimuth'),
    shadowSoftness: gl.getUniformLocation(program, 'uShadowSoftness'),
    chamfer: gl.getUniformLocation(program, 'uChamfer'),
    cutaway: gl.getUniformLocation(program, 'uCutaway'),
});

export const createForge = (canvas: HTMLCanvasElement): ForgeHandle | null => {
    const gl = canvas.getContext('webgl', {antialias: false, depth: false, stencil: false});
    if (!gl) {
        return null;
    }
    const program = linkProgram(gl);
    if (!program) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return null;
    }
    const uniforms = lookupUniforms(gl, program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const render = (state: ForgeState): void => {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform2f(uniforms.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(uniforms.yaw, state.yaw);
        gl.uniform1f(uniforms.pitch, state.pitch);
        gl.uniform1f(uniforms.lightAzimuth, state.lightAzimuth);
        gl.uniform1f(uniforms.shadowSoftness, state.shadowSoftness);
        gl.uniform1f(uniforms.chamfer, state.chamfer ? 1 : 0);
        gl.uniform1f(uniforms.cutaway, state.cutaway ? 1 : 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const dispose = (): void => {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    };

    return {render, dispose};
};
