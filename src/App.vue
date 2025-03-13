<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import AnsiRegex from 'ansi-regex'
import { createBirpc } from 'birpc'
import { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import vitesseDark from 'shiki/themes/vitesse-dark.mjs'
import vitesseLight from 'shiki/themes/vitesse-light.mjs'
import { computed, reactive, ref } from 'vue'
import NavBar from './components/NavBar.vue'
import Tabs from './components/Tabs.vue'
import { dark } from './composables/dark'
import { useEditor } from './composables/editor'
import { shiki } from './composables/shiki'
import Worker from './worker?worker'
import type { WorkerFunctions } from './worker'

const ansiRegex = AnsiRegex()

const files = reactive(Object.create(null))
const tabs = computed(() => Object.keys(files))

files['main.ts'] = `const x: number = 1`
files['tsconfig.json'] = JSON.stringify(
  {
    compilerOptions: {
      target: 'esnext',
      module: 'esnext',
      strict: true,
      esModuleInterop: true,
      outDir: 'dist',
    },
  },
  undefined,
  2,
)
const active = ref('main.ts')

const tsModel = editor.createModel(
  files['main.ts'],
  'typescript',
  monaco.Uri.parse('inmemory://model/main.ts'),
)
tsModel.onDidChangeContent(() => {
  files['main.ts'] = tsModel.getValue()
})
const tsconfigModel = editor.createModel(
  files['tsconfig.json'],
  'json',
  monaco.Uri.parse('inmemory:///model/tsconfig.json'),
)
tsconfigModel.onDidChangeContent(() => {
  const value = tsconfigModel.getValue()
  files['tsconfig.json'] = value
  const tsconfig = JSON.parse(value)
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    tsconfig.compilerOptions,
  )
})

const outputFiles = ref(Object.create(null))
const compiling = ref(false)
const timeCost = ref(0)
const error = ref<string>()
const loading = ref(true)
const editorRef = ref<HTMLElement>()

const worker = new Worker()
const uiFunctions = {
  ready() {
    loading.value = false
    compile()
  },
}
export type UIFunctions = typeof uiFunctions
const rpc = createBirpc<WorkerFunctions, UIFunctions>(uiFunctions, {
  post: (data) => worker.postMessage(data),
  on: (fn) => worker.addEventListener('message', ({ data }) => fn(data)),
})

async function compile() {
  if (loading.value || compiling.value) return

  const currentFiles = JSON.stringify(files)
  compiling.value = true
  const result = await rpc.compile(currentFiles)
  compiling.value = false

  error.value = result.error
  outputFiles.value = result.output
  timeCost.value = result.time

  if (currentFiles !== JSON.stringify(files)) {
    compile()
  }
}

function highlight(code?: string) {
  if (!code) return ''
  return shiki.codeToHtml(code.replace(ansiRegex, ''), {
    lang: 'js',
    theme: dark.value ? vitesseDark.name! : vitesseLight.name!,
  })
}

const model = computed(() =>
  active.value === 'main.ts' ? tsModel : tsconfigModel,
)

useEditor(model, editorRef, dark)

watchDebounced(files, () => compile(), {
  debounce: 200,
  deep: true,
})
</script>

<template>
  <div
    flex="~ col"
    relative
    h-100dvh
    items-center
    px10
    pt4
    :class="!loading && 'overflow-y-scroll'"
  >
    <NavBar absolute />

    <h1
      flex="~ wrap"
      items-center
      gap2
      py12
      text-3xl
      font-bold
      transition-all
      :class="loading && 'animate-pulse translate-y-35dvh'"
    >
      <div i-catppuccin:typescript-test />
      <a
        href="https://github.com/microsoft/typescript-go"
        target="_blank"
        class="text-#8aadf4"
        >TypeScript Go</a
      >
      Playground
    </h1>

    <div
      :class="loading && 'op0 invisible'"
      w-full
      flex
      flex-1
      flex-col
      items-center
      gap4
      transition-opacity
      duration-500
      md:flex-row
    >
      <Tabs v-model="active" :tabs h-full min-w-0 w-full flex-1>
        <div ref="editorRef" h-full border rounded-lg p2 text-sm font-mono />
      </Tabs>

      <div flex="~ col" h-full min-w-0 w-full flex-1 items-center gap2>
        <div
          v-if="compiling"
          flex="~ col"
          h-full
          w-full
          items-center
          justify-center
          gap3
        >
          <div i-logos:typescript-icon-round animate-bounce text-6xl />
          Compiling...
        </div>

        <div
          v-else-if="error"
          text-red
          class="output"
          mt="12.5"
          v-text="error.replace(ansiRegex, '')"
        />

        <Tabs v-else :tabs="Object.keys(outputFiles)" h-full w-full>
          <template #default="{ value }">
            <div class="output" v-html="highlight(outputFiles[value])" />
          </template>
        </Tabs>

        <div
          v-if="!compiling"
          self-end
          op70
          :class="[timeCost && !compiling ? '' : 'invisible']"
        >
          {{ Math.round(timeCost) }} ms
        </div>
      </div>
    </div>

    <div flex="~" gap="1.2" mb6 mt4 items-center text-hex-888e>
      Made with
      <div i-ri:heart-3-line text-pink />
      by
      <a
        href="https://github.com/sxzz"
        target="_blank"
        rel="noopener"
        hover="underline"
      >
        Kevin Deng
      </a>

      <a
        href="https://github.com/sxzz/typescript-go-playground"
        target="_blank"
        rel="noopener"
        op50
        hover:op100
      >
        <div i-ri-github-fill text-lg
      /></a>
    </div>
  </div>
</template>

<style>
.output {
  --at-apply: dark-bg-#121212 w-full h-full overflow-scroll whitespace-pre
    border rounded-lg p2 text-sm font-mono;
}
</style>
