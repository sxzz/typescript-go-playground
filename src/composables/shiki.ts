import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import js from 'shiki/langs/js.mjs'
import darkPlus from 'shiki/themes/dark-plus.mjs'
import lightPlus from 'shiki/themes/light-plus.mjs'

export const shiki = createHighlighterCoreSync({
  themes: [lightPlus, darkPlus],
  langs: [js],
  engine: createJavaScriptRegexEngine(),
})
export { darkPlus as themeDark, lightPlus as themeLight }
