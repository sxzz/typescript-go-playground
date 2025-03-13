import { computed, reactive, ref } from 'vue'

export const files = reactive(Object.create(null))
export const tabs = computed(() => Object.keys(files))

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
export const active = ref('main.ts')

export const outputFiles = ref(Object.create(null))
export const compiling = ref(false)
export const timeCost = ref(0)
export const error = ref<string>()
export const loading = ref(true)
