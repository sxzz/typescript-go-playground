import { createBirpc, type BirpcReturn } from 'birpc'
import { createGzipDecoder, unpackTar } from 'modern-tar'
import TsgoCliWorker from './tsgo-cli.worker?worker'
import type { WorkerFunctions } from './tsgo-cli.worker'

export const wasmModCache: Record<string, WebAssembly.Module> = {}

export async function loadWasm(manifest: Record<string, any>) {
  const version = manifest.version
  let wasmMod: WebAssembly.Module | undefined = wasmModCache[version]
  if (!wasmMod) {
    const response = await fetch(manifest.dist.tarball, {
      cache: 'force-cache',
    })
    if (!response.body) throw new Error('No response body')

    const tarStream = response.body.pipeThrough(createGzipDecoder())
    const [wasmFile] = await unpackTar(tarStream, {
      strip: 1,
      filter: (header) => header.name === 'tsgo.wasm',
    })
    if (!wasmFile?.data) {
      throw new Error('tsgo.wasm not found in package')
    }
    wasmMod = await WebAssembly.compile(wasmFile.data.buffer as ArrayBuffer)
    wasmModCache[version] = wasmMod
  }
  return wasmMod
}

export const availableWorkers = Array.from(
  { length: 4 },
  () => new TsgoCliWorker(),
)
export const pendingWorkers = new Set<Worker>()

export function terminateWorkers() {
  const length = pendingWorkers.size
  if (length === 0) return

  for (const worker of pendingWorkers) {
    worker.terminate()
  }
  pendingWorkers.clear()

  const newWorkers = Array.from({ length }, () => new TsgoCliWorker())
  availableWorkers.push(...newWorkers)
}

export function getWorker(): Worker {
  let worker = availableWorkers.shift()
  if (!worker) {
    worker = new TsgoCliWorker()
  }
  pendingWorkers.add(worker)
  return worker
}

export function releaseWorker(
  worker: Worker,
  cli?: BirpcReturn<WorkerFunctions, MainFunctions>,
) {
  cli?.$close()
  pendingWorkers.delete(worker)
  availableWorkers.unshift(worker)
}

export interface MainFunctions {
  setOutputFiles: (files: Record<string, string | null>) => void
}

export function createTsgoCli(
  worker: Worker,
  setOutputFiles: (files: Record<string, string | null>) => void,
): BirpcReturn<WorkerFunctions, MainFunctions> {
  return createBirpc<WorkerFunctions, MainFunctions>(
    { setOutputFiles },
    {
      post: (data) => worker.postMessage(data),
      on: (fn) => worker.addEventListener('message', ({ data }) => fn(data)),
    },
  )
}
