import { WasmFs } from '@wasmer/wasmfs'
import { createBirpc } from 'birpc'

import type { UIFunctions } from './App.vue'

// @ts-expect-error
const { Go } = await import('./wasm-exec.js')
const go = new Go()

const wasmUrl = 'https://cdn.jsdelivr.net/npm/tsgo-wasm@latest/tsgo.wasm'
const wasmBuffer = await fetch(wasmUrl).then((r) => r.arrayBuffer())
const wasmMod = await WebAssembly.compile(wasmBuffer)

const workerFunctions = {
  compile,
}
export type WorkerFunctions = typeof workerFunctions
const rpc = createBirpc<UIFunctions, WorkerFunctions>(workerFunctions, {
  post: (data) => postMessage(data),
  on: (fn) => addEventListener('message', ({ data }) => fn(data)),
})

rpc.ready()

export interface CompileResult {
  output?: Record<string, string | null>
  error?: string
  time: number
}

const PATH_STDERR = '/dev/stderr'

async function compile(
  filesJSON: string,
  // dark: boolean,
): Promise<CompileResult> {
  const wasmFs = new WasmFs()
  // @ts-expect-error
  globalThis.fs = wasmFs.fs

  const files = JSON.parse(filesJSON)
  wasmFs.volume.fromJSON(files, '/app')

  const t = performance.now()

  const { promise, resolve } = Promise.withResolvers<number>()
  go.exit = (code: number) => resolve(code)
  go.argv = ['js', 'tsc']
  const instance = await WebAssembly.instantiate(wasmMod, go.importObject)
  await go.run(instance)
  const code = await promise

  const time = performance.now() - t
  const stdout = await wasmFs.getStdOut()
  const stderr = await wasmFs.fs.readFileSync(PATH_STDERR, 'utf8')

  if (stdout) console.info(`[stdout]:\n${await wasmFs.getStdOut()}`)
  if (stderr) console.info(`[stderr]:\n${stderr}`)

  if (code !== 0) {
    return {
      time,
      error: `Exit code: ${code}\n${stdout}\n\n${stderr}`,
    }
  }

  return {
    output: wasmFs.volume.toJSON('/app/dist', undefined, true),
    time,
  }
}
