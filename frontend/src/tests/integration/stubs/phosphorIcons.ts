/**
 * Lightweight stub module for @phosphor-icons/vue.
 *
 * Aliased via Vite resolve.alias in vitest.integration.config.ts to avoid
 * the ~800ms collect-time tax from the barrel export (4,536 components).
 * Only icons actually used in production code are stubbed here.
 *
 * See ADR-013 Resolved Questions for the rationale.
 */

const iconStub = {template: '<i />', props: ['size', 'weight']};

// Icons used in src/shared/components/
export const PhX = iconStub;
export const PhCheckCircle = iconStub;
export const PhWarningCircle = iconStub;
export const PhCaretRight = iconStub;
export const PhList = iconStub;

// Icons used in src/apps/showcase/components/
export const PhTrash = iconStub;

// Icons used in src/apps/families/App.vue
export const PhSignOut = iconStub;
