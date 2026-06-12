/**
 * The Sculptor — Three.js scene kit for the Brick Lab.
 *
 * A true mesh brick: the body is a rounded-rect extrusion with a real bevel,
 * the studs are lathed profiles with a chamfered rim (the lab's "improved
 * brick" — a 45° lead-in for self-aligning stacking), and the underside
 * tubes are open cylinders that reveal themselves in the exploded view.
 * Three-point light rig, PCF-soft shadows, shadow-catching ground.
 */
import {
    AmbientLight,
    type BufferGeometry,
    CylinderGeometry,
    DirectionalLight,
    DoubleSide,
    ExtrudeGeometry,
    Group,
    LatheGeometry,
    Light,
    Mesh,
    MeshStandardMaterial,
    type Object3D,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShadowMaterial,
    Shape,
    Vector2,
    WebGLRenderer,
} from 'three';

export interface BrickConfig {
    studsX: number;
    studsZ: number;
}

export interface BrickParts {
    group: Group;
    studGroup: Group;
    tubeGroup: Group;
    dispose: () => void;
}

export interface SculptorScene {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    material: MeshStandardMaterial;
    dispose: () => void;
}

export const BRICK_COLORS = [
    {name: 'Brick Yellow', hex: 0xf5c518},
    {name: 'Brick Red', hex: 0xc41a16},
    {name: 'Brick Blue', hex: 0x0055bf},
    {name: 'Baseplate Green', hex: 0x237841},
] as const;

const STUD_PITCH = 0.8;
const BODY_HEIGHT = 0.96;
const STUD_RADIUS = 0.24;
const STUD_HEIGHT = 0.18;
const RIM_CHAMFER = 0.05;
const BEVEL = 0.03;

const createBodyShape = (halfW: number, halfD: number): Shape => {
    const r = 0.05;
    const shape = new Shape();
    shape.moveTo(-halfW + r, -halfD);
    shape.lineTo(halfW - r, -halfD);
    shape.quadraticCurveTo(halfW, -halfD, halfW, -halfD + r);
    shape.lineTo(halfW, halfD - r);
    shape.quadraticCurveTo(halfW, halfD, halfW - r, halfD);
    shape.lineTo(-halfW + r, halfD);
    shape.quadraticCurveTo(-halfW, halfD, -halfW, halfD - r);
    shape.lineTo(-halfW, -halfD + r);
    shape.quadraticCurveTo(-halfW, -halfD, -halfW + r, -halfD);
    return shape;
};

const createBodyMesh = (config: BrickConfig, material: MeshStandardMaterial): Mesh => {
    const halfW = (config.studsX * STUD_PITCH) / 2 - BEVEL;
    const halfD = (config.studsZ * STUD_PITCH) / 2 - BEVEL;
    const geometry = new ExtrudeGeometry(createBodyShape(halfW, halfD), {
        depth: BODY_HEIGHT - 2 * BEVEL,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: BEVEL,
        bevelSegments: 2,
        curveSegments: 4,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, BEVEL, 0);
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
};

const createStudGroup = (config: BrickConfig, material: MeshStandardMaterial): Group => {
    // Lathed profile: cylinder wall, 45-degree chamfered rim, flat cap.
    const profile = [
        new Vector2(0.001, 0),
        new Vector2(STUD_RADIUS, 0),
        new Vector2(STUD_RADIUS, STUD_HEIGHT - RIM_CHAMFER),
        new Vector2(STUD_RADIUS - RIM_CHAMFER, STUD_HEIGHT),
        new Vector2(0.001, STUD_HEIGHT),
    ];
    const geometry = new LatheGeometry(profile, 28);
    const group = new Group();
    for (let i = 0; i < config.studsX; i++) {
        for (let j = 0; j < config.studsZ; j++) {
            const stud = new Mesh(geometry, material);
            stud.castShadow = true;
            stud.position.set(
                (i + 0.5 - config.studsX / 2) * STUD_PITCH,
                BODY_HEIGHT,
                (j + 0.5 - config.studsZ / 2) * STUD_PITCH,
            );
            group.add(stud);
        }
    }
    return group;
};

const createTubeGroup = (config: BrickConfig, material: MeshStandardMaterial): Group => {
    const geometry = new CylinderGeometry(0.3, 0.3, BODY_HEIGHT - 0.12, 24, 1, true);
    const group = new Group();
    for (let i = 1; i < config.studsX; i++) {
        for (let j = 1; j < config.studsZ; j++) {
            const tube = new Mesh(geometry, material);
            tube.castShadow = true;
            tube.position.set(
                (i - config.studsX / 2) * STUD_PITCH,
                (BODY_HEIGHT - 0.12) / 2,
                (j - config.studsZ / 2) * STUD_PITCH,
            );
            group.add(tube);
        }
    }
    return group;
};

const isMesh = (object: Object3D): object is Mesh => object instanceof Mesh;

export const buildBrickParts = (config: BrickConfig, material: MeshStandardMaterial): BrickParts => {
    const group = new Group();
    const body = createBodyMesh(config, material);
    const studGroup = createStudGroup(config, material);
    const tubeGroup = createTubeGroup(config, material);
    group.add(body, studGroup, tubeGroup);

    const dispose = (): void => {
        const geometries = new Set<BufferGeometry>();
        group.traverse((object) => {
            if (isMesh(object)) {
                geometries.add(object.geometry);
            }
        });
        for (const geometry of geometries) {
            geometry.dispose();
        }
    };

    return {group, studGroup, tubeGroup, dispose};
};

const createLightRig = (): Group => {
    const rig = new Group();
    const key = new DirectionalLight(0xfff2dd, 2.6);
    key.position.set(4, 6, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0004;
    const fill = new DirectionalLight(0xdbe9ff, 0.9);
    fill.position.set(-5, 3, 2);
    const rim = new DirectionalLight(0xffffff, 1.5);
    rim.position.set(-1, 4, -6);
    rig.add(key, fill, rim, new AmbientLight(0xffffff, 0.5));
    return rig;
};

const createGround = (): Mesh<PlaneGeometry, ShadowMaterial> => {
    const ground = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({opacity: 0.24}));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    return ground;
};

export const createSculptorScene = (canvas: HTMLCanvasElement): SculptorScene | null => {
    let renderer: WebGLRenderer;
    try {
        renderer = new WebGLRenderer({canvas, antialias: true, alpha: true});
    } catch {
        return null;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 80);
    const rig = createLightRig();
    const ground = createGround();
    scene.add(rig, ground);
    const material = new MeshStandardMaterial({
        color: BRICK_COLORS[0].hex,
        roughness: 0.32,
        metalness: 0.05,
        side: DoubleSide,
    });

    const dispose = (): void => {
        rig.traverse((object) => {
            if (object instanceof Light) {
                object.dispose();
            }
        });
        ground.geometry.dispose();
        ground.material.dispose();
        material.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
    };

    return {renderer, scene, camera, material, dispose};
};
