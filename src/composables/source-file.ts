import * as monaco from 'monaco-editor'
import { markRaw, type Raw } from 'vue'

export function useSourceFile(filename: string, code: string) {
  const { uri, model } = createModel(filename, code)
  const sourceFile: SourceFile = {
    filename,
    code,
    uri,
    model,
    rename(newName: string) {
      this.filename = newName
      const { uri, model } = createModel(newName, this.code)
      this.uri = uri
      this.model.dispose()
      this.model = model
    },
    dispose() {
      this.model.dispose()
    },
  }
  return sourceFile
}

export interface SourceFile {
  filename: string
  code: string

  uri: Raw<monaco.Uri>
  model: Raw<monaco.editor.ITextModel>

  rename: (newName: string) => void
  dispose: () => void
}

export type SourceFileMap = Map<string, SourceFile>

function createModel(filename: string, code: string) {
  const uri = markRaw(monaco.Uri.file(filename))
  const language = filename.endsWith('.json') ? 'json' : 'typescript'

  const existing = monaco.editor.getModel(uri)
  if (existing) {
    if (existing.getLanguageId() === language) {
      existing.setValue(code)
      return { uri, model: existing }
    } else {
      existing.dispose()
    }
  }

  const model = markRaw(monaco.editor.createModel(code, language, uri))
  return { uri, model }
}
