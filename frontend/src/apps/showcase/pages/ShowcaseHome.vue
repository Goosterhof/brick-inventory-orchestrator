<script setup lang="ts">
import AntiPatterns from '../components/AntiPatterns.vue';
import BrandVoice from '../components/BrandVoice.vue';
import BrickDimensions from '../components/BrickDimensions.vue';
import BrickShapes from '../components/BrickShapes.vue';
import ColorPalette from '../components/ColorPalette.vue';
import ComponentGallery from '../components/ComponentGallery.vue';
import ComponentHealth from '../components/ComponentHealth.vue';
import DialogServiceDemo from '../components/DialogServiceDemo.vue';
import FormValidationWorkbench from '../components/FormValidationWorkbench.vue';
import MiddlewarePipelineVisualizer from '../components/MiddlewarePipelineVisualizer.vue';
import PageTransitionDemo from '../components/PageTransitionDemo.vue';
import ResourceAdapterPlayground from '../components/ResourceAdapterPlayground.vue';
import ShowcaseHero from '../components/ShowcaseHero.vue';
import SnapDemo from '../components/SnapDemo.vue';
import ToastServiceDemo from '../components/ToastServiceDemo.vue';
import TypographySpecimen from '../components/TypographySpecimen.vue';
</script>

<template>
    <ShowcaseHero />

    <div max-w="6xl" m="x-auto" p="x-4 md:x-8">
        <ColorPalette />
        <TypographySpecimen />
        <SnapDemo />
        <ComponentGallery />
        <AntiPatterns />
        <BrandVoice />
        <BrickDimensions />
        <ComponentHealth />
        <DialogServiceDemo />
        <ToastServiceDemo />
        <FormValidationWorkbench />
        <ResourceAdapterPlayground />
        <MiddlewarePipelineVisualizer />
        <BrickShapes />
        <PageTransitionDemo />
    </div>
</template>
