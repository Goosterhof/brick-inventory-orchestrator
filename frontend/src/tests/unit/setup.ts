import {config} from '@vue/test-utils';

config.global.renderStubDefaultSlot = true;

// happy-dom does not define HTMLMediaElement readyState constants.
// These are required by components that check video.readyState (e.g. CameraCapture).
// The cast to unknown is necessary because TypeScript's DOM types declare HAVE_METADATA
// as `number`, but happy-dom leaves it undefined at runtime.
if (typeof HTMLMediaElement !== 'undefined' && (HTMLMediaElement.HAVE_METADATA as unknown) === undefined) {
    Object.defineProperty(HTMLMediaElement, 'HAVE_NOTHING', {value: 0});
    Object.defineProperty(HTMLMediaElement, 'HAVE_METADATA', {value: 1});
    Object.defineProperty(HTMLMediaElement, 'HAVE_CURRENT_DATA', {value: 2});
    Object.defineProperty(HTMLMediaElement, 'HAVE_FUTURE_DATA', {value: 3});
    Object.defineProperty(HTMLMediaElement, 'HAVE_ENOUGH_DATA', {value: 4});
}
