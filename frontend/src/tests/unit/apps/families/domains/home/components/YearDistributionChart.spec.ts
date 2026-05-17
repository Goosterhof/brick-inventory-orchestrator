import YearDistributionChart from '@app/domains/home/components/YearDistributionChart.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('YearDistributionChart', () => {
    it('should render a bar for each year in sorted order', () => {
        // Arrange
        const distribution = new Map<number, number>([
            [2020, 3],
            [2015, 1],
            [2018, 2],
        ]);

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const yearLabels = wrapper.findAll('span').filter((s) => /^\d{4}$/.test(s.text()));
        expect(yearLabels.map((s) => s.text())).toStrictEqual(['2015', '2018', '2020']);
    });

    it('should render count labels for each year', () => {
        // Arrange
        const distribution = new Map<number, number>([
            [2020, 5],
            [2015, 2],
        ]);

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const countLabels = wrapper.findAll('span').filter((s) => s.text() === '5' || s.text() === '2');
        expect(countLabels).toHaveLength(2);
    });

    it('should set bar width proportional to max count', () => {
        // Arrange
        const distribution = new Map<number, number>([
            [2020, 4],
            [2021, 2],
        ]);

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const bars = wrapper.findAll("[bg='brick-yellow']");
        expect(bars).toHaveLength(2);
        const firstBarStyle = bars[0]?.attributes('style');
        const secondBarStyle = bars[1]?.attributes('style');
        expect(firstBarStyle).toContain('width: 100%');
        expect(secondBarStyle).toContain('width: 50%');
    });

    it('should render nothing when distribution is empty', () => {
        // Arrange
        const distribution = new Map<number, number>();

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const yearLabels = wrapper.findAll('span').filter((s) => /^\d{4}$/.test(s.text()));
        expect(yearLabels).toHaveLength(0);
    });

    it('should handle single year distribution', () => {
        // Arrange
        const distribution = new Map<number, number>([[2023, 7]]);

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const yearLabels = wrapper.findAll('span').filter((s) => /^\d{4}$/.test(s.text()));
        expect(yearLabels).toHaveLength(1);
        expect(yearLabels[0]?.text()).toBe('2023');

        const bars = wrapper.findAll("[bg='brick-yellow']");
        expect(bars).toHaveLength(1);
        expect(bars[0]?.attributes('style')).toContain('width: 100%');
    });

    it('should handle many years with correct sorting', () => {
        // Arrange
        const distribution = new Map<number, number>([
            [2000, 1],
            [2023, 3],
            [1990, 2],
            [2010, 4],
        ]);

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const yearLabels = wrapper.findAll('span').filter((s) => /^\d{4}$/.test(s.text()));
        expect(yearLabels.map((s) => s.text())).toStrictEqual(['1990', '2000', '2010', '2023']);
    });

    it('should round bar width percentages', () => {
        // Arrange — 1/3 = 33.33... should round to 33%
        const distribution = new Map<number, number>([
            [2020, 3],
            [2021, 1],
        ]);

        // Act
        const wrapper = shallowMount(YearDistributionChart, {props: {distribution}});

        // Assert
        const bars = wrapper.findAll("[bg='brick-yellow']");
        expect(bars[1]?.attributes('style')).toContain('width: 33%');
    });
});
