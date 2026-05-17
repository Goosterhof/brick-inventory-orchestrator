import AboutPage from '@app/domains/about/pages/AboutPage.vue';
import LegoArch from '@shared/components/LegoArch.vue';
import LegoArchSvg from '@shared/components/LegoArchSvg.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import LegoBrickSvg from '@shared/components/LegoBrickSvg.vue';
import LegoPlate from '@shared/components/LegoPlate.vue';
import LegoPlateSvg from '@shared/components/LegoPlateSvg.vue';
import LegoRound from '@shared/components/LegoRound.vue';
import LegoRoundSvg from '@shared/components/LegoRoundSvg.vue';
import LegoSlope from '@shared/components/LegoSlope.vue';
import LegoSlopeSvg from '@shared/components/LegoSlopeSvg.vue';
import LegoTechnicBeam from '@shared/components/LegoTechnicBeam.vue';
import LegoTechnicBeamSvg from '@shared/components/LegoTechnicBeamSvg.vue';
import LegoTile from '@shared/components/LegoTile.vue';
import LegoTileSvg from '@shared/components/LegoTileSvg.vue';
import LegoWedge from '@shared/components/LegoWedge.vue';
import LegoWedgeSvg from '@shared/components/LegoWedgeSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

// Mock all shape components to eliminate the 16-module import resolution chain at collect time.
// vi.mock hoists above imports, so the imports above resolve to these lightweight stubs.
// shallowMount stubs them anyway — the mocks only prevent heavy transitive module resolution.
const {brickProps, shapeProps} = vi.hoisted(() => ({
    brickProps: ['color', 'shadow', 'columns', 'rows'],
    shapeProps: ['color', 'shadow'],
}));
vi.mock('@shared/components/LegoBrick.vue', () => ({default: {name: 'LegoBrick', props: brickProps}}));
vi.mock('@shared/components/LegoBrickSvg.vue', () => ({default: {name: 'LegoBrickSvg', props: brickProps}}));
vi.mock('@shared/components/LegoArch.vue', () => ({default: {name: 'LegoArch', props: shapeProps}}));
vi.mock('@shared/components/LegoArchSvg.vue', () => ({default: {name: 'LegoArchSvg', props: shapeProps}}));
vi.mock('@shared/components/LegoPlate.vue', () => ({default: {name: 'LegoPlate', props: shapeProps}}));
vi.mock('@shared/components/LegoPlateSvg.vue', () => ({default: {name: 'LegoPlateSvg', props: shapeProps}}));
vi.mock('@shared/components/LegoRound.vue', () => ({default: {name: 'LegoRound', props: shapeProps}}));
vi.mock('@shared/components/LegoRoundSvg.vue', () => ({default: {name: 'LegoRoundSvg', props: shapeProps}}));
vi.mock('@shared/components/LegoSlope.vue', () => ({default: {name: 'LegoSlope', props: shapeProps}}));
vi.mock('@shared/components/LegoSlopeSvg.vue', () => ({default: {name: 'LegoSlopeSvg', props: shapeProps}}));
vi.mock('@shared/components/LegoTechnicBeam.vue', () => ({default: {name: 'LegoTechnicBeam', props: shapeProps}}));
vi.mock('@shared/components/LegoTechnicBeamSvg.vue', () => ({
    default: {name: 'LegoTechnicBeamSvg', props: shapeProps},
}));
vi.mock('@shared/components/LegoTile.vue', () => ({default: {name: 'LegoTile', props: shapeProps}}));
vi.mock('@shared/components/LegoTileSvg.vue', () => ({default: {name: 'LegoTileSvg', props: shapeProps}}));
vi.mock('@shared/components/LegoWedge.vue', () => ({default: {name: 'LegoWedge', props: shapeProps}}));
vi.mock('@shared/components/LegoWedgeSvg.vue', () => ({default: {name: 'LegoWedgeSvg', props: shapeProps}}));

vi.mock('@app/services', () => ({
    familyTranslationService: {t: (key: string) => ({value: key}), locale: {value: 'en'}},
}));

describe('AboutPage', () => {
    it('should render the title and description', () => {
        const wrapper = shallowMount(AboutPage);

        expect(wrapper.text()).toContain('about.title');
        expect(wrapper.text()).toContain('about.description');
    });

    it('should render four LegoBrick components in the brick demo', () => {
        const wrapper = shallowMount(AboutPage);

        // 4 demo bricks + 3 HTML diorama bricks (2 wall + 1 tree trunk) = 7
        const bricks = wrapper.findAllComponents(LegoBrick);
        expect(bricks).toHaveLength(7);
    });

    it('should render bricks with correct colors in the demo section', () => {
        const wrapper = shallowMount(AboutPage);

        const bricks = wrapper.findAllComponents(LegoBrick);
        const demoColors = bricks.slice(0, 4).map((brick) => brick.props('color'));
        expect(demoColors).toStrictEqual(['#DC2626', '#1D4ED8', '#EAB308', '#16A34A']);
    });

    it('should render bricks with correct dimensions in the demo section', () => {
        const wrapper = shallowMount(AboutPage);

        const bricks = wrapper.findAllComponents(LegoBrick);
        const demoDimensions = bricks
            .slice(0, 4)
            .map((brick) => ({columns: brick.props('columns'), rows: brick.props('rows')}));
        expect(demoDimensions).toStrictEqual([
            {columns: 2, rows: 2},
            {columns: 1, rows: 1},
            {columns: 2, rows: 3},
            {columns: 1, rows: 3},
        ]);
    });

    it('should disable shadow on all bricks', () => {
        const wrapper = shallowMount(AboutPage);

        const bricks = wrapper.findAllComponents(LegoBrick);
        for (const brick of bricks) {
            expect(brick.props('shadow')).toBe(false);
        }
    });

    it('should have a drop-shadow on the demo container', () => {
        const wrapper = shallowMount(AboutPage);

        const container = wrapper.find('[inline-block]');
        expect(container.attributes('style')).toContain('drop-shadow');
    });

    it('should overlap borders between adjacent bricks with negative margins', () => {
        const wrapper = shallowMount(AboutPage);

        const negativeMarginElements = wrapper.findAll('.ml-\\[-3px\\]');
        expect(negativeMarginElements.length).toBeGreaterThanOrEqual(2);
        const negativeTopMargin = wrapper.findAll('.mt-\\[-3px\\]');
        expect(negativeTopMargin.length).toBeGreaterThanOrEqual(1);
    });

    it('should render LegoBrickSvg components for demo and SVG diorama', () => {
        const wrapper = shallowMount(AboutPage);

        // 4 demo + 3 SVG diorama (2 wall + 1 trunk) = 7
        const svgBricks = wrapper.findAllComponents(LegoBrickSvg);
        expect(svgBricks).toHaveLength(7);
    });

    it('should render SVG bricks with correct colors in the demo section', () => {
        const wrapper = shallowMount(AboutPage);

        const svgBricks = wrapper.findAllComponents(LegoBrickSvg);
        const demoColors = svgBricks.slice(0, 4).map((brick) => brick.props('color'));
        expect(demoColors).toStrictEqual(['#DC2626', '#1D4ED8', '#EAB308', '#16A34A']);
    });

    it('should render SVG bricks with correct dimensions in the demo section', () => {
        const wrapper = shallowMount(AboutPage);

        const svgBricks = wrapper.findAllComponents(LegoBrickSvg);
        const dimensions = svgBricks
            .slice(0, 4)
            .map((brick) => ({columns: brick.props('columns'), rows: brick.props('rows')}));
        expect(dimensions).toStrictEqual([
            {columns: 2, rows: 2},
            {columns: 1, rows: 1},
            {columns: 2, rows: 3},
            {columns: 1, rows: 3},
        ]);
    });

    it('should disable shadow on all SVG bricks', () => {
        const wrapper = shallowMount(AboutPage);

        const svgBricks = wrapper.findAllComponents(LegoBrickSvg);
        for (const brick of svgBricks) {
            expect(brick.props('shadow')).toBe(false);
        }
    });

    it('should render both HTML and SVG brick arrangements side by side', () => {
        const wrapper = shallowMount(AboutPage);

        const flexContainer = wrapper.find('[flex]');
        expect(flexContainer.exists()).toBe(true);
        const inlineBlocks = wrapper.findAll('[inline-block]');
        expect(inlineBlocks).toHaveLength(2);
    });

    it('should render the diorama section with heading', () => {
        const wrapper = shallowMount(AboutPage);

        expect(wrapper.text()).toContain('about.diorama');
        expect(wrapper.find('[data-diorama]').exists()).toBe(true);
    });

    it('should render both HTML and SVG dioramas', () => {
        const wrapper = shallowMount(AboutPage);

        expect(wrapper.find('[data-diorama]').exists()).toBe(true);
        expect(wrapper.find('[data-diorama-svg]').exists()).toBe(true);
    });

    it('should render dioramas with drop-shadow', () => {
        const wrapper = shallowMount(AboutPage);

        const htmlDiorama = wrapper.find('[data-diorama]');
        const svgDiorama = wrapper.find('[data-diorama-svg]');
        expect(htmlDiorama.attributes('style')).toContain('drop-shadow');
        expect(svgDiorama.attributes('style')).toContain('drop-shadow');
    });

    it('should render two LegoSlope components for the HTML roof', () => {
        const wrapper = shallowMount(AboutPage);

        const slopes = wrapper.findAllComponents(LegoSlope);
        expect(slopes).toHaveLength(2);
        const colors = slopes.map((s) => s.props('color'));
        expect(colors).toStrictEqual(['#EAB308', '#EAB308']);
    });

    it('should mirror the second slope to form a roof peak', () => {
        const wrapper = shallowMount(AboutPage);

        const slopes = wrapper.findAllComponents(LegoSlope);
        const styles = slopes.map((s) => s.attributes('style') ?? '');
        expect(styles).toStrictEqual([expect.not.stringContaining('scaleX'), expect.stringContaining('scaleX(-1)')]);
    });

    it('should render a LegoTile as a window', () => {
        const wrapper = shallowMount(AboutPage);

        const tiles = wrapper.findAllComponents(LegoTile);
        expect(tiles).toHaveLength(1);
        expect(tiles.map((t) => t.props('color'))).toStrictEqual(['#1D4ED8']);
    });

    it('should render a LegoArch as a door', () => {
        const wrapper = shallowMount(AboutPage);

        const arches = wrapper.findAllComponents(LegoArch);
        expect(arches).toHaveLength(1);
        expect(arches.map((a) => a.props('color'))).toStrictEqual(['#DC2626']);
    });

    it('should render a LegoRound as a tree top', () => {
        const wrapper = shallowMount(AboutPage);

        const rounds = wrapper.findAllComponents(LegoRound);
        expect(rounds).toHaveLength(1);
        expect(rounds.map((r) => r.props('color'))).toStrictEqual(['#16A34A']);
    });

    it('should render a LegoPlate as ground', () => {
        const wrapper = shallowMount(AboutPage);

        const plates = wrapper.findAllComponents(LegoPlate);
        expect(plates).toHaveLength(1);
        expect(plates.map((p) => p.props('color'))).toStrictEqual(['#16A34A']);
    });

    it('should render a LegoTechnicBeam in the ground row', () => {
        const wrapper = shallowMount(AboutPage);

        const beams = wrapper.findAllComponents(LegoTechnicBeam);
        expect(beams).toHaveLength(1);
        expect(beams.map((b) => b.props('color'))).toStrictEqual(['#6B7280']);
    });

    it('should render a LegoWedge in the ground row', () => {
        const wrapper = shallowMount(AboutPage);

        const wedges = wrapper.findAllComponents(LegoWedge);
        expect(wedges).toHaveLength(1);
        expect(wedges.map((w) => w.props('color'))).toStrictEqual(['#6B7280']);
    });

    it('should disable shadow on all HTML diorama pieces', () => {
        const wrapper = shallowMount(AboutPage);

        const dioramaPieces = [
            ...wrapper.findAllComponents(LegoSlope),
            ...wrapper.findAllComponents(LegoTile),
            ...wrapper.findAllComponents(LegoArch),
            ...wrapper.findAllComponents(LegoRound),
            ...wrapper.findAllComponents(LegoPlate),
            ...wrapper.findAllComponents(LegoTechnicBeam),
            ...wrapper.findAllComponents(LegoWedge),
        ];
        for (const piece of dioramaPieces) {
            expect(piece.props('shadow')).toBe(false);
        }
    });

    it('should render HTML diorama bricks with correct colors and dimensions', () => {
        const wrapper = shallowMount(AboutPage);

        const bricks = wrapper.findAllComponents(LegoBrick);
        // Diorama bricks are indices 4-6: two red 1×1 walls + one brown 1×2 trunk
        const dioramaBricks = bricks
            .slice(4)
            .map((b) => ({color: b.props('color'), columns: b.props('columns'), rows: b.props('rows')}));
        expect(dioramaBricks).toStrictEqual([
            {color: '#DC2626', columns: 1, rows: 1},
            {color: '#DC2626', columns: 1, rows: 1},
            {color: '#92400E', columns: 1, rows: 2},
        ]);
    });

    it('should render two LegoSlopeSvg components for the SVG roof', () => {
        const wrapper = shallowMount(AboutPage);

        const slopes = wrapper.findAllComponents(LegoSlopeSvg);
        expect(slopes).toHaveLength(2);
        const colors = slopes.map((s) => s.props('color'));
        expect(colors).toStrictEqual(['#EAB308', '#EAB308']);
    });

    it('should mirror the second SVG slope via its wrapper', () => {
        const wrapper = shallowMount(AboutPage);

        const svgDiorama = wrapper.find('[data-diorama-svg]');
        const slopeWrappers = svgDiorama.findAll("[w='\\[75px\\]']");
        const styles = slopeWrappers.map((w) => w.attributes('style') ?? '');
        expect(styles).toStrictEqual([expect.not.stringContaining('scaleX'), expect.stringContaining('scaleX(-1)')]);
    });

    it('should render a LegoTileSvg as a window', () => {
        const wrapper = shallowMount(AboutPage);

        const tiles = wrapper.findAllComponents(LegoTileSvg);
        expect(tiles).toHaveLength(1);
        expect(tiles.map((t) => t.props('color'))).toStrictEqual(['#1D4ED8']);
    });

    it('should render a LegoArchSvg as a door', () => {
        const wrapper = shallowMount(AboutPage);

        const arches = wrapper.findAllComponents(LegoArchSvg);
        expect(arches).toHaveLength(1);
        expect(arches.map((a) => a.props('color'))).toStrictEqual(['#DC2626']);
    });

    it('should render a LegoRoundSvg as a tree top', () => {
        const wrapper = shallowMount(AboutPage);

        const rounds = wrapper.findAllComponents(LegoRoundSvg);
        expect(rounds).toHaveLength(1);
        expect(rounds.map((r) => r.props('color'))).toStrictEqual(['#16A34A']);
    });

    it('should render a LegoPlateSvg as ground', () => {
        const wrapper = shallowMount(AboutPage);

        const plates = wrapper.findAllComponents(LegoPlateSvg);
        expect(plates).toHaveLength(1);
        expect(plates.map((p) => p.props('color'))).toStrictEqual(['#16A34A']);
    });

    it('should render a LegoTechnicBeamSvg in the ground row', () => {
        const wrapper = shallowMount(AboutPage);

        const beams = wrapper.findAllComponents(LegoTechnicBeamSvg);
        expect(beams).toHaveLength(1);
        expect(beams.map((b) => b.props('color'))).toStrictEqual(['#6B7280']);
    });

    it('should render a LegoWedgeSvg in the ground row', () => {
        const wrapper = shallowMount(AboutPage);

        const wedges = wrapper.findAllComponents(LegoWedgeSvg);
        expect(wedges).toHaveLength(1);
        expect(wedges.map((w) => w.props('color'))).toStrictEqual(['#6B7280']);
    });

    it('should render SVG diorama BrickSvg pieces with correct colors and dimensions', () => {
        const wrapper = shallowMount(AboutPage);

        const svgBricks = wrapper.findAllComponents(LegoBrickSvg);
        // SVG diorama bricks are indices 4-6: two red 1×1 walls + one brown 1×2 trunk
        const dioramaBricks = svgBricks
            .slice(4)
            .map((b) => ({color: b.props('color'), columns: b.props('columns'), rows: b.props('rows')}));
        expect(dioramaBricks).toStrictEqual([
            {color: '#DC2626', columns: 1, rows: 1},
            {color: '#DC2626', columns: 1, rows: 1},
            {color: '#92400E', columns: 1, rows: 2},
        ]);
    });

    it('should disable shadow on all SVG diorama pieces', () => {
        const wrapper = shallowMount(AboutPage);

        const svgDioramaPieces = [
            ...wrapper.findAllComponents(LegoSlopeSvg),
            ...wrapper.findAllComponents(LegoTileSvg),
            ...wrapper.findAllComponents(LegoArchSvg),
            ...wrapper.findAllComponents(LegoRoundSvg),
            ...wrapper.findAllComponents(LegoPlateSvg),
            ...wrapper.findAllComponents(LegoTechnicBeamSvg),
            ...wrapper.findAllComponents(LegoWedgeSvg),
        ];
        for (const piece of svgDioramaPieces) {
            expect(piece.props('shadow')).toBe(false);
        }
    });
});
