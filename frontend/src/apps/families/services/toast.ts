import {createToastService} from '@script-development/fs-toast';
import ToastMessage from '@shared/components/ToastMessage.vue';

/**
 * Family-app toast service. Single shared instance — `App.vue` mounts the
 * `ToastContainerComponent` so any page in the families app can call
 * `familyToastService.show({message, variant: 'success' | 'error'})`.
 *
 * The service manages a FIFO queue (max 4 visible toasts by default; oldest
 * evicted when a fifth is shown). Each toast renders the shared
 * `ToastMessage` component, which fires `close` to dismiss and is also wired
 * to the service's internal `onClose` so dismissals remove the toast from
 * the queue.
 */
export const familyToastService = createToastService(ToastMessage);
