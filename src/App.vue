<script setup lang="ts">
import { useClipboard, watchDebounced } from '@vueuse/core'
import AnsiRegex from 'ansi-regex'
import { createBirpc } from 'birpc'
import CodeEditor from './components/CodeEditor.vue'
import NavBar from './components/NavBar.vue'
import PageFooter from './components/PageFooter.vue'
import Tabs from './components/Tabs.vue'
import { dark } from './composables/dark'
import { shiki, themeDark, themeLight } from './composables/shiki'
import { useSourceFile } from './composables/source-file'
import {
  activeFile,
  cmd,
  compilerSha,
  compiling,
  files,
  filesToObject,
  loading,
  outputActive,
  outputFiles,
  serialized,
  tabs,
  timeCost,
} from './composables/state'
import Worker from './worker?worker'
import type { WorkerFunctions } from './worker'

const ansiRegex = AnsiRegex()

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

watchDebounced([files, cmd], () => compile(), {
  debounce: 200,
  deep: true,
})

async function compile() {
  if (loading.value || compiling.value) return

  const current = serialized.value
  compiling.value = true
  const result = await rpc.compile(
    cmd.value,
    Object.fromEntries(filesToObject()),
  )
  compiling.value = false

  outputFiles.value = result.output
  timeCost.value = result.time
  outputActive.value = Object.keys(result.output)[0]

  if (current !== serialized.value) {
    compile()
  }
}

function highlight(code?: string | null) {
  if (!code) return ''
  return shiki.codeToHtml(code.replace(ansiRegex, ''), {
    lang: 'js',
    theme: dark.value ? themeDark.name! : themeLight.name!,
  })
}

const { copy, copied } = useClipboard()
function handleCopy() {
  if (!outputActive.value) return
  copy(outputFiles.value[outputActive.value] || '')
}

async function loadGitSha() {
  const pkg = await fetch(
    'https://cdn.jsdelivr.net/npm/tsgo-wasm/package.json',
  ).then((r) => r.json())
  compilerSha.value = pkg.buildInfo.commit as string
}
loadGitSha()

function addTab(name: string) {
  files.value.set(name, useSourceFile(name, ''))
}

function renameTab(oldName: string, newName: string) {
  files.value = new Map(
    Array.from(files.value.values()).map((file) => {
      if (file.filename === oldName) {
        file.rename(newName)
        return [newName, file]
      }
      return [file.filename, file]
    }),
  )
}

function removeTab(name: string) {
  files.value.get(name)?.dispose()
  files.value.delete(name)
}

function updateCode(name: string, code: string) {
  files.value.get(name)!.code = code
}
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
      <div v-if="loading" self-end text-sm op70>Loading WASM...</div>
      <div v-else-if="compilerSha" self-end text-xs font-mono op70>
        compiler
        <a
          :href="`https://github.com/microsoft/typescript-go/commit/${compilerSha}`"
          target="_blank"
          rel="noopener"
          hover:underline
        >
          @{{ compilerSha.slice(0, 7) }}
        </a>
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
      <div flex="~ col" h-full min-w-0 w-full flex-1 gap2>
        <Tabs
          v-model="activeFile"
          :tabs
          h-full
          min-h-0
          min-w-0
          w-full
          flex-1
          @add-tab="addTab"
          @rename-tab="renameTab"
          @remove-tab="removeTab"
        >
          <template #default="{ value }">
            <div min-h-0 min-w-0 flex-1>
              <CodeEditor
                :model-value="files.get(value)!.code"
                :model="files.get(value)!.model"
                :uri="files.get(value)!.uri"
                input
                h-full
                min-h-0
                w-full
                @update:model-value="updateCode(value, $event)"
              />
            </div>
          </template>
        </Tabs>
        <div flex items-center gap2 text-sm font-mono>
          <span>❯ tsgo</span>
          <input
            v-model="cmd"
            type="text"
            placeholder="command, e.g -v"
            flex-1
            border
            rounded
            p1
          />
        </div>
      </div>

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

        <Tabs
          v-else
          v-model="outputActive"
          :tabs="Object.keys(outputFiles)"
          readonly
          h-full
          min-h-0
          w-full
        >
          <div group relative h-full min-h-0 w-full>
            <template v-if="outputActive">
              <div
                v-if="outputActive.startsWith('<')"
                class="output"
                :class="{ 'text-red': outputActive === '<stderr>' }"
                v-text="outputFiles[outputActive]?.replace(ansiRegex, '')"
              />
              <div
                v-else
                class="output"
                v-html="highlight(outputFiles[outputActive])"
              />
            </template>
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
                  copied ? 'i-ri:check-line text-green' : 'i-ri:file-copy-line'
                "
              />
            </button>
          </div>
        </Tabs>

        <div v-if="timeCost && !compiling" self-end op70>
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
