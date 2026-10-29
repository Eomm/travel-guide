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

## Trips

Each trip lives in its own folder, `trips/<slug>/trip.json5` (or `trip.json`), next to the files it references
(audio, images); the folder name is the URL slug. See `schema/README.md` for the format.

The Vite plugin `scripts/vite-plugin-trips.ts` publishes the trips as static data under `<base>data/`:

- `data/index.json`: the list of trips (slug, title, subtitle, dates, cover), sorted by start date;
- `data/<slug>/trip.json`: the validated trip as plain JSON;
- `data/<slug>/<path>`: every relative file the trip references, at the same relative path.

`npm run build` fails when any trip has errors (same report as `npm run check:trips`); warnings are printed only.
`npm run dev` serves the same URLs from memory and reloads on changes in `trips/`: an invalid trip is left out
and its errors are shown in the terminal and in the browser overlay. The app reads the data at runtime through
`src/data/trips.ts` (`loadTripIndex`, `loadTrip`), never from the JS bundle.

## Deploy

`.github/workflows/deploy.yml` deploys to GitHub Pages on every push to `main`; pull requests run the same
checks (lint, generated files up to date, type check, trip checks, build) without deploying. The site is served
under `/<repo name>/`, and `404.html` is a copy of `index.html` so deep links like `/<repo>/<slug>` work on reload.

One-time setup: repository Settings → Pages → Source: **GitHub Actions**.
