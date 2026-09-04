<script setup lang="ts">
import { useClipboard, watchDebounced } from '@vueuse/core'
import AnsiRegex from 'ansi-regex'
import { computed, watch } from 'vue'
import AppBar from './components/AppBar.vue'
import CodeEditor from './components/CodeEditor.vue'
import CommandBar from './components/CommandBar.vue'
import PageFooter from './components/PageFooter.vue'
import Tabs from './components/Tabs.vue'
import { dark } from './composables/dark'
import { shiki, themeDark, themeLight } from './composables/shiki'
import { useSourceFile } from './composables/source-file'
import {
  activeFile,
  cmd,
  compiling,
  currentManifest,
  files,
  filesToObject,
  initted,
  isFetchingManifest,
  loadingDebounced,
  loadingWasm,
  outputActive,
  outputFiles,
  serialized,
  tabs,
  timeCost,
  watchMode,
} from './composables/state'
import {
  createTsgoCli,
  getWorker,
  loadWasm,
  releaseWorker,
  terminateWorkers,
  wasmModCache,
} from './core'

const ansiRegex = AnsiRegex()

watchDebounced([files, cmd, watchMode], () => compile(), {
  debounce: 200,
  deep: true,
  immediate: true,
})
watch(isFetchingManifest, () => compile())

async function compile() {
  if (loadingWasm.value || !currentManifest.value || isFetchingManifest.value)
    return

  if (watchMode.value && compiling.value) {
    return
  }

  const current = serialized.value
  const currentVersion: string = currentManifest.value.version

  let wasmMod = wasmModCache[currentVersion]
  if (!wasmMod) {
    loadingWasm.value = true
    wasmMod = await loadWasm(currentManifest.value).finally(() => {
      initted.value = true
    })
  }

  if (current !== serialized.value) return
  loadingWasm.value = false
  compiling.value = true

  terminateWorkers()

  const worker = getWorker()
  const cli = createTsgoCli(worker, (files) => {
    outputFiles.value = files
  })

  if (watchMode.value) {
    const stop = watch(
      files,
      () => cli.setSourceCode(Object.fromEntries(filesToObject())),
      { deep: true },
    )

    await cli
      .watch(wasmMod, cmd.value, Object.fromEntries(filesToObject()))
      .finally(() => {
        releaseWorker(worker, cli)
        stop()
      })
    return
  }

  const result = await cli
    .compile(wasmMod, cmd.value, Object.fromEntries(filesToObject()))
    .finally(() => releaseWorker(worker, cli))
  if (current !== serialized.value) return

  compiling.value = false
  outputFiles.value = result.output
  timeCost.value = result.time
  outputActive.value = Object.keys(result.output)[0]
}

const outputTabs = computed(() => Object.keys(outputFiles.value))
const hasOutput = computed(() => outputTabs.value.length > 0)

function highlight(code?: string | null) {
  if (!code) return ''
  return shiki.codeToHtml(code.replace(ansiRegex, ''), {
    lang: 'js',
    theme: dark.value ? themeDark.name! : themeLight.name!,
  })
}

const { copy, copied } = useClipboard()
function handleCopy() {
  if (!outputActive.value) return
  copy(outputFiles.value[outputActive.value] || '')
}

function addTab(name: string) {
  files.value.set(name, useSourceFile(name, ''))
}

function renameTab(oldName: string, newName: string) {
  files.value = new Map(
    Array.from(files.value.values()).map((file) => {
      if (file.filename === oldName) {
        file.rename(newName)
        return [newName, file]
      }
      return [file.filename, file]
    }),
  )
}

function removeTab(name: string) {
  files.value.get(name)?.dispose()
  files.value.delete(name)
}

function updateCode(name: string, code: string) {
  files.value.get(name)!.code = code
}
</script>

<template>
  <div class="shell">
    <AppBar />
    <CommandBar />

    <main class="workbench thin-scroll">
      <Tabs
        v-model="activeFile"
        :tabs
        accent="ts"
        @add-tab="addTab"
        @rename-tab="renameTab"
        @remove-tab="removeTab"
      >
        <template #default="{ value }">
          <div min-h-0 min-w-0 flex-1>
            <CodeEditor
              :model-value="files.get(value)!.code"
              :model="files.get(value)!.model"
              :uri="files.get(value)!.uri"
              h-full
              min-h-0
              w-full
              @update:model-value="updateCode(value, $event)"
            />
          </div>
        </template>
      </Tabs>

      <Tabs v-model="outputActive" :tabs="outputTabs" readonly accent="go">
        <template #head-end>
          <button
            v-if="hasOutput"
            type="button"
            class="copy"
            :title="copied ? 'Copied' : 'Copy output'"
            @click="handleCopy"
          >
            <div
              :class="
                copied ? 'i-ri:check-line text-ok' : 'i-ri:file-copy-line'
              "
            />
          </button>
        </template>

        <div class="pane">
          <div v-if="loadingDebounced" class="pane-state">
            <div i-ri:download-cloud-2-line animate-pulse text-2xl text-go />
            <p class="pane-state-title">Downloading the tsgo compiler</p>
            <p class="pane-state-note">
              The WebAssembly build is fetched once, then cached. You can start
              writing already.
            </p>
          </div>

          <div v-else-if="compiling && !hasOutput" class="pane-state">
            <div i-ri:loader-4-line animate-spin text-2xl text-go />
            <p class="pane-state-title">Compiling</p>
          </div>

          <div v-else-if="!hasOutput" class="pane-state">
            <p class="pane-state-title">Nothing emitted</p>
            <p class="pane-state-note">
              tsgo produced no files or diagnostics for this command.
            </p>
          </div>

          <template v-else-if="outputActive">
            <div
              v-if="outputActive.startsWith('<')"
              class="output thin-scroll"
              :class="[
                outputActive === '<stderr>' && 'text-alert',
                compiling && 'is-stale',
              ]"
              v-text="outputFiles[outputActive]?.replace(ansiRegex, '')"
            />
            <div
              v-else
              class="output thin-scroll"
              :class="compiling && 'is-stale'"
              v-html="highlight(outputFiles[outputActive])"
            />
          </template>
        </div>
      </Tabs>
    </main>

    <PageFooter />
  </div>
</template>

<style scoped>
.shell {
  --at-apply: 'h-100dvh flex flex-col overflow-hidden bg-field';
}

.workbench {
  --at-apply: 'min-h-0 flex-1 grid gap-3 overflow-y-auto p-3 md:p-4';
  grid-template-columns: minmax(0, 1fr);
}

/* Panels get their own height on narrow screens so the workbench scrolls. */
.workbench > :first-child {
  min-height: 46dvh;
}
.workbench > :last-child {
  min-height: 40dvh;
}

@media (min-width: 768px) {
  .workbench {
    --at-apply: 'overflow-hidden';
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .workbench > :first-child,
  .workbench > :last-child {
    min-height: 0;
  }
}

.pane {
  --at-apply: 'relative min-h-0 min-w-0 flex-1';
}

.pane-state {
  --at-apply: 'h-full flex flex-col items-center justify-center gap-2 px-8 text-center';
}

.pane-state-title {
  --at-apply: 'm-0 text-sm text-ink font-500';
}

.pane-state-note {
  --at-apply: 'm-0 max-w-70 text-xs text-ink-3 leading-relaxed';
}

.copy {
  --at-apply: 'shrink-0 rounded-md p-1.5 text-ink-3 transition-colors duration-150 hover:bg-fill hover:text-ink disabled:op30 disabled:hover:bg-transparent';
}
</style>

<style>
.output {
  --at-apply: 'h-full w-full overflow-auto whitespace-pre p-3 text-xs leading-relaxed transition-opacity duration-200';
}

.output.is-stale {
  --at-apply: 'op40';
}

/* Shiki inlines its theme background; the panel already provides one. */
.output pre.shiki {
  margin: 0;
  background-color: transparent !important;
}
</style>
