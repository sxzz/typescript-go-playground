import { sxzz } from '@sxzz/eslint-config'

export default sxzz(
  {
    baseline: { ignoreFeatures: ['escape-unescape', 'promise-withresolvers'] },
  },
  {
    ignores: ['src/wasm-exec.js'],
  },
)
