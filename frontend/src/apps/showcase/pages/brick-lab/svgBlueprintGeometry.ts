/**
 * Declarative blueprint geometry for the SVG brick prototype.
 *
 * Produces path data, stud/tube placements, and dimension specs for the BW-3001X
 * "improved brick" rendered as an engineering blueprint. Model space is millimetres;
 * everything is projected once (2:1 dimetric, the instruction-manual angle) into
 * viewBox pixels and rounded so the template stays a clean declarative document.
 * The local origin is the front-bottom corner level, horizontally centred on the
 * brick footprint — the component positions it with a single `translate`.
 */

interface Vec2 {
    x: number;
    y: number;
}

const SCALE = 10;
const ISO_X = 0.866;
const ISO_Y = 0.5;

const MM = {
    length: 32,
    width: 16,
    height: 9.6,
    pitch: 8,
    studRadius: 2.45,
    studHeight: 1.8,
    tubeRadius: 3.25,
    tubeHeight: 8,
    cols: 4,
    rows: 2,
} as const;

const round2 = (value: number): number => Math.round(value * 100) / 100;

const iso = (x: number, y: number, z: number): Vec2 => ({
    x: round2((x - y - (MM.length - MM.width) / 2) * ISO_X * SCALE),
    y: round2((x + y - MM.length - MM.width) * ISO_Y * SCALE - z * SCALE),
});

const pathFrom = (points: readonly Vec2[], close: boolean): string => {
    const steps = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`);
    return close ? `${steps.join(' ')} Z` : steps.join(' ');
};

interface BrickOutline {
    top: string;
    front: string;
    right: string;
    grooves: string[];
    chamfer: string;
}

/** The three visible faces, clutch grooves, and the alignment-chamfer skirt line. */
export const brickOutline = (): BrickOutline => {
    const top = MM.height;
    const grooves = [1, 2, 3].map((step) =>
        pathFrom([iso(step * MM.pitch, MM.width, top - 1.1), iso(step * MM.pitch, MM.width, 1.1)], false),
    );
    grooves.push(pathFrom([iso(MM.length, MM.width / 2, top - 1.1), iso(MM.length, MM.width / 2, 1.1)], false));
    return {
        top: pathFrom(
            [iso(0, 0, top), iso(MM.length, 0, top), iso(MM.length, MM.width, top), iso(0, MM.width, top)],
            true,
        ),
        front: pathFrom(
            [iso(0, MM.width, top), iso(MM.length, MM.width, top), iso(MM.length, MM.width, 0), iso(0, MM.width, 0)],
            true,
        ),
        right: pathFrom(
            [iso(MM.length, 0, top), iso(MM.length, MM.width, top), iso(MM.length, MM.width, 0), iso(MM.length, 0, 0)],
            true,
        ),
        grooves,
        chamfer: pathFrom([iso(0, MM.width, 0.7), iso(MM.length, MM.width, 0.7), iso(MM.length, 0, 0.7)], false),
    };
};

export interface StudPlacement {
    id: string;
    x: number;
    y: number;
}

/** Top-face centres for the eight studs, back row first so painter order holds. */
export const studPlacements = (): StudPlacement[] => {
    const placements: StudPlacement[] = [];
    for (let row = 0; row < MM.rows; row += 1) {
        for (let col = 0; col < MM.cols; col += 1) {
            const center = iso(MM.pitch / 2 + col * MM.pitch, MM.pitch / 2 + row * MM.pitch, MM.height);
            placements.push({id: `${row === 0 ? 'B' : 'A'}${col + 1}`, x: center.x, y: center.y});
        }
    }
    return placements;
};

export const STUD = {
    rx: round2(MM.studRadius * Math.SQRT2 * ISO_X * SCALE),
    ry: round2(MM.studRadius * Math.SQRT2 * ISO_Y * SCALE),
    height: round2(MM.studHeight * SCALE),
} as const;

export const TUBE = {
    rx: round2(MM.tubeRadius * Math.SQRT2 * ISO_X * SCALE),
    ry: round2(MM.tubeRadius * Math.SQRT2 * ISO_Y * SCALE),
    height: round2(MM.tubeHeight * SCALE),
} as const;

/** Open cylinder silhouette drawn upward from a bottom-centre origin. */
export const cylinderPath = (rx: number, ry: number, height: number): string =>
    `M ${-rx} ${-height} L ${-rx} 0 A ${rx} ${ry} 0 0 0 ${rx} 0 L ${rx} ${-height}`;

/** Bottom-centre anchor for each of the three vented core tubes. */
export const tubePlacements = (): Vec2[] => [1, 2, 3].map((step) => iso(step * MM.pitch, MM.width / 2, 0));

interface DimensionSpec {
    line: string;
    extensions: string;
    label: string;
    labelX: number;
    labelY: number;
}

const dimensionBetween = (a: Vec2, b: Vec2, label: string, offset: number): DimensionSpec => {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const perpX = (b.y - a.y) / length;
    const perpY = (a.x - b.x) / length;
    const sign = Math.sign(offset);
    const at = (base: Vec2, distance: number): Vec2 => ({
        x: round2(base.x + perpX * distance),
        y: round2(base.y + perpY * distance),
    });
    const labelAt = at({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}, offset + 16 * sign);
    return {
        line: pathFrom([at(a, offset), at(b, offset)], false),
        extensions: `${pathFrom([at(a, 4 * sign), at(a, offset + 6 * sign)], false)} ${pathFrom(
            [at(b, 4 * sign), at(b, offset + 6 * sign)],
            false,
        )}`,
        label,
        labelX: labelAt.x,
        labelY: labelAt.y,
    };
};

/** Width, depth, and height dimension lines with extension lines and labels. */
export const dimensions = (): DimensionSpec[] => [
    dimensionBetween(iso(0, MM.width, 0), iso(MM.length, MM.width, 0), '31.8 mm', -34),
    dimensionBetween(iso(MM.length, MM.width, 0), iso(MM.length, 0, 0), '15.8 mm', -34),
    dimensionBetween(iso(MM.length, MM.width, 0), iso(MM.length, MM.width, MM.height), '9.6 mm', -40),
];

/** Leader-line anchors for the three improvement annotations. */
export const anchorPoints = (): {groove: Vec2; stud: Vec2; tube: Vec2} => ({
    groove: iso(2 * MM.pitch, MM.width, MM.height / 2),
    stud: iso(MM.pitch / 2 + 3 * MM.pitch, MM.pitch / 2 + MM.pitch, MM.height + MM.studHeight),
    tube: iso(2 * MM.pitch, MM.width / 2, 0),
});
