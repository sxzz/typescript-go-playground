import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [Vue(), UnoCSS()],
  build: {
    rolldownOptions: {
      output: {
        inlineDynamicImports: true,
        advancedChunks: {
          groups: [
            { name: 'monaco-editor', test: /monaco-editor/ },
            { name: 'shiki', test: /shiki/ },
            { name: 'deps', test: /node_modules/ },
          ],
        },
      },
    },
  },
})
