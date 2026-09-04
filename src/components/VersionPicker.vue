<script setup lang="ts">
import { useFetch } from '@vueuse/core'
import { computed } from 'vue'
import {
  buildInfo,
  currentManifest,
  currentVersion,
} from '../composables/state'
import { generateDates } from '../composables/version'

const { data: pkgMeta } = useFetch(
  'https://data.jsdelivr.com/v1/package/npm/tsgo-wasm',
).json()

const versions = computed<string[] | null>(() => {
  if (!pkgMeta.value) return null
  return pkgMeta.value.versions.filter((v: string) => v.startsWith('7.'))
})

const dates = generateDates()

/** Nightly selections are either the `nightly` tag or a dated build. */
const channel = computed(() =>
  currentVersion.value === 'nightly' ||
  /^\d{4}\.\d{1,2}\.\d{1,2}$/.test(currentVersion.value)
    ? 'nightly'
    : 'stable',
)

const resolved = computed(
  () => (currentManifest.value?.version as string) || currentVersion.value,
)
</script>

<template>
  <div class="version">
    <div class="version-select">
      <span class="version-channel">{{ channel }}</span>
      <span class="version-number">{{ resolved }}</span>
      <div i-ri:expand-up-down-line shrink-0 text-3.5 text-ink-3 />

      <select
        v-model="currentVersion"
        aria-label="Compiler version"
        class="version-native"
      >
        <optgroup v-if="versions" label="Stable">
          <option value="latest">Latest</option>
          <option v-for="version of versions" :key="version" :value="version">
            {{ version }}
          </option>
        </optgroup>
        <optgroup label="Nightly">
          <option value="nightly">Latest nightly</option>
          <option v-for="date of dates" :key="date" :value="date">
            {{ date }}
          </option>
        </optgroup>
      </select>
    </div>

    <template v-if="buildInfo">
      <span class="version-divider" />
      <a
        class="version-commit"
        :href="`${buildInfo.repo || 'https://github.com/microsoft/typescript-go'}/commit/${buildInfo.commit}`"
        target="_blank"
        rel="noopener"
        :title="`Compiler source at ${buildInfo.commit}`"
      >
        @{{ buildInfo.commit.slice(0, 7) }}
      </a>
    </template>
  </div>
</template>

<style scoped>
.version {
  --at-apply: 'inline-flex max-w-full items-center gap-2 border border-line rounded-full bg-panel py-1 pl-3 pr-1 text-xs';
}

.version-select {
  --at-apply: 'relative flex min-w-0 items-center gap-2';
}

.version-channel {
  --at-apply: 'shrink-0 text-ink-3 tracking-wide';
}

.version-number {
  --at-apply: 'truncate text-ink font-500';
}

/* A real <select> on top of the styled label: native menu, custom shell. */
.version-native {
  --at-apply: 'absolute inset-0 h-full w-full cursor-pointer op0';
}

.version-divider {
  --at-apply: 'h-3.5 w-px shrink-0 bg-line';
}

.version-commit {
  --at-apply: 'shrink-0 rounded-full px-2 py-0.5 text-ink-3 transition-colors duration-150 hover:bg-fill hover:text-go';
}
</style>
