import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import '@shared/assets/icons.css';
import '@shared/assets/accessibility.css';
import '@shared/assets/dialog.css';
import '@shared/assets/theme.css';
import {registerFromQueryMiddleware} from '@shared/middleware/fromQuery';
import {registerAuthGuard} from '@shared/services/auth/guards';
import {createApp} from 'vue';

import App from './App.vue';
import {familyAuthService, familyRouterService, familyTranslationService} from './services';

const app = createApp(App);

app.provide('weight', 'bold');
app.provide('size', '1.25em');
app.provide('color', 'currentColor');

registerFromQueryMiddleware(familyRouterService);
registerAuthGuard(familyAuthService, familyRouterService, 'login', 'home');

// Restore the session before kicking off the initial navigation. install() pushes the
// current URL into the router, which fires the auth guard's beforeEach. If we install
// first, the guard reads isLoggedIn while userRef is still null and redirects every
// authOnly route to /login — the guard only runs on navigation, so once the /me call
// resolves the UI shows logged-in state but the route is stuck on /login.
await familyAuthService.checkIfLoggedIn();

familyRouterService.install();

const {t} = familyTranslationService;
const APP_TITLE = 'Brick Inventory';

familyRouterService.registerAfterRouteMiddleware((to) => {
    const titleKey = to.meta.title as string | undefined;
    document.title = titleKey ? `${t(titleKey as Parameters<typeof t>[0]).value} | ${APP_TITLE}` : APP_TITLE;
});

app.mount('#app');
