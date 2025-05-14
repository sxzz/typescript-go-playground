import { dark } from './dark'
import type * as monaco from 'monaco-editor'

export function getSharedMonacoOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    automaticLayout: true,
    theme: dark.value ? 'vs-dark' : 'vs-light',
    fontFamily:
      '"Cascadia Code", "Jetbrains Mono", "Fira Code", "Menlo", "Consolas", monospace',
    tabSize: 2,
    minimap: {
      enabled: false,
    },
  }
}
