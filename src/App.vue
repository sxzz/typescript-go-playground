<script setup lang="ts">
import { useDark, watchDebounced } from '@vueuse/core'
import AnsiRegex from 'ansi-regex'
import { createBirpc } from 'birpc'
import { ref } from 'vue'
import Worker from './worker?worker'
import type { WorkerFunctions } from './worker'

const ansiRegex = AnsiRegex()

useDark()

const code = ref(`const x: number = 1`.trim())
const tsconfig = ref(
  JSON.stringify(
    {
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        strict: true,
        esModuleInterop: true,
      },
    },
    undefined,
    2,
  ),
)
const output = ref('')
const compiling = ref(false)
const timeCost = ref(0)
const error = ref(false)
const loading = ref(true)

const worker = new Worker()
const uiFunctions = {
  ready() {
    setTimeout(() => {
      loading.value = false
    }, 1000)
  },
}
export type UIFunctions = typeof uiFunctions
const rpc = createBirpc<WorkerFunctions, UIFunctions>(uiFunctions, {
  post: (data) => worker.postMessage(data),
  on: (fn) => worker.addEventListener('message', ({ data }) => fn(data)),
})

async function compile() {
  if (compiling.value) return

  const currentCode = code.value
  compiling.value = true
  const result = await rpc.compile(code.value, tsconfig.value)
  compiling.value = false
  output.value = result.output.replace(ansiRegex, '')
  timeCost.value = result.time
  error.value = !!result.error

  if (currentCode !== code.value) {
    compile()
  }
}

watchDebounced([code, tsconfig], () => compile(), {
  immediate: true,
  debounce: 200,
})
</script>

<template>
  <div flex="~ col" items-center px10>
    <h1
      flex
      gap3
      py15
      text-3xl
      font-bold
      transition-all
      :class="loading && 'animate-pulse translate-y-40vh'"
    >
      <img src="/favicon.svg" />
      <a
        href="https://github.com/microsoft/typescript-go"
        target="_blank"
        class="text-#8aadf4"
        >TypeScript Go</a
      >
      Playground
    </h1>

    <div
      flex="~ col"
      :class="loading && 'op0 hidden'"
      w-full
      items-center
      gap4
      transition-opacity
      duration-500
    >
      <div h-80 w-full flex gap4>
        <label flex="~ col" flex-1 items-center gap2>
          <code op80>main.ts</code>
          <textarea
            v-model="code"
            h-full
            w-full
            border
            rounded-lg
            p2
            text-sm
            font-mono
          />
        </label>
        <label flex="~ col" flex-1 items-center gap2>
          <code op80>tsconfig.json</code>
          <textarea
            v-model="tsconfig"
            h-full
            w-full
            border
            rounded-lg
            p2
            text-sm
            font-mono
          />
        </label>
      </div>

      <div flex="~ col" w-50vw items-center gap2>
        Output

        <textarea
          :value="compiling ? 'Compiling...' : output"
          readonly
          min-h-80
          w-full
          border
          rounded-lg
          p2
          text-sm
          font-mono
          :class="error && !compiling && 'text-red'"
        />
        <div v-if="timeCost" self-end op70>{{ Math.round(timeCost) }} ms</div>
      </div>
    </div>
  </div>
</template>
