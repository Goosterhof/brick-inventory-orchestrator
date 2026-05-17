import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import '@shared/assets/icons.css';
import '@shared/assets/accessibility.css';
import {createApp} from 'vue';

import App from './App.vue';
import {adminRouterService} from './router';

const app = createApp(App);

app.provide('weight', 'bold');
app.provide('size', '1.25em');
app.provide('color', 'currentColor');

adminRouterService.install();

app.mount('#app');
