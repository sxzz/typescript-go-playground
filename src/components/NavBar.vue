<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { dark } from '../composables/dark'
import { cmd, defaultFiles, files } from '../composables/state'

function reset() {
  if (
    // eslint-disable-next-line no-alert
    window.confirm(
      'Are you sure you want to reset all files and commands to their default values?',
    )
  ) {
    monaco!.editor.getModels().forEach((model) => {
      if (model.uri.authority === 'model') return
      model.dispose()
    })
    files.value = defaultFiles()
    cmd.value = ''
  }
}
</script>

<template>
  <div flex self-end gap1 border rounded-full>
    <button title="Start Over" nav-button @click="reset">
      <div i-ri:refresh-line text-2xl />
    </button>

    <button nav-button @click="dark = !dark">
      <div dark:i-ri:moon-line i-ri:sun-line text-2xl />
    </button>

    <a
      nav-button
      href="https://github.com/sxzz/typescript-go-playground"
      target="_blank"
      rel="noopener"
    >
      <div i-ri:github-fill text-2xl />
    </a>

    <a
      href="https://github.com/sponsors/sxzz"
      target="_blank"
      flex="~ center"
      title="Sponsor"
      rel="noopener"
      group
      nav-button
    >
      <div
        i-ri:heart-3-line
        group-hover:i-ri:heart-3-fill
        text-2xl
        text-pink-400
        group-hover:text-pink-400
      />
    </a>
  </div>
</template>
