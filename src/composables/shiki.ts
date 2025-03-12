import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import js from 'shiki/langs/js.mjs'
import vitesseDark from 'shiki/themes/vitesse-dark.mjs'
import vitesseLight from 'shiki/themes/vitesse-light.mjs'

export const shiki = createHighlighterCoreSync({
  themes: [vitesseLight, vitesseDark],
  langs: [js],
  engine: createJavaScriptRegexEngine(),
})
