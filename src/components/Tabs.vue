<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const {
  tabs,
  readonly,
  accent = 'ts',
} = defineProps<{
  tabs: string[]
  readonly?: boolean
  /** Which side of the compiler this panel shows: your source, or tsgo's output. */
  accent?: 'ts' | 'go'
}>()

const emit = defineEmits<{
  addTab: [name: string]
  renameTab: [oldName: string, newName: string]
  removeTab: [name: string]
}>()

const active = defineModel<string>({
  default: (props) => (props.tabs as string[])[0]!,
})

watch(
  [active, () => tabs],
  () => {
    if (tabs.length && !tabs.includes(active.value)) {
      active.value = tabs[0]!
    }
  },
  { deep: true },
)

const accentVar = computed(() =>
  accent === 'go' ? 'var(--c-go)' : 'var(--c-ts)',
)

/** stderr keeps the alert color whether or not it is the tab you're on. */
function tabAccent(name: string) {
  return name === '<stderr>' ? 'var(--c-alert)' : accentVar.value
}

/** `<stdout>` / `<stderr>` are streams, not emitted files — they read differently. */
function parseName(name: string) {
  const stream = /^<(.+)>$/.exec(name)
  return {
    isStream: !!stream,
    label: stream ? stream[1]! : name,
    isError: name === '<stderr>',
  }
}

const renamingTab = ref<string>()
const renameInput = ref('')
const renameInputRef = useTemplateRef<HTMLInputElement[]>('rename-input')
const tabsRef = useTemplateRef<HTMLDivElement>('tabsRef')

function addTab() {
  const base = 'untitled'
  let idx = 1
  let name = base
  while (tabs.includes(name)) {
    name = `${base}-${idx++}`
  }
  emit('addTab', name)
  active.value = name
  startRename(name)
}

async function startRename(name: string) {
  renamingTab.value = name
  renameInput.value = name
  await nextTick()
  renameInputRef.value?.[0]?.focus()
  renameInputRef.value?.[0]?.select()
}

function finishRename(oldName: string) {
  const newName = renameInput.value.trim()
  if (newName && newName !== oldName && !tabs.includes(newName)) {
    emit('renameTab', oldName, newName)
    if (active.value === oldName) {
      active.value = newName
    }
  }
  renamingTab.value = undefined
}

function cancelRename() {
  renamingTab.value = undefined
}

function removeTab(name: string) {
  if (tabs.length <= 1) return
  emit('removeTab', name)
  if (active.value === name) {
    active.value = tabs[0]!
  }
}

function horizontalScroll(e: WheelEvent) {
  const el = tabsRef.value!
  const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  el.scrollTo({ left: el.scrollLeft + delta })
}
</script>

<template>
  <section panel :style="{ '--accent': accentVar }">
    <header panel-head>
      <div
        ref="tabsRef"
        class="tab-strip"
        role="tablist"
        @wheel.prevent="horizontalScroll"
      >
        <div
          v-for="name of tabs"
          :key="name"
          class="tab"
          :class="{
            'tab-active': active === name,
            'tab-warn': parseName(name).isError,
          }"
          :style="{ '--accent': tabAccent(name) }"
          role="tab"
          :aria-selected="active === name"
          tabindex="0"
          @click="active = name"
          @keydown.enter="active = name"
          @keydown.space.prevent="active = name"
          @dblclick="!readonly && startRename(name)"
        >
          <input
            v-if="renamingTab === name"
            ref="rename-input"
            v-model="renameInput"
            class="tab-rename"
            style="field-sizing: content"
            spellcheck="false"
            @keydown.enter.prevent="finishRename(name)"
            @keydown.esc.prevent="cancelRename()"
            @blur="finishRename(name)"
          />
          <span v-else class="tab-label">
            <template v-if="parseName(name).isStream">
              <span class="tab-bracket">&lt;</span>{{ parseName(name).label
              }}<span class="tab-bracket">&gt;</span>
            </template>
            <template v-else>{{ name }}</template>
          </span>

          <button
            v-if="!readonly && tabs.length > 1"
            type="button"
            class="tab-close"
            :title="`Close ${name}`"
            @click.stop="removeTab(name)"
          >
            <div i-ri:close-line />
          </button>

          <span v-if="active === name" class="tab-marker" />
        </div>
      </div>

      <button
        v-if="!readonly"
        type="button"
        class="tab-add"
        title="New file"
        @click="addTab"
      >
        <div i-ri:add-line text-base />
      </button>

      <div flex-1 />
      <slot name="head-end" />
    </header>

    <slot :value="active" />
  </section>
</template>

<style scoped>
.tab-strip {
  --at-apply: 'flex flex-nowrap items-stretch overflow-x-auto';
  scrollbar-width: none;
}
.tab-strip::-webkit-scrollbar {
  display: none;
}

.tab {
  --at-apply: 'relative flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap px-2.5 py-2 text-xs text-ink-3 transition-colors duration-150 hover:text-ink-2';
}
.tab-warn:not(.tab-active),
.tab-warn:not(.tab-active):hover {
  color: var(--c-alert);
  --at-apply: 'op65';
}

.tab-active,
.tab-active:hover {
  color: var(--accent);
  --at-apply: 'font-600';
}

.tab-marker {
  --at-apply: 'absolute inset-x-1.5 -bottom-px h-2px rounded-full';
  background-color: var(--accent);
}

.tab-bracket {
  --at-apply: 'op40';
}

.tab-rename {
  --at-apply: 'border-none rounded-none bg-transparent p-0 text-xs font-600 outline-none';
  color: var(--accent);
}

.tab-close {
  --at-apply: 'rounded p-0.5 op0 transition-opacity duration-200 text-ink-3 hover:bg-fill-strong hover:text-ink focus-visible:op100';
}
.tab:hover .tab-close {
  --at-apply: 'op70';
}

.tab-add {
  --at-apply: 'ml-1 shrink-0 rounded-md p-1 text-ink-3 transition-colors duration-150 hover:bg-fill hover:text-ink';
}
</style>
