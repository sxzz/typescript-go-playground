import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind3,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'nav-button':
      'flex items-center justify-center rounded-full p2 op50 hover:bg-gray hover:bg-opacity-10 hover:op100',
  },
  presets: [
    presetWind3({
      attributifyPseudo: true,
    }),
    presetIcons(),
    presetAttributify(),
  ],
  transformers: [transformerDirectives()],
})
