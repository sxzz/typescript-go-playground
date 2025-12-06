import { sxzz } from '@sxzz/eslint-config'

export default sxzz(
  {
    baseline: { ignoreFeatures: ['escape-unescape'] },
  },
  {
    ignores: ['src/wasm-exec.js'],
  },
)
