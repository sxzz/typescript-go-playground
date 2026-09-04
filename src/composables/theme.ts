import * as monaco from 'monaco-editor'

/**
 * Monaco can't read CSS custom properties, so the editor surface colors are
 * mirrored here. Keep them in step with `--c-panel` / `--c-ink-*` in global.css
 * — the editor has to sit flush inside its panel with no visible seam.
 */
const LIGHT = {
  panel: '#ffffff',
  line: '#e5eaf1',
  ink3: '#8695a5',
  ink: '#0d141c',
  highlight: '#f6f8fb',
}

const DARK = {
  panel: '#141a22',
  line: '#1b232c',
  ink3: '#5e6c7b',
  ink: '#e4ebf2',
  highlight: '#181f29',
}

function surface(c: typeof LIGHT): monaco.editor.IColors {
  return {
    'editor.background': c.panel,
    'editorGutter.background': c.panel,
    'editorLineNumber.foreground': c.ink3,
    'editorLineNumber.activeForeground': c.ink,
    'editor.lineHighlightBackground': c.highlight,
    'editor.lineHighlightBorder': '#00000000',
    'editorIndentGuide.background1': c.line,
    'editorIndentGuide.activeBackground1': c.ink3,
    'editorWidget.background': c.panel,
    'editorWidget.border': c.line,
    'editorSuggestWidget.background': c.panel,
    'editorSuggestWidget.border': c.line,
    'editorHoverWidget.background': c.panel,
    'editorHoverWidget.border': c.line,
    'editorOverviewRuler.border': '#00000000',
    'scrollbar.shadow': '#00000000',
  }
}

export const THEME_LIGHT = 'tsgo-light'
export const THEME_DARK = 'tsgo-dark'

export function defineEditorThemes(): void {
  monaco.editor.defineTheme(THEME_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: surface(LIGHT),
  })
  monaco.editor.defineTheme(THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: surface(DARK),
  })
}
