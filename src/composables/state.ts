import { computed, ref, watchEffect } from 'vue'
import { atou, utoa } from './url'

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

export const outputFiles = ref(Object.create(null))
export const outputActive = ref('main.js')

export const compiling = ref(false)
export const timeCost = ref(0)
export const error = ref<string>()
export const loading = ref(true)

export const compilerVersion = ref<string>()

const LAST_STATE_KEY = 'tsgo:state'
const serializedUrl = atou(location.hash!.slice(1))
let state = serializedUrl && JSON.parse(serializedUrl)
if (!state) {
  const serialized = localStorage.getItem(LAST_STATE_KEY)
  if (serialized) state = JSON.parse(serialized)
}
if (state) files.value = state.f

// serialize state to url
watchEffect(() => {
  const serialized = JSON.stringify({
    f: files.value,
  })
  location.hash = utoa(serialized)
  localStorage.setItem(LAST_STATE_KEY, serialized)
})
