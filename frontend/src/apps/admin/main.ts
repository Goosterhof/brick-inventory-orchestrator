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

// fs-router 0.3.0 returns vue-router's navigation promise here, which rejects when a guard
// throws. 0.2.0's install() discarded it internally, so voiding it is the pre-bump
// behaviour, not a new swallow. WR-1455.
void adminRouterService.install();

app.mount('#app');
