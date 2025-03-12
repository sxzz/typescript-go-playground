import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind3,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'nav-button':
      'flex items-center justify-center rounded-full p2 op50 hover:bg-gray hover:bg-opacity-20 hover:op100',
  },
  presets: [presetWind3(), presetIcons(), presetAttributify()],
})
