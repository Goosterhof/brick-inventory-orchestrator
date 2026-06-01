import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import '@shared/assets/icons.css';
import '@shared/assets/accessibility.css';
import '@shared/assets/dialog.css';
import {createApp} from 'vue';

import App from './App.vue';
import {showcaseRouterService} from './router';

const app = createApp(App);

app.provide('weight', 'bold');
app.provide('size', '1.25em');
app.provide('color', 'currentColor');

showcaseRouterService.install();

app.mount('#app');
