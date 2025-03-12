<script setup lang="ts">
import { dark } from '../composables/dark'
</script>

<template>
  <div flex self-end gap1 border rounded-full>
    <button nav-button @click="dark = !dark">
      <div dark:i-ri:moon-line i-ri:sun-line text-2xl />
    </button>

    <a
      nav-button
      href="https://github.com/sxzz/typescript-go-playground"
      target="_blank"
      rel="noopener"
    >
      <div i-ri:github-fill text-2xl />
    </a>

    <a
      href="https://github.com/sponsors/sxzz"
      target="_blank"
      flex="~ center"
      title="Sponsor"
      rel="noopener"
      group
      nav-button
    >
      <div
        i-ri:heart-3-line
        group-hover:i-ri:heart-3-fill
        text-2xl
        text-pink-400
        group-hover:text-pink-400
      />
    </a>
  </div>
</template>
