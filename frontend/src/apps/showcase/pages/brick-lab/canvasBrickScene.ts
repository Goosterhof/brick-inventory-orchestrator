/**
 * Pure geometry and immediate-mode drawing helpers for the Canvas 2D free-build prototype.
 *
 * Everything here is stateless: the component owns the clock, the physics, and the
 * sheet contents — these functions only know how to put BW-3001X "improved bricks"
 * on a drafting table. Model space is millimetres; `IsoView.scale` converts to CSS
 * pixels using a cabinet projection (45° half-depth), which keeps the baseline
 * horizontal so towers can rise anywhere along the sheet.
 */

export interface IsoView {
    /** Screen x of world x = 0 (the sheet centre), in CSS px. */
    cx: number;
    /** Screen y of the baseline — any front-bottom edge at z = 0. */
    baseY: number;
    /** Pixels per millimetre. */
    scale: number;
}

/** Footprint of a brick on the sheet: world x of its left edge, underside height, stud length. */
export interface BrickShape {
    x: number;
    z: number;
    studs: number;
}

export interface BrickPose extends BrickShape {
    color: string;
    squashX: number;
    squashY: number;
    jitterX: number;
    jitterY: number;
}

export interface OutlineStyle {
    stroke: string;
    alpha: number;
    dash: readonly number[];
}

interface Vec2 {
    x: number;
    y: number;
}

interface StudShape {
    center: Vec2;
    rx: number;
    ry: number;
    lift: number;
}

export const UNIT = {pitch: 8, depth: 16, height: 9.6, studRadius: 2.45, studHeight: 1.8} as const;

const DEPTH = 0.3536; // cabinet projection: depth foreshortened to half at 45°
const INK = '#000000';

export const project = (view: IsoView, x: number, y: number, z: number): Vec2 => ({
    x: view.cx + (x + y * DEPTH) * view.scale,
    y: view.baseY - (z + y * DEPTH) * view.scale,
});

/** World x (mm) of a column's left edge, with column 0 at the left of the sheet. */
export const columnToX = (col: number, cols: number): number => (col - cols / 2) * UNIT.pitch;

const shade = (hex: string, factor: number): string => {
    const value = Number.parseInt(hex.slice(1), 16);
    const channel = (offset: number): number => Math.min(255, Math.round(((value >> offset) & 0xff) * factor));
    return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
};

const tracePath = (ctx: CanvasRenderingContext2D, points: readonly Vec2[]): void => {
    ctx.beginPath();
    for (const [index, point] of points.entries()) {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    }
    ctx.closePath();
};

const paintFace = (ctx: CanvasRenderingContext2D, points: readonly Vec2[], fill: string): void => {
    tracePath(ctx, points);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
};

const strokeSegment = (ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2): void => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
};

/** Vertical clutch-power grooves on the visible faces — the headline improvement. */
const drawClutchChannels = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    ctx.strokeStyle = shade(pose.color, 0.48);
    ctx.lineWidth = Math.max(1, view.scale * 0.18);
    const top = pose.z + UNIT.height - 1.1;
    const bottom = pose.z + 1.1;
    for (let step = 1; step < pose.studs; step += 1) {
        const x = pose.x + step * UNIT.pitch;
        strokeSegment(ctx, project(view, x, 0, top), project(view, x, 0, bottom));
    }
    const rightX = pose.x + pose.studs * UNIT.pitch;
    strokeSegment(ctx, project(view, rightX, UNIT.depth / 2, top), project(view, rightX, UNIT.depth / 2, bottom));
};

const drawBody = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    const length = pose.studs * UNIT.pitch;
    const bottom = pose.z;
    const top = pose.z + UNIT.height;
    const at = (dx: number, y: number, z: number): Vec2 => project(view, pose.x + dx, y, z);
    paintFace(
        ctx,
        [at(0, 0, top), at(length, 0, top), at(length, UNIT.depth, top), at(0, UNIT.depth, top)],
        shade(pose.color, 1.12),
    );
    paintFace(
        ctx,
        [at(length, 0, top), at(length, UNIT.depth, top), at(length, UNIT.depth, bottom), at(length, 0, bottom)],
        shade(pose.color, 0.6),
    );
    paintFace(ctx, [at(0, 0, top), at(length, 0, top), at(length, 0, bottom), at(0, 0, bottom)], pose.color);
    drawClutchChannels(ctx, view, pose);
    // Alignment chamfer along the bottom skirt — improvement #2, lets the brick self-seat.
    ctx.strokeStyle = shade(pose.color, 1.2);
    ctx.lineWidth = 1.2;
    strokeSegment(ctx, at(0, 0, bottom + 0.7), at(length, 0, bottom + 0.7));
    strokeSegment(ctx, at(length, 0, bottom + 0.7), at(length, UNIT.depth, bottom + 0.7));
};

const drawStud = (ctx: CanvasRenderingContext2D, stud: StudShape, color: string): void => {
    const topY = stud.center.y - stud.lift;
    ctx.beginPath();
    ctx.moveTo(stud.center.x - stud.rx, topY);
    ctx.lineTo(stud.center.x - stud.rx, stud.center.y);
    ctx.ellipse(stud.center.x, stud.center.y, stud.rx, stud.ry, 0, Math.PI, 0, true);
    ctx.lineTo(stud.center.x + stud.rx, topY);
    ctx.fillStyle = shade(color, 0.72);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(stud.center.x, topY, stud.rx, stud.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = shade(color, 1.18);
    ctx.fill();
    ctx.stroke();
    // Chamfer ring on the stud rim — improvement #2 seen from above.
    ctx.beginPath();
    ctx.ellipse(stud.center.x, topY, stud.rx * 0.66, stud.ry * 0.66, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
};

const drawStuds = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    const rx = UNIT.studRadius * 1.02 * view.scale;
    const ry = UNIT.studRadius * 0.5 * view.scale;
    const lift = UNIT.studHeight * view.scale;
    for (const row of [12, 4] as const) {
        for (let index = 0; index < pose.studs; index += 1) {
            const center = project(view, pose.x + UNIT.pitch / 2 + index * UNIT.pitch, row, pose.z + UNIT.height);
            drawStud(ctx, {center, rx, ry, lift}, pose.color);
        }
    }
};

/** Draw one brick, squash-and-stretch applied around its front-bottom resting line. */
export const drawBrick = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    const pivot = project(view, pose.x + (pose.studs * UNIT.pitch) / 2, 0, pose.z);
    ctx.save();
    ctx.translate(pose.jitterX + pivot.x, pose.jitterY + pivot.y);
    ctx.scale(pose.squashX, pose.squashY);
    ctx.translate(-pivot.x, -pivot.y);
    drawBody(ctx, view, pose);
    drawStuds(ctx, view, pose);
    ctx.restore();
};

/** Dashed brick silhouette — used for the aiming ghost and the build-instruction phantoms. */
export const drawBrickOutline = (
    ctx: CanvasRenderingContext2D,
    view: IsoView,
    shape: BrickShape,
    style: OutlineStyle,
): void => {
    const length = shape.studs * UNIT.pitch;
    const top = shape.z + UNIT.height;
    const at = (dx: number, y: number, z: number): Vec2 => project(view, shape.x + dx, y, z);
    ctx.save();
    ctx.globalAlpha = style.alpha;
    ctx.setLineDash([...style.dash]);
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 2;
    tracePath(ctx, [
        at(0, 0, shape.z),
        at(0, 0, top),
        at(0, UNIT.depth, top),
        at(length, UNIT.depth, top),
        at(length, UNIT.depth, shape.z),
        at(length, 0, shape.z),
    ]);
    ctx.stroke();
    strokeSegment(ctx, at(0, 0, top), at(length, 0, top));
    strokeSegment(ctx, at(length, 0, top), at(length, UNIT.depth, top));
    strokeSegment(ctx, at(length, 0, top), at(length, 0, shape.z));
    ctx.restore();
};

/** Graph-paper drafting grid: minor line every 16px, major every 80px. */
export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 16) {
        ctx.strokeStyle = x % 80 === 0 ? 'rgba(0, 85, 191, 0.18)' : 'rgba(0, 85, 191, 0.07)';
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
    }
    for (let y = 0; y <= height; y += 16) {
        ctx.strokeStyle = y % 80 === 0 ? 'rgba(0, 85, 191, 0.18)' : 'rgba(0, 85, 191, 0.07)';
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
    }
};

/** The build line: a heavier baseline with a tick at every stud column. */
export const drawBaseline = (ctx: CanvasRenderingContext2D, view: IsoView, cols: number): void => {
    const left = view.cx + columnToX(0, cols) * view.scale - 8;
    const right = view.cx + columnToX(cols, cols) * view.scale + 8;
    ctx.strokeStyle = 'rgba(0, 85, 191, 0.55)';
    ctx.lineWidth = 2;
    strokeSegment(ctx, {x: left, y: view.baseY + 1}, {x: right, y: view.baseY + 1});
    ctx.lineWidth = 1;
    for (let col = 0; col <= cols; col += 1) {
        const x = view.cx + columnToX(col, cols) * view.scale;
        const tick = col % 4 === 0 ? 7 : 4;
        strokeSegment(ctx, {x, y: view.baseY + 2}, {x, y: view.baseY + 2 + tick});
    }
};

/** Engineering-drawing title block, pinned to the bottom-right corner of the sheet. */
export const drawTitleBlock = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lines: readonly string[],
): void => {
    const blockWidth = 282;
    const blockHeight = lines.length * 15 + 21;
    const left = width - blockWidth - 12;
    const top = height - blockHeight - 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillRect(left, top, blockWidth, blockHeight);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, blockWidth, blockHeight);
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (const [index, line] of lines.entries()) {
        ctx.font = index === 0 ? 'bold 11px ui-monospace, Menlo, monospace' : '10px ui-monospace, Menlo, monospace';
        ctx.fillText(line, left + 10, top + 17 + index * 15);
    }
    ctx.beginPath();
    ctx.moveTo(left, top + 22.5);
    ctx.lineTo(left + blockWidth, top + 22.5);
    ctx.lineWidth = 1;
    ctx.stroke();
};

/** Rubber-stamped APPROVED over the title block once the build instructions are matched. */
export const drawStamp = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.save();
    ctx.translate(width - 160, height - 104);
    ctx.rotate(-0.12);
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = '#237841';
    ctx.lineWidth = 3;
    ctx.strokeRect(-76, -21, 152, 42);
    ctx.fillStyle = '#237841';
    ctx.font = 'bold 21px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('APPROVED', 0, 1);
    ctx.restore();
};
