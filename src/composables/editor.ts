import { dark } from './dark'
import { THEME_DARK, THEME_LIGHT } from './theme'
import type * as monaco from 'monaco-editor'

export function getSharedMonacoOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    automaticLayout: true,
    theme: dark.value ? THEME_DARK : THEME_LIGHT,
    fontFamily:
      '"Cascadia Code", "Jetbrains Mono", "Fira Code", "IBM Plex Mono", "Menlo", "Consolas", monospace',
    tabSize: 2,
    padding: { top: 12, bottom: 12 },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    renderLineHighlight: 'line',
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    guides: { indentation: true },
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
      useShadows: false,
    },
    minimap: {
      enabled: false,
    },
  }
}
