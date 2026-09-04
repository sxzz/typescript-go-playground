import { createBirpc, type BirpcReturn } from 'birpc'
import { unpackTar } from 'modern-tar'
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

    const tarStream = response.body.pipeThrough(new DecompressionStream('gzip'))
    const [wasmFile] = await unpackTar(tarStream, {
      strip: 1,
      filter: (header) => header.name === 'tsgo.wasm',
    })
    if (!wasmFile?.data) {
      throw new Error('tsgo.wasm not found in package')
    }
    wasmMod = await WebAssembly.compile(wasmFile.data.buffer)
    wasmModCache[version] = wasmMod
  }
  return wasmMod
}

export type TsgoCli = BirpcReturn<WorkerFunctions, MainFunctions>

export const availableWorkers = Array.from(
  { length: 4 },
  () => new TsgoCliWorker(),
)
/** Workers running a compile right now, each with its RPC channel. */
export const pendingWorkers = new Map<Worker, TsgoCli | undefined>()

export function terminateWorkers() {
  const length = pendingWorkers.size
  if (length === 0) return

  for (const [worker, cli] of pendingWorkers) {
    // Reject the in-flight call now. A terminated worker can never reply, so
    // without this the caller waits out birpc's 60s timeout.
    cli?.$close(new Error('[tsgo] compile superseded by a newer edit'))
    worker.terminate()
  }
  pendingWorkers.clear()

  const newWorkers = Array.from({ length }, () => new TsgoCliWorker())
  availableWorkers.push(...newWorkers)
}

export function getWorker(): Worker {
  const worker = availableWorkers.shift() ?? new TsgoCliWorker()
  pendingWorkers.set(worker, undefined)
  return worker
}

export function releaseWorker(worker: Worker, cli?: TsgoCli) {
  cli?.$close()
  // `delete` misses when terminateWorkers() already cleared this worker: it is
  // dead and has been replaced, so returning it to the pool would hand a dead
  // worker to the next compile, which then waits for a reply that never comes.
  if (!pendingWorkers.delete(worker)) return
  availableWorkers.unshift(worker)
}

export interface MainFunctions {
  setOutputFiles: (files: Record<string, string | null>) => void
}

export function createTsgoCli(
  worker: Worker,
  setOutputFiles: (files: Record<string, string | null>) => void,
): TsgoCli {
  let listener: (event: MessageEvent) => void
  const cli = createBirpc<WorkerFunctions, MainFunctions>(
    { setOutputFiles },
    {
      post: (data) => worker.postMessage(data),
      on: (fn) => {
        listener = ({ data }) => fn(data)
        worker.addEventListener('message', listener)
      },
      // Workers are pooled and reused, so each channel has to detach on close
      // or a worker collects a listener per compile.
      off: () => worker.removeEventListener('message', listener),
    },
  )
  pendingWorkers.set(worker, cli)
  return cli
}
