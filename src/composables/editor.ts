import { editor } from 'monaco-editor'
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue'

export function useEditor(
  model: Ref<editor.ITextModel>,
  dom: Ref<HTMLElement | undefined>,
  dark: Ref<boolean>,
) {
  const editorInstance = shallowRef<editor.IStandaloneCodeEditor>()

  watch(
    [dom, model, dark],
    ([domValue, modelValue, darkValue]) => {
      if (!domValue) return

      editorInstance.value?.dispose()
      editorInstance.value = editor.create(domValue, {
        model: modelValue,
        automaticLayout: true,
        theme: darkValue ? 'vs-dark' : 'vs-light',
        minimap: {
          enabled: false,
        },
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    editorInstance.value?.dispose()
  })

  return { editorInstance }
}
