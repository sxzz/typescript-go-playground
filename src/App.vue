<script setup lang="ts">
import { useClipboard, watchDebounced } from '@vueuse/core'
import AnsiRegex from 'ansi-regex'
import { createBirpc } from 'birpc'
import { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import { computed, onBeforeUnmount, toRaw, useTemplateRef } from 'vue'
import NavBar from './components/NavBar.vue'
import PageFooter from './components/PageFooter.vue'
import Tabs from './components/Tabs.vue'
import { dark } from './composables/dark'
import { useEditor } from './composables/editor'
import { shiki, themeDark, themeLight } from './composables/shiki'
import {
  active,
  compilerVersion,
  compiling,
  error,
  files,
  loading,
  outputActive,
  outputFiles,
  tabs,
  timeCost,
} from './composables/state'
import Worker from './worker?worker'
import type { WorkerFunctions } from './worker'

const ansiRegex = AnsiRegex()

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
  try {
    const tsconfig = JSON.parse(value)
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
      tsconfig.compilerOptions,
    )
  } catch {}
})
const editorRef = useTemplateRef('editorRef')

const model = computed(() =>
  active.value === 'main.ts' ? tsModel : tsconfigModel,
)

useEditor(model, editorRef, dark)

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
  const result = await rpc.compile(toRaw(files))
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
    theme: dark.value ? themeDark.name! : themeLight.name!,
  })
}

watchDebounced(files, () => compile(), {
  debounce: 200,
  deep: true,
})

const { copy, copied } = useClipboard()
function handleCopy() {
  copy(outputFiles.value[outputActive.value])
}

onBeforeUnmount(() => {
  tsModel.dispose()
  tsconfigModel.dispose()
})

async function loadVersion() {
  const pkg = await fetch(
    'https://cdn.jsdelivr.net/npm/tsgo-wasm@latest/package.json',
  ).then((r) => r.json())
  compilerVersion.value = (pkg.version as string).replace('0.0.0-', '')
}
loadVersion()
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

    <div
      flex="~ col"
      gap2
      py12
      transition-all
      :class="loading && 'animate-pulse translate-y-35dvh'"
    >
      <h1 flex="~ wrap" items-center gap2 text-3xl font-bold>
        <div i-catppuccin:typescript-test />
        <a
          href="https://github.com/microsoft/typescript-go"
          target="_blank"
          class="text-#8aadf4"
          >TypeScript Go</a
        >
        Playground
      </h1>
      <div v-if="!loading && compilerVersion" self-end text-xs font-mono op70>
        compiler v{{ compilerVersion }}
      </div>
    </div>

    <div
      :class="loading && 'op0 invisible'"
      min-h-0
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
        <div min-h-0 min-w-0 flex-1>
          <div ref="editorRef" h-full w-full border />
        </div>
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

        <Tabs
          v-else
          v-model="outputActive"
          :tabs="Object.keys(outputFiles)"
          h-full
          w-full
        >
          <template #default="{ value }">
            <div group relative h-full w-full>
              <div class="output" v-html="highlight(outputFiles[value])" />
              <button
                absolute
                right-4
                top-4
                rounded-lg
                p2
                op0
                transition-opacity
                hover:bg-gray
                hover:bg-opacity-10
                group-hover:opacity-100
                @click="handleCopy"
              >
                <div
                  :class="
                    copied
                      ? 'i-ri:check-line text-green'
                      : 'i-ri:file-copy-line'
                  "
                />
              </button>
            </div>
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

    <PageFooter />
  </div>
</template>

<style>
.output {
  --at-apply: dark-bg-#1E1E1E w-full h-full overflow-scroll whitespace-pre
    border rounded-lg p2 text-sm font-mono;
}
</style>
