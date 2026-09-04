<script setup lang="ts">
import { computed } from 'vue'
import {
  cmd,
  compiling,
  loadingDebounced,
  outputFiles,
  timeCost,
} from '../composables/state'

const busy = computed(() => loadingDebounced.value || compiling.value)

const hasStderr = computed(() => !!outputFiles.value['<stderr>']?.trim())

const status = computed(() => {
  if (loadingDebounced.value) return 'downloading compiler'
  if (compiling.value) return 'compiling'
  if (timeCost.value) return `${Math.round(timeCost.value)} ms`
  return ''
})
</script>

<template>
  <!-- One shell line: the prompt, the flags you type, and what tsgo reported. -->
  <div class="rail" :class="busy && 'is-running'">
    <span class="prompt" aria-hidden="true">❯</span>
    <label class="bin" for="tsgo-flags">tsgo</label>
    <input
      id="tsgo-flags"
      v-model="cmd"
      class="flags"
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="--strict --target es2022 …"
    />

    <output class="readout" :class="busy && 'is-busy'">
      <span
        v-if="status"
        class="dot"
        :class="hasStderr && !busy && 'dot-alert'"
        :title="hasStderr && !busy ? 'tsgo wrote to stderr' : undefined"
      />
      <span class="readout-text">{{ status }}</span>
    </output>
  </div>
</template>

<style scoped>
.rail {
  --at-apply: 'relative flex shrink-0 items-center gap-2 border-b border-line bg-panel-alt px-3 py-2 text-xs md:px-4';
  transition: box-shadow 0.15s ease;
}

.rail:focus-within {
  border-bottom-color: var(--c-go);
  box-shadow: 0 1px 0 var(--c-go);
}

.prompt {
  --at-apply: 'shrink-0 text-base text-go font-700 leading-none';
}

.bin {
  --at-apply: 'shrink-0 cursor-text text-ink font-600';
}

.flags {
  --at-apply: 'min-w-0 flex-1 border-none bg-transparent p-0 text-xs text-ink font-400 outline-none';
}

.flags::placeholder {
  --at-apply: 'text-ink-3';
}

.readout {
  --at-apply: 'flex shrink-0 items-center gap-1.5 text-ink-2 tabular-nums';
}

.readout.is-busy {
  --at-apply: 'text-ink-3';
}

.dot {
  --at-apply: 'size-1.5 shrink-0 rounded-full bg-go';
}

.dot-alert {
  --at-apply: 'bg-alert';
}

.is-busy .dot {
  animation: pulse 1.15s ease-in-out infinite;
}

/* A single cyan hairline crossing the rail while tsgo runs. */
.rail::after {
  content: '';
  --at-apply: 'pointer-events-none absolute bottom-[-1px] left-0 h-px w-[35%] op0';
  background: linear-gradient(
    90deg,
    transparent,
    rgb(var(--c-go-rgb)),
    transparent
  );
}

.rail.is-running::after {
  --at-apply: 'op100';
  animation: sweep 1.15s linear infinite;
}

@keyframes sweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(286%);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
