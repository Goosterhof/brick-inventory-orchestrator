# Decision: Istanbul coverage with zero ignore comments

**Date**: 2026-03-17 (revised 2026-03-18)
**Feature**: Test coverage infrastructure
**Status**: accepted
**Transferability**: universal
**Supersedes**: Previous ADR-005 (v-show for testable conditional rendering — deprecated, workaround no longer needed)

## Context

The project enforces 100% coverage on lines, functions, branches, and statements. Vue's compiler transforms template directives like `v-if="foo"` into ternary expressions in the render function: `foo ? _createVNode(...) : _createCommentVNode("")`. Neither coverage engine sees the original `<template>` source — both operate on this compiled JavaScript output.

With V8 coverage (`@vitest/coverage-v8`), branch tracking relies on runtime byte-range data remapped to source locations via source maps. Vue's compiler hoists static elements to module scope and shifts byte offsets in ways that break this remapping. The result: false positives (hoisted code reported as covered when it wasn't exercised) and false negatives (unmapped branches silently dropped from reports). Multiple issues remain open as of March 2026. This meant our 100% branch coverage number was unreliable — it could be lying in both directions.

The previous workaround (ADR-005, now deprecated) used `v-show` instead of `v-if` to avoid generating branches that V8 couldn't track. This solved the symptom but misused `v-show` — a rendering performance tool — as a coverage workaround, and forced semantic compromises in templates.

## Options Considered

| Option                                              | Pros                                                                                                                                                                           | Cons                                                                                                                                     | Why eliminated / Why chosen                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **V8 coverage** (`@vitest/coverage-v8`)             | Faster, lower memory, no instrumentation overhead, ships as Vitest default                                                                                                     | Known false positives and false negatives for Vue SFC branches due to source map remapping bugs. 100% branch coverage becomes unreliable | Eliminated — an unreliable coverage number is worse than no coverage number |
| **Istanbul coverage** (`@vitest/coverage-istanbul`) | Injects explicit counter statements into compiled JS — counters are physically in the code, not dependent on source map remapping. More mechanically reliable branch detection | Slower execution, higher memory usage due to instrumentation overhead. Still instruments compiled output, not original templates         | **Chosen** — reliable branch detection is worth the performance cost        |
| **Custom coverage provider**                        | Vitest supports custom providers via config                                                                                                                                    | No viable third-party options exist as of March 2026                                                                                     | Eliminated — nothing to evaluate                                            |
| **v-show workaround** (previous ADR-005)            | Avoids generating untestable branches                                                                                                                                          | Misuses v-show semantics, forces template compromises, doesn't fix the root cause                                                        | Eliminated — treats the symptom, not the disease                            |

## Decision

Use Istanbul (`@vitest/coverage-istanbul`) as the coverage provider. Istanbul injects explicit branch counters into the compiled JavaScript, making branch detection mechanically reliable regardless of source map accuracy. The counters are _in_ the code, so they track actual runtime execution of each branch without depending on post-hoc byte-range remapping.

This eliminates the need for the `v-show` workaround. Use `v-if` and `v-show` based on their intended semantics: `v-if` for conditional rendering (element not in DOM), `v-show` for toggling visibility of frequently switching elements (element stays in DOM, CSS `display: none`).

### No coverage ignore comments

Coverage ignore comments (`/* istanbul ignore next */`, `/* v8 ignore */`) are **forbidden**. They create a culture problem at scale: developers copy the pattern for genuinely buggy code, and nobody can tell whether ignored code is dead or silently executing in production. Every line of code must be either tested or removed.

When code appears untestable, the problem is the code, not the coverage tool. Apply these patterns in order:

**1. Lifecycle-aware async: `isUnmounted` flag**

When an async operation (e.g., `getUserMedia`) crosses an `await` boundary, the component may unmount before the promise settles. Instead of checking if a template ref is null (a proxy for "did we unmount?"), check an explicit `isUnmounted` flag — it's testable and states the actual condition.

```ts
let isUnmounted = false;

onUnmounted(() => {
    isUnmounted = true;
    stopCamera();
});

const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({...});

    if (isUnmounted) {
        // Clean up the acquired resource — component is gone
        for (const track of mediaStream.getTracks()) {
            track.stop();
        }
        return;
    }

    // Safe to use refs — component is still mounted
    const video = ensureRefValueExists(videoRef);
    video.srcObject = mediaStream;
};
```

Test by mounting, then unmounting before the promise resolves:

```ts
it('should clean up stream when component unmounts during getUserMedia', async () => {
    let resolve;
    mockGetUserMedia.mockReturnValue(
        new Promise((r) => {
            resolve = r;
        }),
    );
    const wrapper = shallowMount(Component);
    wrapper.unmount();
    resolve(mockStream);
    await flushPromises();
    expect(mockTrack.stop).toHaveBeenCalled();
});
```

**2. Type narrowing: `ensureRefValueExists` helper**

When TypeScript requires a null check on a template ref but the runtime condition is guaranteed by prior logic (e.g., `isCameraActive` being true guarantees refs exist), use `ensureRefValueExists` from `@shared/helpers/type-check`. It takes a `Ref<T | undefined | null>`, returns `T` if the value exists, and throws a `MissingRefValueError` if it doesn't. Its throw path is covered in the helper's own test file — components get 100% coverage on the non-throw path.

```ts
const video = ensureRefValueExists(videoRef);
```

The function is deliberately scoped to Vue refs — not a generic assertion. This prevents misuse on arbitrary values and makes the intent clear: "I expect this ref to have a value at this point in the lifecycle."

**3. Dead code removal**

If a guard is structurally unreachable (e.g., a click handler protected by `:disabled`, a method sealed by `<script setup>`), remove it. Dead code is not "defensive" — it's a lie that erodes trust in the coverage report.

### What Istanbul does NOT solve

Istanbul still instruments the _compiled_ render function, not the original template. Compiler-generated branches that don't correspond to user-written logic may appear as uncovered. This is a known limitation of all JavaScript coverage tools operating on Vue SFCs.

**The rule still holds: no ignore comments.** If a phantom branch causes a coverage gap, escalate it as a Vitest or Vue compiler issue rather than papering over it with an ignore directive. Ignore comments are the slippery slope — once one exists, juniors copy the pattern for real code. The cost of chasing a phantom branch is a one-time annoyance; the cost of a culture of ignore comments compounds forever.

## Consequences

- **Reliable 100% branch coverage**: The metric means what it says. No silent false positives or negatives from V8 remapping bugs
- **Zero ignore comments on developer-written code**: No culture of hiding hard-to-test code behind ignore directives
- **Semantic templates**: `v-if` and `v-show` are used for their intended purposes, not as coverage workarounds
- **Testable async lifecycle**: `isUnmounted` pattern makes unmount-during-await a first-class tested scenario, not a silently ignored edge case
- **Performance cost**: Test suite runs slower due to instrumentation overhead. Acceptable trade-off for a project of this size
- **Dependency**: Adds `@vitest/coverage-istanbul` (and its Babel instrumentation dependency) to devDependencies
