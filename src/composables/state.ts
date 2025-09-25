import { refDebounced, useFetch } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'
import { useSourceFile, type SourceFileMap } from './source-file'
import { atou, utoa } from './url'

const DEFAULT_TSCONFIG = {
  compilerOptions: {
    target: 'esnext',
    module: 'esnext',
    strict: true,
    esModuleInterop: true,
    outDir: 'dist',
    declaration: true,
  },
}
export const defaultFiles = (): SourceFileMap =>
  new Map([
    ['main.ts', useSourceFile('main.ts', `const x: number = 1`)],
    [
      'tsconfig.json',
      useSourceFile(
        'tsconfig.json',
        JSON.stringify(DEFAULT_TSCONFIG, undefined, 2),
      ),
    ],
  ])

export const cmd = ref('')
export const files = ref<SourceFileMap>(defaultFiles())
export const tabs = computed(() => Array.from(files.value.keys()))
export const activeFile = ref<string>('main.ts')

export const outputFiles = ref<Record<string, string | null>>({})
export const outputActive = ref<string | undefined>('main.jsx')

export const currentVersion = ref('latest')
export const { data: currentManifest, isFetching: isFetchingManifest } =
  useFetch(
    () => `https://registry.npmjs.org/tsgo-wasm/${currentVersion.value}`,
    {
      immediate: true,
      refetch: true,
      beforeFetch(ctx) {
        ctx.options.cache =
          currentVersion.value === 'latest' ? 'no-store' : 'force-cache'
        return ctx
      },
    },
  ).json<Record<string, any>>()

export const compiling = ref(false)
export const timeCost = ref(0)
export const loadingWasm = ref(false)
export const firstWasmLoaded = ref(false)

export const loading = computed(
  () => isFetchingManifest.value || loadingWasm.value || !firstWasmLoaded.value,
)
export const loadingDebounced = refDebounced(loading, 100)

export const compilerSha = computed(
  () => currentManifest.value?.buildInfo.commit as string,
)

export function filesToObject() {
  return Array.from(files.value.values()).map((file) => [
    file.filename,
    file.code,
  ])
}

const LAST_STATE_KEY = 'tsgo:state'
const serializedUrl = atou(location.hash!.slice(1))
let state = serializedUrl && JSON.parse(serializedUrl)
if (!state) {
  const serialized = localStorage.getItem(LAST_STATE_KEY)
  if (serialized) state = JSON.parse(serialized)
}
if (state) {
  try {
    cmd.value = state.c || ''
    files.value = new Map(
      ((state?.f || []) as [string, string][]).map(([filename, code]) => [
        filename,
        useSourceFile(filename, code),
      ]),
    )
    if (files.value.size === 0) {
      files.value = new Map(defaultFiles())
    }
    currentVersion.value = state.v || 'latest'
  } catch {}
}

export const serialized = computed(() =>
  JSON.stringify({
    f: filesToObject(),
    c: cmd.value,
    v: currentVersion.value,
  }),
)

// serialize state to url
watchEffect(() => {
  location.hash = utoa(serialized.value)
  localStorage.setItem(LAST_STATE_KEY, serialized.value)
})
