import AboutPage from '@app/domains/about/pages/AboutPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
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
import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

describe('AboutPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = () => mount(AboutPage);

    it('renders real LegoBrick components with visible stud grids', () => {
        const wrapper = mountPage();

        // 4 demo bricks + 3 HTML diorama bricks = 7
        const bricks = wrapper.findAllComponents(LegoBrick);
        expect(bricks).toHaveLength(7);

        for (const brick of bricks) {
            expect(brick.html()).toContain('inline-grid');
        }
    });

    it('passes correct props through to real LegoBrick children', () => {
        const wrapper = mountPage();

        const bricks = wrapper.findAllComponents(LegoBrick);
        const props = bricks.map((b) => ({
            color: b.props('color'),
            columns: b.props('columns'),
            rows: b.props('rows'),
            shadow: b.props('shadow'),
        }));

        expect(props).toStrictEqual([
            {color: '#DC2626', columns: 2, rows: 2, shadow: false},
            {color: '#1D4ED8', columns: 1, rows: 1, shadow: false},
            {color: '#EAB308', columns: 2, rows: 3, shadow: false},
            {color: '#16A34A', columns: 1, rows: 3, shadow: false},
            {color: '#DC2626', columns: 1, rows: 1, shadow: false},
            {color: '#DC2626', columns: 1, rows: 1, shadow: false},
            {color: '#92400E', columns: 1, rows: 2, shadow: false},
        ]);
    });

    it('renders actual English text for title and description', () => {
        const wrapper = mountPage();

        expect(wrapper.text()).toContain('About');
        expect(wrapper.text()).toContain('This is the about page.');
    });

    it('renders both HTML and SVG diorama sections', () => {
        const wrapper = mountPage();

        expect(wrapper.text()).toContain('Diorama');
        expect(wrapper.find('[data-diorama]').exists()).toBe(true);
        expect(wrapper.find('[data-diorama-svg]').exists()).toBe(true);
    });

    it('renders the HTML diorama with all piece types', () => {
        const wrapper = mountPage();

        expect(wrapper.findAllComponents(LegoSlope)).toHaveLength(2);
        expect(wrapper.findAllComponents(LegoTile)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoArch)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoRound)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoPlate)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoTechnicBeam)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoWedge)).toHaveLength(1);
    });

    it('renders the SVG diorama with all piece types', () => {
        const wrapper = mountPage();

        expect(wrapper.findAllComponents(LegoSlopeSvg)).toHaveLength(2);
        expect(wrapper.findAllComponents(LegoTileSvg)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoArchSvg)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoRoundSvg)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoPlateSvg)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoTechnicBeamSvg)).toHaveLength(1);
        expect(wrapper.findAllComponents(LegoWedgeSvg)).toHaveLength(1);
    });

    it('renders diorama pieces with shadows disabled for drop-shadow container', () => {
        const wrapper = mountPage();

        const allPieces = [
            ...wrapper.findAllComponents(LegoSlope),
            ...wrapper.findAllComponents(LegoTile),
            ...wrapper.findAllComponents(LegoArch),
            ...wrapper.findAllComponents(LegoRound),
            ...wrapper.findAllComponents(LegoPlate),
            ...wrapper.findAllComponents(LegoTechnicBeam),
            ...wrapper.findAllComponents(LegoWedge),
            ...wrapper.findAllComponents(LegoSlopeSvg),
            ...wrapper.findAllComponents(LegoTileSvg),
            ...wrapper.findAllComponents(LegoArchSvg),
            ...wrapper.findAllComponents(LegoRoundSvg),
            ...wrapper.findAllComponents(LegoPlateSvg),
            ...wrapper.findAllComponents(LegoTechnicBeamSvg),
            ...wrapper.findAllComponents(LegoWedgeSvg),
        ];
        for (const piece of allPieces) {
            expect(piece.props('shadow')).toBe(false);
        }
    });

    it('renders SVG diorama BrickSvg pieces with correct props', () => {
        const wrapper = mountPage();

        const svgBricks = wrapper.findAllComponents(LegoBrickSvg);
        // 4 demo + 3 SVG diorama = 7
        expect(svgBricks).toHaveLength(7);

        const dioramaBricks = svgBricks
            .slice(4)
            .map((b) => ({
                color: b.props('color'),
                columns: b.props('columns'),
                rows: b.props('rows'),
                shadow: b.props('shadow'),
            }));
        expect(dioramaBricks).toStrictEqual([
            {color: '#DC2626', columns: 1, rows: 1, shadow: false},
            {color: '#DC2626', columns: 1, rows: 1, shadow: false},
            {color: '#92400E', columns: 1, rows: 2, shadow: false},
        ]);
    });
});
