<script setup lang="ts">
import { useTemplateRef } from 'vue'

const editorRef = useTemplateRef<HTMLDivElement>('editorRef')
</script>

<template>
  <div>
    <div ref="editorRef" h-full w-full border />
  </div>
</template>
