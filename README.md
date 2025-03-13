# TypeScript Go Playground

This is a playground that allows you to experience [TypeScript 7](https://github.com/microsoft/typescript-go) online!

## Build WASM

The WASM file is built from [sxzz/typescript-go-wasm](https://github.com/sxzz/typescript-go-wasm) with the following command:

```bash
GOOS=js GOARCH=wasm go build -o tsgo.wasm ./cmd/tsgo
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2025 [三咲智子 Kevin Deng](https://github.com/sxzz)
