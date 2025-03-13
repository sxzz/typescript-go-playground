import { editor } from 'monaco-editor'
import { onUnmounted, shallowRef, watch, type Ref } from 'vue'

export const useEditor = (
  model: Ref<editor.ITextModel>,
  dom: Ref<HTMLElement | null>,
  dark: Ref<boolean>,
) => {
  const editorInstance = shallowRef<editor.IStandaloneCodeEditor | null>(null)

  watch(
    [dom, model, dark],
    ([domValue, modelValue, darkValue]) => {
      if (!domValue) {
        return
      }
      if (editorInstance.value) {
        editorInstance.value.dispose()
      }
      editorInstance.value = editor.create(domValue, {
        model: modelValue,
        automaticLayout: true,
        theme: darkValue ? 'vs-dark' : 'vs-light',
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (editorInstance.value) {
      editorInstance.value.dispose()
    }
  })

  return { editorInstance }
}
