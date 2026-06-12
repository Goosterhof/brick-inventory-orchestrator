/**
 * Pure geometry and immediate-mode drawing helpers for the Canvas 2D brick prototype.
 *
 * Everything here is stateless: the component owns the clock and the physics, these
 * functions only know how to put a BW-3001X "improved brick" on a drafting table.
 * Model space is millimetres; `IsoView.scale` converts to CSS pixels using a
 * 2:1 dimetric projection (the classic LEGO instruction-manual angle).
 */

export interface IsoView {
    /** Horizontal screen centre of the brick footprint, in CSS px. */
    cx: number;
    /** Screen y of the stack base — the front-bottom corner at z = 0. */
    baseY: number;
    /** Pixels per millimetre. */
    scale: number;
}

export interface BrickPose {
    /** Height of the brick underside above the stack base, in mm. */
    z: number;
    color: string;
    squashX: number;
    squashY: number;
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

export const BRICK = {
    length: 32,
    width: 16,
    height: 9.6,
    pitch: 8,
    studRadius: 2.45,
    studHeight: 1.8,
    cols: 4,
    rows: 2,
} as const;

const ISO_X = 0.866;
const ISO_Y = 0.5;
const INK = '#000000';

export const project = (view: IsoView, x: number, y: number, z: number): Vec2 => ({
    x: view.cx + (x - y - (BRICK.length - BRICK.width) / 2) * ISO_X * view.scale,
    y: view.baseY + (x + y - BRICK.length - BRICK.width) * ISO_Y * view.scale - z * view.scale,
});

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

/** Vertical clutch-power grooves on the two visible faces — the headline improvement. */
const drawClutchChannels = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    ctx.strokeStyle = shade(pose.color, 0.48);
    ctx.lineWidth = Math.max(1.2, view.scale * 0.2);
    const top = pose.z + BRICK.height - 1.1;
    const bottom = pose.z + 1.1;
    for (let step = 1; step < BRICK.cols; step += 1) {
        strokeSegment(
            ctx,
            project(view, step * BRICK.pitch, BRICK.width, top),
            project(view, step * BRICK.pitch, BRICK.width, bottom),
        );
    }
    strokeSegment(
        ctx,
        project(view, BRICK.length, BRICK.width / 2, top),
        project(view, BRICK.length, BRICK.width / 2, bottom),
    );
};

const drawBody = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    const bottom = pose.z;
    const top = pose.z + BRICK.height;
    const at = (x: number, y: number, z: number): Vec2 => project(view, x, y, z);
    const {length, width} = BRICK;
    paintFace(ctx, [at(0, 0, top), at(length, 0, top), at(length, width, top), at(0, width, top)], pose.color);
    paintFace(
        ctx,
        [at(0, width, top), at(length, width, top), at(length, width, bottom), at(0, width, bottom)],
        shade(pose.color, 0.78),
    );
    paintFace(
        ctx,
        [at(length, 0, top), at(length, width, top), at(length, width, bottom), at(length, 0, bottom)],
        shade(pose.color, 0.58),
    );
    drawClutchChannels(ctx, view, pose);
    // Alignment chamfer along the bottom skirt — improvement #2, lets the brick self-seat.
    ctx.strokeStyle = shade(pose.color, 1.18);
    ctx.lineWidth = 1.5;
    strokeSegment(ctx, at(0, width, bottom + 0.7), at(length, width, bottom + 0.7));
    strokeSegment(ctx, at(length, width, bottom + 0.7), at(length, 0, bottom + 0.7));
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
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(stud.center.x, topY, stud.rx, stud.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = shade(color, 1.12);
    ctx.fill();
    ctx.stroke();
    // Chamfer ring on the stud rim — improvement #2 seen from above.
    ctx.beginPath();
    ctx.ellipse(stud.center.x, topY, stud.rx * 0.68, stud.ry * 0.68, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
};

const drawStuds = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    const rx = BRICK.studRadius * Math.SQRT2 * ISO_X * view.scale;
    const ry = BRICK.studRadius * Math.SQRT2 * ISO_Y * view.scale;
    const lift = BRICK.studHeight * view.scale;
    for (let row = 0; row < BRICK.rows; row += 1) {
        for (let col = 0; col < BRICK.cols; col += 1) {
            const center = project(
                view,
                BRICK.pitch / 2 + col * BRICK.pitch,
                BRICK.pitch / 2 + row * BRICK.pitch,
                pose.z + BRICK.height,
            );
            drawStud(ctx, {center, rx, ry, lift}, pose.color);
        }
    }
};

/** Draw one brick, squash-and-stretch applied around its front-bottom resting line. */
export const drawBrick = (ctx: CanvasRenderingContext2D, view: IsoView, pose: BrickPose): void => {
    const pivotY = project(view, BRICK.length, BRICK.width, pose.z).y;
    ctx.save();
    ctx.translate(view.cx, pivotY);
    ctx.scale(pose.squashX, pose.squashY);
    ctx.translate(-view.cx, -pivotY);
    drawBody(ctx, view, pose);
    drawStuds(ctx, view, pose);
    ctx.restore();
};

/** Dashed landing-slot preview for the next brick — the drafting "ghost line". */
export const drawGhostSlot = (ctx: CanvasRenderingContext2D, view: IsoView, z: number, alpha: number): void => {
    const top = z + BRICK.height;
    const corners = [
        project(view, 0, 0, top),
        project(view, BRICK.length, 0, top),
        project(view, BRICK.length, BRICK.width, top),
        project(view, 0, BRICK.width, top),
    ];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = '#0055BF';
    ctx.lineWidth = 2;
    tracePath(ctx, corners);
    ctx.stroke();
    for (const [x, y] of [
        [0, BRICK.width],
        [BRICK.length, BRICK.width],
        [BRICK.length, 0],
    ] as const) {
        strokeSegment(ctx, project(view, x, y, top), project(view, x, y, z));
    }
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

/** Engineering-drawing title block, pinned to the bottom-right corner of the sheet. */
export const drawTitleBlock = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lines: readonly string[],
): void => {
    const blockWidth = 272;
    const blockHeight = lines.length * 15 + 21;
    const left = width - blockWidth - 12;
    const top = height - blockHeight - 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(left, top, blockWidth, blockHeight);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, blockWidth, blockHeight);
    ctx.fillStyle = INK;
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
