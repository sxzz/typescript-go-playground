import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [Vue(), UnoCSS()],
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'monaco-editor', test: /monaco-editor/ },
            { name: 'shiki', test: /shiki/ },
            { name: 'vue', test: /node_modules[\\/]@?vue[/\\]/ },
            { name: 'deps', test: /node_modules/ },
          ],
        },
      },
    },
  },
})
