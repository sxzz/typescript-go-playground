import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [Vue(), UnoCSS()],
  build: {
    target: 'chrome119',
  },
  worker: {
    format: 'es',
  },
})
