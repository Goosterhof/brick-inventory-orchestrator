/**
 * The Forge — raw WebGL raymarcher for the Brick Lab.
 *
 * A full-screen quad and a single fragment shader sculpt the whole scene from
 * signed distance fields: a 2x4 brick (rounded-box body, hollow underside,
 * internal tubes, chamfer-rimmed studs), a second brick that descends and
 * seats onto the first, and an infinite baseplate stud-grid floor via domain
 * repetition. Soft shadows and ambient occlusion are marched per pixel; a
 * cutaway boolean carves brick 1 open and inks the cross-section Brick Red.
 *
 * The stack animation is the product story of the BW-3001X improved brick:
 * brick 2 spawns deliberately misaligned, and the 45-degree stud-rim chamfers
 * visibly guide it into registration as it engages. With the chamfer toggled
 * off, the same drop jams on the stud tops and rests crooked. The pose is a
 * pure function of the animation clock (`computeStackPose`), so reduced-motion
 * users get the terminal pose in a single frame.
 */

export interface ForgeBrick2 {
    active: boolean;
    x: number;
    y: number;
    z: number;
    tilt: number;
}

export interface ForgeState {
    yaw: number;
    pitch: number;
    lightAzimuth: number;
    shadowSoftness: number;
    chamfer: boolean;
    cutaway: boolean;
    material: number; // 0 = ABS opaque, 1 = trans-yellow polycarbonate, 2 = two-tone moulded
    brick2: ForgeBrick2;
}

export interface ForgeHandle {
    render: (state: ForgeState) => void;
    dispose: () => void;
}

export type StackStatus = 'falling' | 'seating' | 'settling' | 'seated' | 'jammed';

export interface StackPose {
    x: number;
    y: number;
    z: number;
    tilt: number;
    status: StackStatus;
}

export const STACK_DROP_OFFSET = {x: 0.16, z: 0.1} as const;

const DROP_START_Y = 2.4;
const ENGAGE_Y = 1.14; // bottom face meets the stud tops here
const SEAT_Y = 0.96; // fully clutched: bottom face on the body top
const MAX_TILT_RAD = 0.06;
const DESCENT_SECONDS = 0.85;
const ENGAGE_SECONDS = 0.5;
const SETTLE_SECONDS = 0.45;

const bounce = (seconds: number, amplitude: number, frequency: number): number =>
    amplitude * Math.exp(-7 * seconds) * Math.abs(Math.sin(seconds * frequency));

/**
 * Brick-2 pose as a pure function of the stack clock. Three acts:
 * descent (gravity ease-in), engagement (the chamfer pulls the lateral
 * offset to zero across the 0.18 rim travel, with a small corrective tilt),
 * settle (decaying rebound at the moment of clutch). Without the chamfer the
 * descent ends in a clunk at ENGAGE_Y and the brick rests jammed, offset and
 * all — that contrast is the entire sales pitch.
 */
export const computeStackPose = (clock: number, chamfer: boolean): StackPose => {
    if (clock < DESCENT_SECONDS) {
        const u = clock / DESCENT_SECONDS;
        return {
            x: STACK_DROP_OFFSET.x,
            z: STACK_DROP_OFFSET.z,
            y: DROP_START_Y + (ENGAGE_Y - DROP_START_Y) * u * u,
            tilt: 0,
            status: 'falling',
        };
    }
    if (!chamfer) {
        const s = clock - DESCENT_SECONDS;
        return {
            x: STACK_DROP_OFFSET.x,
            z: STACK_DROP_OFFSET.z,
            y: ENGAGE_Y + bounce(s, 0.05, 24),
            tilt: 0,
            status: 'jammed',
        };
    }
    const engaged = clock - DESCENT_SECONDS;
    if (engaged < ENGAGE_SECONDS) {
        const u = engaged / ENGAGE_SECONDS;
        return {
            x: STACK_DROP_OFFSET.x * (1 - u),
            z: STACK_DROP_OFFSET.z * (1 - u),
            y: ENGAGE_Y + (SEAT_Y - ENGAGE_Y) * u,
            tilt: Math.sin(u * Math.PI) * MAX_TILT_RAD,
            status: 'seating',
        };
    }
    const settle = engaged - ENGAGE_SECONDS;
    return {
        x: 0,
        z: 0,
        y: SEAT_Y + bounce(settle, 0.05, 22),
        tilt: 0,
        status: settle < SETTLE_SECONDS ? 'settling' : 'seated',
    };
};

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
uniform float uMaterial;     // 0 ABS, 1 trans-yellow PC, 2 two-tone
uniform float uBrick2Active;
uniform vec3 uBrick2;        // world offset of brick 2 origin
uniform float uBrick2Tilt;   // radians about z, pivot at brick centre

const float PITCH = 0.8;     // stud spacing
const float BODY_TOP = 0.96; // brick body height
const float MAX_DIST = 24.0;
const float FAR = 100.0;

const vec3 YELLOW = vec3(0.92, 0.56, 0.012);
const vec3 RED = vec3(0.58, 0.022, 0.012);
const vec3 INK_RED = vec3(0.42, 0.008, 0.006);
const vec3 FLOOR_GREEN = vec3(0.20, 0.33, 0.22); // baseplate green, linear

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

// Body shell minus cavity, plus the three internal tubes.
float sdBrickShell(vec3 p) {
    float body = sdRoundBox(p - vec3(0.0, 0.48, 0.0), vec3(1.56, 0.44, 0.76), 0.04);
    float cavity = sdBox(p - vec3(0.0, 0.40, 0.0), vec3(1.44, 0.46, 0.64));
    float shell = max(body, -cavity);
    vec3 tq = p;
    tq.x -= clamp(floor(p.x / PITCH + 0.5), -1.0, 1.0) * PITCH;
    return min(shell, sdTube(tq));
}

// The 4x2 stud grid via clamped domain repetition.
float sdBrickStuds(vec3 p) {
    vec3 sq = p - vec3(0.0, BODY_TOP, 0.0);
    vec2 cell = clamp(floor(p.xz / PITCH), vec2(-2.0, -1.0), vec2(1.0, 0.0));
    sq.xz -= (cell + 0.5) * PITCH;
    return sdStud(sq);
}

// "cut" enables the cutaway subtraction (pass 0.0 to probe solid material).
float sdBrickSolid(vec3 p, float cut) {
    float d = min(sdBrickShell(p), sdBrickStuds(p));
    return mix(d, max(d, -cutBox(p)), cut);
}

// World -> brick-2 local space: untranslate, then untilt about the centre.
vec3 brick2Local(vec3 p) {
    vec3 q = p - uBrick2 - vec3(0.0, 0.5, 0.0);
    float c = cos(uBrick2Tilt);
    float s = sin(uBrick2Tilt);
    q.xy = vec2(c * q.x + s * q.y, c * q.y - s * q.x);
    q.y += 0.5;
    return q;
}

float sdBrick2(vec3 p) {
    return uBrick2Active > 0.5 ? sdBrickSolid(brick2Local(p), 0.0) : FAR;
}

// The Brickworks floor: an infinite baseplate stud grid (unclamped domain
// repetition), sharing the brick studs' profile so the chamfer toggle
// applies to the whole world. Slab early-out: studs live below y 0.18, so
// any sample above the slab can return the (safe lower-bound) distance to
// the stud-top plane without evaluating the repetition at all.
float sdFloor(vec3 p) {
    if (p.y > 0.22) { return p.y - 0.18; }
    vec3 q = vec3(mod(p.x, PITCH) - 0.4, p.y, mod(p.z, PITCH) - 0.4);
    return min(p.y, sdStud(q));
}

// Bounding-box early-out: both bricks (including the full drop arc) live in
// one box; samples outside it return the box distance — a safe lower bound —
// and skip the expensive shell/stud/tube evaluation entirely.
float mapBricks(vec3 p) {
    float bound = sdBox(p - vec3(0.08, 1.78, 0.05), vec3(1.85, 1.85, 1.05));
    if (bound > 0.25) { return bound; }
    return min(sdBrickSolid(p, uCutaway), sdBrick2(p));
}

float map(vec3 p) {
    return min(mapBricks(p), sdFloor(p));
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

// Penumbra shadow march. "cap" trades quality for cost: bricks get the full
// 48 iterations, the (much larger) floor gets 24.
float softShadow(vec3 ro, vec3 rd, float cap) {
    float res = 1.0;
    float t = 0.02;
    for (int i = 0; i < 48; i++) {
        if (float(i) >= cap) { break; }
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

// 0.9 step scale: the floor's mod-repetition is discontinuous at cell
// borders, so pure sphere tracing can overstep grazing rays near the
// horizon; the safety factor buys correctness for ~10% extra cost.
float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 96; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001 || t > MAX_DIST) { break; }
        t += h * 0.9;
    }
    return t;
}

// Beer-Lambert-ish: fixed-step march through the brick interior to estimate
// the absorbing thickness along the view ray. Only paid on trans pixels.
float interiorThickness(vec3 ro, vec3 rd) {
    float thick = 0.0;
    for (int i = 1; i <= 18; i++) {
        if (mapBricks(ro + rd * (0.05 * float(i))) < 0.0) { thick += 0.05; }
    }
    return thick;
}

vec3 sky(vec3 rd, vec3 lig) {
    vec3 col = mix(vec3(1.0), vec3(0.78, 0.86, 0.97), clamp(rd.y * 1.6 + 0.35, 0.0, 1.0));
    float sun = pow(clamp(dot(rd, lig), 0.0, 1.0), 10.0);
    return col + sun * vec3(0.30, 0.22, 0.08);
}

vec3 surfaceAlbedo(vec3 p, bool isFloor, bool isBrick2) {
    if (isFloor) { return FLOOR_GREEN; }
    if (!isBrick2 && uCutaway > 0.5 && sdBrickSolid(p, 0.0) < -0.004) { return INK_RED; }
    vec3 lp = isBrick2 ? brick2Local(p) : p;
    if (uMaterial > 1.5) { return sdBrickStuds(lp) < sdBrickShell(lp) ? RED : YELLOW; }
    return isBrick2 ? RED : YELLOW;
}

vec3 shadeTrans(vec3 p, vec3 rd, vec3 bg) {
    vec3 n = calcNormal(p);
    vec3 lig = normalize(vec3(sin(uLightAzimuth), 1.1, cos(uLightAzimuth)));
    float sha = softShadow(p + n * 0.012, lig, 48.0);
    vec3 hal = normalize(lig - rd);
    float fre = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 5.0);

    float thick = interiorThickness(p, rd);
    vec3 transmit = exp(-vec3(0.7, 1.6, 7.0) * thick);
    vec3 behind = mix(bg, FLOOR_GREEN * 1.8, clamp(-rd.y * 2.0, 0.0, 1.0));
    vec3 col = transmit * behind * (0.55 + 0.45 * sha);
    col += YELLOW * clamp(dot(n, lig), 0.0, 1.0) * sha * 0.18;
    col += pow(clamp(dot(n, hal), 0.0, 1.0), 90.0) * sha * 1.1;
    col += fre * vec3(0.9, 0.95, 1.0) * 0.45;
    return col;
}

vec3 shadeOpaque(vec3 p, vec3 rd, bool isFloor, bool isBrick2) {
    vec3 n = calcNormal(p);
    vec3 lig = normalize(vec3(sin(uLightAzimuth), 1.1, cos(uLightAzimuth)));
    float sha = softShadow(p + n * 0.012, lig, isFloor ? 24.0 : 48.0);
    bool transWorld = uMaterial > 0.5 && uMaterial < 1.5;
    if (isFloor && transWorld) { sha = mix(sha, 1.0, 0.5); } // trans bricks pass light
    float ao = calcAO(p, n);

    float dif = clamp(dot(n, lig), 0.0, 1.0) * sha;
    float skyAmb = 0.55 + 0.45 * n.y;
    vec3 hal = normalize(lig - rd);
    float fre = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 5.0);
    float spe = pow(clamp(dot(n, hal), 0.0, 1.0), 48.0) * sha * (isFloor ? 0.10 : 0.55);
    float bounce = clamp(-n.y, 0.0, 1.0) * 0.12;

    vec3 albedo = surfaceAlbedo(p, isFloor, isBrick2);
    vec3 col = albedo * (0.30 * skyAmb * ao + bounce * ao + 1.15 * dif * vec3(1.0, 0.97, 0.92));
    col += spe * vec3(1.0, 0.98, 0.94);
    col += fre * vec3(0.85, 0.90, 1.0) * (isFloor ? 0.04 : 0.20) * ao;
    return col;
}

vec3 shade(vec3 p, vec3 rd, vec3 bg) {
    float d1 = sdBrickSolid(p, uCutaway);
    float d2 = sdBrick2(p);
    float dF = sdFloor(p);
    bool isFloor = dF < min(d1, d2);
    bool isBrick2 = !isFloor && d2 < d1;
    bool trans = !isFloor && uMaterial > 0.5 && uMaterial < 1.5;
    return trans ? shadeTrans(p, rd, bg) : shadeOpaque(p, rd, isFloor, isBrick2);
}

void main() {
    vec2 uv = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 target = vec3(0.0, 0.7, 0.0);
    vec3 ro = target + 6.0 * vec3(cos(uPitch) * sin(uYaw), sin(uPitch), cos(uPitch) * cos(uYaw));
    vec3 fw = normalize(target - ro);
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fw);
    vec3 rd = normalize(uv.x * rt + uv.y * up + 1.9 * fw);

    vec3 lig = normalize(vec3(sin(uLightAzimuth), 1.1, cos(uLightAzimuth)));
    vec3 bg = sky(rd, lig);
    vec3 col = bg;
    float t = raymarch(ro, rd);
    if (t < MAX_DIST) {
        col = shade(ro + rd * t, rd, bg);
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
    material: WebGLUniformLocation | null;
    brick2Active: WebGLUniformLocation | null;
    brick2: WebGLUniformLocation | null;
    brick2Tilt: WebGLUniformLocation | null;
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
    material: gl.getUniformLocation(program, 'uMaterial'),
    brick2Active: gl.getUniformLocation(program, 'uBrick2Active'),
    brick2: gl.getUniformLocation(program, 'uBrick2'),
    brick2Tilt: gl.getUniformLocation(program, 'uBrick2Tilt'),
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
        gl.uniform1f(uniforms.material, state.material);
        gl.uniform1f(uniforms.brick2Active, state.brick2.active ? 1 : 0);
        gl.uniform3f(uniforms.brick2, state.brick2.x, state.brick2.y, state.brick2.z);
        gl.uniform1f(uniforms.brick2Tilt, state.brick2.tilt);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const dispose = (): void => {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    };

    return {render, dispose};
};
