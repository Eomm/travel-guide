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

## UI conventions

- **Routes**: `/` lists the trips; `/:slug` is `src/pages/TripLayout.tsx`, which loads the trip once (header,
  bottom tab bar, loading/error states) and renders the pages in `src/pages/trip/` (itinerary, places, logistics,
  budget). Inside them, `useTrip()` (`src/data/trip-context.ts`) returns `{ slug, trip }`.
- **Styles**: design tokens (colors with a dark-mode block, spacing, radius, font sizes, shadow, layout sizes)
  are CSS custom properties in `src/styles.css`, together with the reset and base element styles. Everything
  else goes in a CSS module next to its component (`Foo.tsx` + `Foo.module.css`) and uses the tokens.
  Mobile-first; tap targets at least `var(--tap-size)` (44px).
- **i18n**: every UI string goes through `t` from `useI18n()` (`src/i18n/i18n.ts`). To add a string, add the key
  to `src/i18n/it.ts` in its area (`<area>.<name>`) and the same key to `src/i18n/en.ts` (a missing key is a type
  error); `{name}` placeholders are filled by `t('key', { name })`. The language is the saved choice, else the
  browser language (it/en), else Italian.
- **Formatting**: `src/model/format.ts` formats dates (`YYYY-MM-DD`, no timezone shifts), prices in the trip
  currency with the rough conversion (or `<Price amount />` in `src/components/`) and durations.

## Google Maps

Each itinerary day shows an embedded Google map (`src/pages/trip/itinerary/DayMap.tsx`): numbered markers for the
start and the stops, real routes for walk / drive / bike legs (Maps JavaScript API, Routes library) and dashed
straight lines for the others (Google has no transit data in Japan). It needs two build-time variables:

- `VITE_GMAPS_KEY`: a Maps JavaScript API key;
- `VITE_GMAPS_MAP_ID`: a map ID (Advanced Markers, light/dark map); Google's `DEMO_MAP_ID` is used when unset.

For local development put them in `.env.local` (git-ignored, never commit it); for the deploy add them as
repository secrets (Settings → Secrets and variables → Actions) with the same names.

The key ends up in the public JavaScript bundle, so restrict it in the Google Cloud console:

- **Application restrictions**: websites, only `http://localhost:5173/*`, `http://localhost:4173/*` and the
  GitHub Pages site (`https://<user>.github.io/*`);
- **API restrictions**: only Maps JavaScript API and Routes API;
- **Quotas**: set a low daily limit on both APIs (e.g. a few hundred requests a day) and a budget alert.

Routes are requested once per leg and cached in `sessionStorage`, so browsing days does not repeat requests.
Without a key (e.g. a build from a fork) there is no map at all; offline, or when the Maps script or a route
fails (e.g. quota exceeded), the page shows a short note or falls back to straight lines, and the walking
distances stay estimated (`≈`) unless set by hand in the trip.

## Deploy

`.github/workflows/deploy.yml` deploys to GitHub Pages on every push to `main`; pull requests run the same
checks (lint, generated files up to date, type check, trip checks, build) without deploying. The site is served
under `/<repo name>/`, and `404.html` is a copy of `index.html` so deep links like `/<repo>/<slug>` work on reload.

One-time setup: repository Settings → Pages → Source: **GitHub Actions**.
