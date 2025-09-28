import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { activeFile, files } from './composables/state'

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  allowNonTsExtensions: true,
  allowImportingTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  noEmit: true,
  esModuleInterop: true,
  jsx: monaco.languages.typescript.JsxEmit.Preserve,
  resolveJsonModule: true,
})

monaco.editor.registerEditorOpener({
  openCodeEditor(_, resource) {
    if (resource.scheme !== 'file' || resource.path[0] !== '/') {
      return false
    }
    const path = resource.path.slice(1)
    if (!files.value.has(path)) {
      return false
    }
    activeFile.value = path
    return true
  },
})

self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  },
}
