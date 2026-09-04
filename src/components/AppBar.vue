<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import * as monaco from 'monaco-editor'
import { dark } from '../composables/dark'
import { cmd, defaultFiles, files } from '../composables/state'
import VersionPicker from './VersionPicker.vue'

const { copy, copied } = useClipboard({ copiedDuring: 2000 })

function share() {
  copy(location.href)
}

function reset() {
  if (
    // eslint-disable-next-line no-alert
    globalThis.confirm(
      'Reset every file and the command line back to their defaults?',
    )
  ) {
    monaco.editor.getModels().forEach((model) => {
      if (model.uri.authority === 'model') return
      model.dispose()
    })
    files.value = defaultFiles()
    cmd.value = ''
  }
}
</script>

<template>
  <header class="app-bar">
    <div class="wordmark">
      <div i-catppuccin:typescript-test shrink-0 text-xl />
      <h1 class="wordmark-text">
        <a
          class="wordmark-brand"
          href="https://github.com/microsoft/typescript-go"
          target="_blank"
          rel="noopener"
          title="microsoft/typescript-go"
        >
          <span text-ts>TypeScript</span> <span text-go>Go</span>
        </a>
        <span class="wordmark-kind"> Playground</span>
      </h1>
    </div>

    <div class="order-3 w-full md:order-2 md:mr-auto md:w-auto">
      <VersionPicker />
    </div>

    <nav class="actions">
      <button
        type="button"
        title="Copy link to this playground"
        bar-button
        @click="share"
      >
        <div
          :class="copied ? 'i-ri:check-line text-ok' : 'i-ri:link'"
          text-lg
        />
      </button>

      <button type="button" title="Reset to defaults" bar-button @click="reset">
        <div i-ri:refresh-line text-lg />
      </button>

      <button
        type="button"
        :title="dark ? 'Switch to light theme' : 'Switch to dark theme'"
        bar-button
        @click="dark = !dark"
      >
        <div dark:i-ri:moon-line i-ri:sun-line text-lg />
      </button>

      <a
        bar-button
        title="Source on GitHub"
        href="https://github.com/sxzz/typescript-go-playground"
        target="_blank"
        rel="noopener"
      >
        <div i-ri:github-fill text-lg />
      </a>

      <a
        class="sponsor"
        bar-button
        title="Sponsor Kevin Deng"
        href="https://github.com/sponsors/sxzz"
        target="_blank"
        rel="noopener"
      >
        <div i-ri:heart-3-line group-hover:i-ri:heart-3-fill text-lg />
      </a>
    </nav>
  </header>
</template>

<style scoped>
.app-bar {
  --at-apply: 'flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel px-3 py-2.5 md:px-4';
}

.wordmark {
  --at-apply: 'order-1 flex min-w-0 items-center gap-2 mr-auto md:mr-0';
}

.wordmark-text {
  --at-apply: 'm-0 truncate text-sm font-600 tracking-tight';
}

.wordmark-brand {
  --at-apply: 'underline-offset-3 hover:underline';
}

.wordmark-kind {
  --at-apply: 'hidden text-ink-2 sm:inline';
}

.actions {
  --at-apply: 'order-2 flex shrink-0 items-center gap-0.5 md:order-3';
}

.sponsor {
  --at-apply: 'group text-heart hover:bg-heart/10 hover:text-heart';
}
</style>
