<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'

const { tabs, readonly } = defineProps<{
  tabs: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  addTab: [name: string]
  renameTab: [oldName: string, newName: string]
  removeTab: [name: string]
}>()

const active = defineModel<string>({
  default(props: { tabs: string[] }) {
    return props.tabs[0]
  },
})

watch(
  [active, () => tabs],
  () => {
    if (!tabs.includes(active.value)) {
      active.value = tabs[0]
    }
  },
  { deep: true },
)

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
    active.value = tabs[0]
  }
}

function horizontalScroll(e: WheelEvent) {
  const el = tabsRef.value!
  const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  el.scrollTo({
    left: el.scrollLeft + delta,
  })
}
</script>

<template>
  <div flex="~ col" gap2>
    <div flex items-center>
      <div
        ref="tabsRef"
        flex
        flex-nowrap
        overflow-x-auto
        class="tabs"
        @wheel.prevent="horizontalScroll"
      >
        <div
          v-for="name of tabs"
          :key="name"
          border-b="~ 2"
          group
          flex
          cursor-pointer
          items-center
          gap1
          rounded-t
          py1
          pl2
          :class="[
            active === name && 'border-b-blue-500',
            renamingTab === name && 'bg-gray:10',
            readonly && 'pr2',
          ]"
          @click="active = name"
          @dblclick="!readonly && startRename(name)"
        >
          <slot name="tab-prefix" :value="name" />

          <input
            v-if="renamingTab === name"
            ref="rename-input"
            v-model="renameInput"
            style="field-sizing: content"
            rounded-none
            border-none
            bg-transparent
            p0
            text-sm
            font-mono
            outline-none
            spellcheck="false"
            @keydown.enter.prevent="finishRename(name)"
            @keydown.esc.prevent="cancelRename()"
            @blur="finishRename(name)"
          />
          <span
            v-else
            :class="active === name ? 'text-blue-500' : 'op70'"
            whitespace-nowrap
            text-sm
            font-mono
          >
            {{ name }}
          </span>

          <button
            v-if="!readonly && tabs.length > 1"
            title="Remove"
            p="0.5"
            :class="active === name && 'op60'"
            rounded
            op0
            transition-300
            transition-opacity
            hover:bg-gray:30
            group-hover:opacity-60
            @click.stop="removeTab(name)"
          >
            <div i-ri:close-line />
          </button>
        </div>
      </div>

      <button v-if="!readonly" ml3 rounded p1 hover:bg-gray:30 @click="addTab">
        <div i-ri:add-fill text-lg />
      </button>
    </div>

    <slot :value="active" />
  </div>
</template>

<style>
.tabs::-webkit-scrollbar {
  height: 2px;
}

.tabs::-webkit-scrollbar-track {
  background-color: var(--c-border);
}

.tabs::-webkit-scrollbar-thumb {
  --at-apply: 'bg-blue-500';
}
</style>
