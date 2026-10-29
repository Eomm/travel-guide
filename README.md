# travel-guide
A personal travel guide as a static website

## Development

Requirements: Node.js >= 22 (see `.nvmrc`).

```sh
npm install
npm run dev        # start the dev server
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
npm run lint       # lint the sources
npm run typecheck  # type-check only
```

The app is served under `/travel-guide/` by default; set `BASE_PATH` to build for a different base path.
