import { WasmFs } from '@wasmer/wasmfs'
import { tokenizeArgs } from 'args-tokenizer'
import { createBirpc } from 'birpc'
// @ts-expect-error
import { Go } from './wasm-exec.js'
import type { MainFunctions } from './core.js'

const workerFunctions = {
  compile,
  watch,
  setSourceCode,
}
export type WorkerFunctions = typeof workerFunctions
const rpc = createBirpc<MainFunctions, WorkerFunctions>(workerFunctions, {
  post: (data) => postMessage(data),
  on: (fn) => addEventListener('message', ({ data }) => fn(data)),
})

export interface CompileResult {
  output: Record<string, string | null>
  time: number
}

// init
const go = new Go()
let wasmFs: WasmFs

async function compile(
  wasmMod: WebAssembly.Module,
  cmd: string,
  files: Record<string, string>,
): Promise<CompileResult> {
  mountFs(files)
  const args = tokenizeArgs(cmd)

  const startTime = performance.now()
  const code = await run(wasmMod, args)
  const time = performance.now() - startTime

  const output = await getOutputFiles(code)

  return {
    output,
    time,
  }
}

function setSourceCode(files: Record<string, string>) {
  wasmFs.volume.fromJSON(files, '/app')
}

function watch(
  wasmMod: WebAssembly.Module,
  cmd: string,
  files: Record<string, string>,
): Promise<number> {
  wasmFs = mountFs(files)
  const args = ['-w', ...tokenizeArgs(cmd)]

  const id = setInterval(async () => {
    rpc.setOutputFiles(await getOutputFiles())
  }, 500)

  return run(wasmMod, args).finally(() => {
    clearInterval(id)
    wasmFs = undefined!
  })
}

function mountFs(files: Record<string, string>) {
  wasmFs = new WasmFs()
  wasmFs.volume.fromJSON(files, '/app')
  // @ts-expect-error missing types for wasmFs.fs
  globalThis.fs = wasmFs.fs
  return wasmFs
}

async function getOutputFiles(code?: number) {
  const stdout = ((await wasmFs.getStdOut()) as string).trim()
  let stderr = await wasmFs.fs.readFileSync('/dev/stderr', 'utf8').trim()
  if (code != null && code !== 0) {
    stderr = `Exit code: ${code}\n\n${stderr}`.trim()
  }

  const output: Record<string, string | null> = {}
  if (stdout) output['<stdout>'] = stdout
  if (stderr) output['<stderr>'] = stderr
  Object.assign(output, wasmFs.volume.toJSON('/app/dist', undefined, true))

  return output
}

async function run(wasmMod: WebAssembly.Module, args: string[]) {
  const { promise, resolve } = Promise.withResolvers<number>()
  go.exit = (code: number) => resolve(code)
  go.argv = ['js', ...args]
  const instance = await WebAssembly.instantiate(wasmMod, go.importObject)

  await go.run(instance)
  return await promise
}
