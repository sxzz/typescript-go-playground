<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import AnsiRegex from 'ansi-regex'
import { createBirpc } from 'birpc'
import vitesseDark from 'shiki/themes/vitesse-dark.mjs'
import vitesseLight from 'shiki/themes/vitesse-light.mjs'
import { computed, reactive, ref } from 'vue'
import NavBar from './components/NavBar.vue'
import Tabs from './components/Tabs.vue'
import { dark } from './composables/dark'
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

const outputFiles = ref(Object.create(null))
const compiling = ref(false)
const timeCost = ref(0)
const error = ref<string>()
const loading = ref(true)

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

function highlight(code: string) {
  return shiki.codeToHtml(code.replace(ansiRegex, ''), {
    lang: 'js',
    theme: dark.value ? vitesseDark.name! : vitesseLight.name!,
  })
}

watchDebounced(files, () => compile(), {
  debounce: 200,
  deep: true,
})
</script>

<template>
  <div
    flex="~ col"
    :class="!loading && 'overflow-y-scroll'"
    relative
    h-100dvh
    items-center
    px10
    pb10
    pt4
  >
    <NavBar absolute />
    <h1
      flex="~ wrap"
      items-center
      gap2
      py15
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
      flex="~ col"
      w-full
      items-center
      gap4
      transition-opacity
      duration-500
    >
      <Tabs v-model="active" :tabs max-w-200 w-full>
        <template #default="{ value }">
          <textarea
            v-model="files[value]"
            h-80
            w-full
            border
            rounded-lg
            p2
            text-sm
            font-mono
          />
        </template>
      </Tabs>

      <div flex="~ col" max-w-200 w-full items-center gap2>
        Output

        <div min-h-80 w-full>
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
          <div v-else-if="error" text-red class="output" v-text="error" />
          <Tabs v-else :tabs="Object.keys(outputFiles)" h-full>
            <template #default="{ value }">
              <div class="output" v-html="highlight(outputFiles[value])" />
            </template>
          </Tabs>
        </div>
        <div self-end op70 :class="[timeCost && !compiling ? '' : 'invisible']">
          {{ Math.round(timeCost) }} ms
        </div>
      </div>
    </div>

    <div flex="~" mt10 items-center gap="1.2" text-hex-888e>
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
  --at-apply: dark-bg-#121212 h-full overflow-scroll whitespace-pre border
    rounded-lg p2 text-sm font-mono;
}
</style>
