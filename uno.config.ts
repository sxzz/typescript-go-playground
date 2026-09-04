import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind3,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      field: 'var(--c-field)',
      panel: 'var(--c-panel)',
      'panel-alt': 'var(--c-panel-alt)',
      line: 'var(--c-line)',
      'line-soft': 'var(--c-line-soft)',
      fill: 'var(--c-fill)',
      'fill-strong': 'var(--c-fill-strong)',
      ink: {
        DEFAULT: 'var(--c-ink)',
        2: 'var(--c-ink-2)',
        3: 'var(--c-ink-3)',
      },
      ts: 'var(--c-ts)',
      go: 'var(--c-go)',
      alert: 'var(--c-alert)',
      ok: 'var(--c-ok)',
      heart: '#ec4899',
    },
    fontFamily: {
      mono: 'var(--font-mono)',
    },
  },
  shortcuts: {
    'bar-button':
      'inline-flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors duration-150 hover:bg-fill hover:text-ink',
    panel:
      'flex flex-col min-h-0 min-w-0 overflow-hidden border border-line rounded-xl bg-panel',
    'panel-head':
      'flex items-center gap-1 shrink-0 border-b border-line-soft pl-1 pr-2',
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
