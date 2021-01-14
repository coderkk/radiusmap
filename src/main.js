import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import './index.css'

const app=createApp(App);
app.use(router);
// app.use(Buefy);
app.mount('#app');
