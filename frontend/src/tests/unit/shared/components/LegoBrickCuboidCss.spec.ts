import LegoBrickCuboidCss from '@shared/components/LegoBrickCuboidCss.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoBrickCuboidCss', () => {
    it('should render a 6x2 brick with 12 studs by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert — the 6x2 footprint is fixed
        const studs = wrapper.findAll('[data-stud]');
        expect(studs).toHaveLength(12);
    });

    it('should render all six faces of the cuboid', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert — top, bottom, front, back, left, right
        expect(wrapper.find('[data-face="top"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="bottom"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="front"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="back"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="left"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="right"]').exists()).toBe(true);
    });

    it('should set role img and descriptive aria-label on the stage', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert
        const stage = wrapper.find('[data-brick-cuboid-css]');
        expect(stage.attributes('role')).toBe('img');
        expect(stage.attributes('aria-label')).toBe('6 by 2 LEGO brick rendered as a CSS cuboid');
    });

    it('should apply the brick3d-shadow class by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert
        const stage = wrapper.find('[data-brick-cuboid-css]');
        expect(stage.classes()).toContain('brick3d-shadow');
    });

    it('should not apply brick3d-shadow class when shadow is false', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss, {props: {shadow: false}});

        // Assert
        const stage = wrapper.find('[data-brick-cuboid-css]');
        expect(stage.classes()).not.toContain('brick3d-shadow');
    });

    it('should apply custom color to every face and stud part', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss, {props: {color: '#0055BF'}});

        // Assert — every face inherits the color
        const faces = wrapper.findAll('[data-face]');
        expect(faces.length).toBe(6);
        for (const face of faces) {
            expect(face.attributes('style')).toContain('background-color: #0055BF');
        }

        // Stud top + side both use the color
        const studTopEls = wrapper.findAll('.brick3d-stud-top');
        const studSideEls = wrapper.findAll('.brick3d-stud-side');
        expect(studTopEls.length).toBe(12);
        expect(studSideEls.length).toBe(12);
        for (const el of [...studTopEls, ...studSideEls]) {
            expect(el.attributes('style')).toContain('background-color: #0055BF');
        }
    });

    it('should apply default red color when no color prop is provided', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert
        const topFace = wrapper.find('[data-face="top"]');
        expect(topFace.attributes('style')).toContain('background-color: #DC2626');
    });

    it('should position studs in a 6-column by 2-row grid over the top face', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert — the first stud is at (col=0, row=0) so top = rowCenter - radius = 20 - 12 = 8
        // and left = colCenter - radius = 20 - 12 = 8
        const studs = wrapper.findAll('[data-stud]');
        const firstStyle = studs[0]?.attributes('style') ?? '';
        expect(firstStyle).toContain('left: 8px');
        expect(firstStyle).toContain('top: 8px');

        // Last stud is at col=5, row=1 so left = 5*40 + 20 - 12 = 208, top = 40 + 20 - 12 = 48
        const lastStyle = studs[11]?.attributes('style') ?? '';
        expect(lastStyle).toContain('left: 208px');
        expect(lastStyle).toContain('top: 48px');
    });

    it('should render the scene element with preserve-3d styling wrapper', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert
        const scene = wrapper.find('[data-scene]');
        expect(scene.exists()).toBe(true);
        expect(scene.classes()).toContain('brick3d-scene');
    });

    it('should apply 3d face transforms using the computed body dimensions', () => {
        // Arrange — bodyWidth=240, bodyDepth=80, BODY_HEIGHT=48
        // topTransform: translateZ(40px) rotateX(-90deg) translateZ(48px)
        // frontTransform: translateZ(40px)
        // leftTransform: rotateY(-90deg) translateZ(120px)
        const wrapper = shallowMount(LegoBrickCuboidCss);

        // Assert
        const top = wrapper.find('[data-face="top"]');
        expect(top.attributes('style')).toContain('translateZ(40px)');
        expect(top.attributes('style')).toContain('rotateX(-90deg)');
        expect(top.attributes('style')).toContain('translateZ(48px)');

        const front = wrapper.find('[data-face="front"]');
        expect(front.attributes('style')).toContain('translateZ(40px)');

        const left = wrapper.find('[data-face="left"]');
        expect(left.attributes('style')).toContain('rotateY(-90deg)');
        expect(left.attributes('style')).toContain('translateZ(120px)');
    });
});
