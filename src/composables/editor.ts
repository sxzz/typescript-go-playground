import { editor } from 'monaco-editor'
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue'

export function useEditor(
  model: Ref<editor.ITextModel>,
  dom: Ref<HTMLElement | null>,
  dark: Ref<boolean>,
) {
  const editorInstance = shallowRef<editor.IStandaloneCodeEditor>()

  watch(
    [dom, model],
    ([domValue, modelValue]) => {
      if (!domValue) return

      editorInstance.value?.dispose()
      editorInstance.value = editor.create(domValue, {
        model: modelValue,
        automaticLayout: true,
        theme: dark.value ? 'vs-dark' : 'vs-light',
        minimap: { enabled: false },
        fontSize: 13,
      })
    },
    { immediate: true },
  )

  watch(dark, (darkValue) => {
    editorInstance.value?.updateOptions({
      theme: darkValue ? 'vs-dark' : 'vs-light',
    })
  })

  onScopeDispose(() => {
    editorInstance.value?.dispose()
  })

  return { editorInstance }
}
