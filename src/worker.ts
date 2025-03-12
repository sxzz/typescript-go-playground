import { WasmFs } from '@wasmer/wasmfs'
import { createBirpc } from 'birpc'
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import js from 'shiki/langs/js.mjs'
import vitesseLight from 'shiki/themes/vitesse-light.mjs'
import vitesseDark from 'shiki/themes/vitesse-dark.mjs'
import wasmUrl from './tsgo.wasm?url'
import type { UIFunctions } from './App.vue'

const wasmFs = new WasmFs()
// @ts-expect-error
globalThis.fs = wasmFs.fs
// @ts-expect-error
const { Go } = await import('./wasm-exec.js')
const go = new Go()
const wasmBuffer = await fetch(wasmUrl).then((r) => r.arrayBuffer())

const shiki = createHighlighterCoreSync({
  themes: [vitesseLight, vitesseDark],
  langs: [js],
  engine: createJavaScriptRegexEngine(),
})

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
  output: string
  error?: boolean
  time: number
}

const PATH_STDOUT = '/dev/stdout'
const PATH_STDERR = '/dev/stderr'

async function compile(
  code: string,
  tsconfig: string,
  dark: boolean,
): Promise<CompileResult> {
  const { promise, resolve } = Promise.withResolvers<CompileResult>()
  wasmFs.fs.writeFileSync(PATH_STDOUT, '')
  wasmFs.fs.writeFileSync(PATH_STDERR, '')
  wasmFs.volume.fromJSON(
    {
      'main.ts': code,
      'tsconfig.json': tsconfig,
    },
    '/',
  )

  const t = performance.now()
  go.exit = async (code: number) => {
    const time = performance.now() - t
    const stdout = await wasmFs.getStdOut()
    const stderr = await wasmFs.fs.readFileSync(PATH_STDERR, 'utf8')

    if (stdout) console.info('stdout:', await wasmFs.getStdOut())
    if (stderr) console.info('stderr:', stderr)

    if (code !== 0) {
      return resolve({
        output: `Compile failed!\n\n${stdout}\n\n${stderr}`,
        time,
        error: true,
      })
    }

    const output: string = wasmFs.fs.readFileSync('/main.js', 'utf8')
    resolve({
      output: shiki.codeToHtml(output, {
        lang: 'js',
        theme: dark ? vitesseDark.name! : vitesseLight.name!,
        transformers: [
          {
            name: 'remove-bg',
            pre(node) {
              delete node.properties.style
            },
          },
        ],
      }),
      time,
    })
  }
  go.argv = ['js', 'tsc']

  const { instance } = await WebAssembly.instantiate(
    wasmBuffer,
    go.importObject,
  )
  await go.run(instance)

  return promise
}
