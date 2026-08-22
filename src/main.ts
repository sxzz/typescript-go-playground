import { inject } from '@vercel/analytics'
import { createApp } from 'vue'
import App from './App.vue'
import './setup-monaco'
import '@unocss/reset/tailwind.css'
import 'uno.css'
import './global.css'

inject()

createApp(App).mount('#app')
