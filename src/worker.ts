import { WasmFs } from '@wasmer/wasmfs'
import { tokenizeArgs } from 'args-tokenizer'
import { createBirpc } from 'birpc'
import { createGzipDecoder, unpackTar } from 'modern-tar'
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

async function init(manifest: Record<string, any>) {
  // @ts-expect-error ReadableStream.from is not supported widely
  ReadableStream.from ||= (iterable) => {
    const iterator =
      iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.()
    if (!iterator) {
      throw new TypeError('Object is not iterable')
    }
    return new ReadableStream({
      async pull(controller) {
        const result = await iterator.next()
        if (result.done) {
          controller.close()
        } else {
          controller.enqueue(result.value)
        }
      },
      cancel() {
        iterator.return?.()
      },
    })
  }

  await loadWasm(manifest)
}

async function loadWasm(manifest: Record<string, any>) {
  const version = manifest.version
  let wasmMod: WebAssembly.Module | undefined = cache[version]
  if (!wasmMod) {
    const response = await fetch(manifest.dist.tarball, {
      cache: 'force-cache',
    })
    if (!response.body) throw new Error('No response body')

    const tarStream = response.body.pipeThrough(createGzipDecoder())
    const tarBuffer = await new Response(tarStream).arrayBuffer()
    const [wasmFile] = await unpackTar(tarBuffer, {
      strip: 1,
      filter: (header) => header.name === 'tsgo.wasm',
    })
    if (!wasmFile) {
      throw new Error('No wasm file found in the package')
    }
    wasmMod = await WebAssembly.compile(wasmFile.data.buffer as ArrayBuffer)
    cache[version] = wasmMod
  }
  return wasmMod
}

async function compile(
  cmd: string,
  files: Record<string, string>,
  manifest: Record<string, any>,
): Promise<CompileResult> {
  const wasmMod = await loadWasm(manifest)

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
