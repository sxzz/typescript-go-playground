import { WasmFs } from '@wasmer/wasmfs'
import { createBirpc } from 'birpc'
import wasm from './tsgo.wasm?init'

const wasmFs = new WasmFs()
// @ts-expect-error
globalThis.fs = wasmFs.fs
// @ts-expect-error
const { Go } = await import('./wasm-exec.js')

const workerFunctions = {
  compile,
}
export type WorkerFunctions = typeof workerFunctions
createBirpc(workerFunctions, {
  post: (data) => postMessage(data),
  on: (fn) => addEventListener('message', ({ data }) => fn(data)),
})

export interface CompileResult {
  output: string
  error?: boolean
  time: number
}

async function compile(code: string, tsconfig: string): Promise<CompileResult> {
  const { promise, resolve } = Promise.withResolvers<CompileResult>()
  wasmFs.volume.fromJSON(
    {
      'index.ts': code,
      'tsconfig.json': tsconfig,
    },
    '/',
  )

  const t = performance.now()
  const go = new Go()
  go.exit = async (code: number) => {
    const time = performance.now() - t
    const stdout = await wasmFs.getStdOut()
    const stderr = await wasmFs.fs.readFileSync('/dev/stderr', 'utf8')

    if (stdout) console.info('stdout:', await wasmFs.getStdOut())
    if (stderr) console.info('stderr:', stderr)

    if (code !== 0) {
      return resolve({
        output: `Compile failed!\n\n${stdout}\n\n${stderr}`,
        time,
        error: true,
      })
    }

    const output: string = wasmFs.fs.readFileSync('/index.js', 'utf8')
    resolve({ output, time })
  }
  go.argv = ['js', 'tsc']

  const instance = await wasm(go.importObject)
  await go.run(instance)

  return promise
}
