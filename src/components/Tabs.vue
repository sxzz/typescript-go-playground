<script setup lang="ts">
defineProps<{
  tabs: string[]
}>()

const active = defineModel<string>({
  default(props: { tabs: string[] }) {
    return props.tabs[0]
  },
})
</script>

<template>
  <div flex="~ col" gap2>
    <div flex>
      <div
        v-for="name of tabs"
        :key="name"
        border-b="~ 2"
        cursor-pointer
        px2
        py1
        :class="active === name ? 'border-b-blue-500 color-blue-500' : 'op70'"
        @click="active = name"
      >
        {{ name }}
      </div>
    </div>

    <slot :value="active" />
  </div>
</template>
