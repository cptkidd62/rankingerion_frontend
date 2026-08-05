import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import { useAuthStore } from './stores/auth.ts'

const pinia = createPinia()
const app = createApp(App)

app.use(router)

app.use(pinia)
app.mount('#app')

axios.interceptors.response.use(
  response => response,
  async error => {
    const authStore = useAuthStore();

    if (
      error.response?.status === 401 &&
      authStore.token !== null
    ) {
      await authStore.logout();
      return;
    }

    return Promise.reject(error);
  },
);
