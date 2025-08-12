import { WasmFs } from '@wasmer/wasmfs'
import { tokenizeArgs } from 'args-tokenizer'
import { createBirpc } from 'birpc'
// @ts-expect-error
import { Go } from './wasm-exec.js'
import type { UIFunctions } from './App.vue'

const go = new Go()

const cache: Record<string, WebAssembly.Module> = {}

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
  output: Record<string, string | null>
  time: number
}

const PATH_STDERR = '/dev/stderr'

async function compile(
  cmd: string,
  files: Record<string, string>,
  currentVersion: string,
): Promise<CompileResult> {
  let wasmMod: WebAssembly.Module | undefined = cache[currentVersion]
  if (!wasmMod) {
    const wasmUrl = `https://cdn.jsdelivr.net/npm/tsgo-wasm@${currentVersion}/tsgo.wasm`
    const wasmBuffer = await fetch(wasmUrl).then((r) => r.arrayBuffer())
    wasmMod = await WebAssembly.compile(wasmBuffer)
    cache[currentVersion] = wasmMod
  }

  const wasmFs = new WasmFs()
  // @ts-expect-error
  globalThis.fs = wasmFs.fs
  wasmFs.volume.fromJSON(files, '/app')

  const { promise, resolve } = Promise.withResolvers<number>()
  const args = tokenizeArgs(cmd)
  const t = performance.now()

  go.exit = (code: number) => resolve(code)
  go.argv = ['js', ...args]

  const instance = await WebAssembly.instantiate(wasmMod, go.importObject)
  await go.run(instance)
  const code = await promise

  const time = performance.now() - t
  const stdout = ((await wasmFs.getStdOut()) as string).trim()
  let stderr = await wasmFs.fs.readFileSync(PATH_STDERR, 'utf8').trim()
  if (code !== 0) {
    stderr = `Exit code: ${code}\n\n${stderr}`.trim()
  }

  const output = {
    ...wasmFs.volume.toJSON('/app/dist', undefined, true),
  }
  if (stdout) output['<stdout>'] = stdout
  if (stderr) output['<stderr>'] = stderr

  return {
    output,
    time,
  }
}
