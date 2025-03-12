<script setup lang="ts">
import { useDark, watchDebounced } from '@vueuse/core'
import { createBirpc } from 'birpc'
import { ref } from 'vue'
import Worker from './worker?worker'
import type { WorkerFunctions } from './worker'

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

const worker = new Worker()
const rpc = createBirpc<WorkerFunctions>(
  {},
  {
    post: (data) => worker.postMessage(data),
    on: (fn) => worker.addEventListener('message', ({ data }) => fn(data)),
  },
)

async function compile() {
  if (compiling.value) return

  const currentCode = code.value
  compiling.value = true
  const result = await rpc.compile(code.value, tsconfig.value)
  compiling.value = false
  output.value = result.output

  if (currentCode !== code.value) {
    compile()
  }
}

watchDebounced([code, tsconfig], () => compile(), {
  immediate: true,
  debounce: 300,
})
</script>

<template>
  <div flex="~ col" gap4 p4>
    <h1 text-3xl font-bold>TypeScript Go Playground</h1>
    <div flex gap4>
      <label flex="~ col" items-center gap2>
        <code op80>main.ts</code>
        <textarea
          v-model="code"
          h-80
          w-200
          border
          rounded-lg
          p2
          text-sm
          font-mono
        />
      </label>
      <label flex="~ col" items-center gap2>
        <code op80>tsconfig.json</code>
        <textarea
          v-model="tsconfig"
          h-80
          w-200
          border
          rounded-lg
          p2
          text-sm
          font-mono
        />
      </label>
    </div>

    <div flex="~ col" items-center gap2>
      output

      <textarea
        :value="compiling ? 'Compiling...' : output"
        readonly
        min-h-80
        w-50vw
        border
        rounded-lg
        p2
        text-sm
        font-mono
      />
    </div>
  </div>
</template>
