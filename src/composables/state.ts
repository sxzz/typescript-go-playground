import { computed, ref, watchEffect } from 'vue'
import { atou, utoa } from './url'

export const cmd = ref('tsc')
const DEFAULT_FILES = {
  'main.ts': `const x: number = 1`,
  'tsconfig.json': JSON.stringify(
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
  ),
}
export const files = ref<Record<string, string>>(DEFAULT_FILES)
export const tabs = computed(() => Object.keys(files.value))

export const active = ref('main.ts')

export const outputFiles = ref<Record<string, string | null>>({})
export const outputActive = ref('main.js')

export const compiling = ref(false)
export const timeCost = ref(0)
export const loading = ref(true)

export const compilerVersion = ref<string>()

const LAST_STATE_KEY = 'tsgo:state'
const serializedUrl = atou(location.hash!.slice(1))
let state = serializedUrl && JSON.parse(serializedUrl)
if (!state) {
  const serialized = localStorage.getItem(LAST_STATE_KEY)
  if (serialized) state = JSON.parse(serialized)
}
if (state) {
  cmd.value = state.c || ''
  files.value = state.f || DEFAULT_FILES
}

export const serialized = computed(() =>
  JSON.stringify({ f: files.value, c: cmd.value }),
)

// serialize state to url
watchEffect(() => {
  location.hash = utoa(serialized.value)
  localStorage.setItem(LAST_STATE_KEY, serialized.value)
})
