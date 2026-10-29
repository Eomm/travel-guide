# travel-guide
A personal travel guide as a static website

## Development

Requirements: Node.js >= 22.18 (see `.nvmrc`); scripts in `scripts/` run with Node's built-in TypeScript support.

```sh
npm install
npm run dev        # start the dev server
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
npm run lint       # lint the sources
npm run typecheck  # type-check only (app and scripts)
npm run check:trips  # validate trips/*/trip.json5 (schema + checks, see schema/README.md)
npm run gen        # regenerate the trip types and validator after a schema change
```

The app is served under `/travel-guide/` by default; set `BASE_PATH` to build for a different base path.
