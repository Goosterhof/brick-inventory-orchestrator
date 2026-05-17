/**
 * Integration test setup.
 *
 * Minimal setup for page integration tests. Unlike unit test setup, this does
 * NOT configure renderStubDefaultSlot (we mount real components, not stubs).
 *
 * happy-dom polyfills needed by real shared components are registered here.
 */

// happy-dom does not implement HTMLDialogElement.showModal / close.
// ConfirmDialog -> ModalDialog uses these. Stub them so mounting doesn't throw.
if (typeof HTMLDialogElement !== 'undefined') {
    const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
    proto.showModal ??= function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
    };
    proto.close ??= function (this: HTMLDialogElement) {
        this.removeAttribute('open');
    };
}

// happy-dom does not define HTMLMediaElement readyState constants.
// CameraCapture and BarcodeScanner check video.readyState.
if (typeof HTMLMediaElement !== 'undefined' && (HTMLMediaElement.HAVE_METADATA as unknown) === undefined) {
    Object.defineProperty(HTMLMediaElement, 'HAVE_NOTHING', {value: 0});
    Object.defineProperty(HTMLMediaElement, 'HAVE_METADATA', {value: 1});
    Object.defineProperty(HTMLMediaElement, 'HAVE_CURRENT_DATA', {value: 2});
    Object.defineProperty(HTMLMediaElement, 'HAVE_FUTURE_DATA', {value: 3});
    Object.defineProperty(HTMLMediaElement, 'HAVE_ENOUGH_DATA', {value: 4});
}
