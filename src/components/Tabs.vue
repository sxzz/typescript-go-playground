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
        cursor-pointer
        border-b="~ 2"
        p2
        op80
        :class="active === name && 'border-b-blue-500 color-blue-500'"
        @click="active = name"
      >
        {{ name }}
      </div>
    </div>

    <slot :value="active" />
  </div>
</template>
