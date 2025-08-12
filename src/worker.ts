import { WasmFs } from '@wasmer/wasmfs'
import { tokenizeArgs } from 'args-tokenizer'
import { createBirpc } from 'birpc'
// @ts-expect-error
import { Go } from './wasm-exec.js'

const go = new Go()

const cache: Record<string, WebAssembly.Module> = {}

const workerFunctions = {
  init,
  compile,
}
export type WorkerFunctions = typeof workerFunctions
createBirpc<{}, WorkerFunctions>(workerFunctions, {
  post: (data) => postMessage(data),
  on: (fn) => addEventListener('message', ({ data }) => fn(data)),
})

export interface CompileResult {
  output: Record<string, string | null>
  time: number
}

const PATH_STDERR = '/dev/stderr'

async function init(version: string) {
  await loadWasm(version)
}

async function loadWasm(version: string) {
  let wasmMod: WebAssembly.Module | undefined = cache[version]
  if (!wasmMod) {
    const wasmUrl = `https://cdn.jsdelivr.net/npm/tsgo-wasm@${version}/tsgo.wasm`
    const wasmBuffer = await fetch(wasmUrl).then((r) => r.arrayBuffer())
    wasmMod = await WebAssembly.compile(wasmBuffer)
    cache[version] = wasmMod
  }
  return wasmMod
}

async function compile(
  cmd: string,
  files: Record<string, string>,
  version: string,
): Promise<CompileResult> {
  const wasmMod = await loadWasm(version)

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
