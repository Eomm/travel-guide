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

## Planner

The Planner (`/plan`, the pencil in the headers) writes a trip file in the browser, so you don't have to write
the JSON by hand: start a new trip, import a `trip.json` / `trip.json5`, or open a published trip to update it.
It runs the same checks as the build after every change, links each problem to its field, and **Export**
downloads `trip.json`: put it in `trips/<slug>/` (in place of `trip.json5`, if any; JSON5 comments are lost)
and push to publish.

- **Settings**: title, dates, timezone, currency (and the rough conversion), language, cover.
- **Days**: the itinerary, day by day. Add a day, then its stops: pick a place of the catalog or create one on
  the spot, and say how to get from one stop to the next. Drag the stops (by the handle, a long press on touch,
  or the keyboard) within a day, to another day, or to and from the wishlist. A day can start and end at an
  accommodation, a place or another point.
- **Places**: the catalog, with the wishlist (places in no day), opening hours and audio guides.
- **Logistics**: accommodations, transports and reservations; a stop picks its reservation from its form.

Drafts are autosaved in this browser's `localStorage` (`travel-guide.planner.<slug>`), one per trip: they don't
reach other devices, and the trash button discards one. Files (images, audio) are not uploaded: the Planner
edits their paths, the files go in the trip folder. The code is in `src/pages/planner/` (pages and forms) and
`src/planner/` (drafts, checks, import/export); the pure trip changes are in `src/model/edit.ts`.

## UI conventions

- **Routes**: `/` lists the trips; `/plan` and `/plan/:slug/<section>` are the Planner (`src/pages/planner/`,
  `usePlanner()` from `src/planner/planner.ts`); `/:slug` is `src/pages/TripLayout.tsx`, which loads the trip once (header,
  bottom tab bar, loading/error states) and renders the pages in `src/pages/trip/` (itinerary, places, logistics,
  budget). Inside them, `useTrip()` (`src/data/trip-context.ts`) returns `{ slug, trip }`.
- **Styles**: design tokens (colors with a dark-mode block, spacing, radius, font sizes, shadow, layout sizes)
  are CSS custom properties in `src/styles.css`, together with the reset and base element styles. Everything
  else goes in a CSS module next to its component (`Foo.tsx` + `Foo.module.css`) and uses the tokens.
  Mobile-first; tap targets at least `var(--tap-size)` (44px).
- **Theme**: the app follows the OS theme (light/dark) until the user picks one with the button in the header;
  the choice is saved in `localStorage` (`travel-guide.theme`) and applied before the first paint (`index.html`).
  The state lives in `src/theme/` (`useTheme()`), the tokens in `src/styles.css` (`:root` and
  `:root[data-theme='dark']`).
- **i18n**: every UI string goes through `t` from `useI18n()` (`src/i18n/i18n.ts`). To add a string, add the key
  to `src/i18n/it.ts` in its area (`<area>.<name>`) and the same key to `src/i18n/en.ts` (a missing key is a type
  error); `{name}` placeholders are filled by `t('key', { name })`. The language is the saved choice, else the
  browser language (it/en), else Italian.
- **Formatting**: `src/model/format.ts` formats dates (`YYYY-MM-DD`, no timezone shifts), prices in the trip
  currency with the rough conversion (or `<Price amount />` in `src/components/`) and durations.

## Google Maps

Each itinerary day shows an embedded Google map (`src/pages/trip/itinerary/DayMap.tsx`): numbered markers for the
start and the stops, real routes for walk / drive / bike legs (Maps JavaScript API, Routes library) and dashed
straight lines for the others (Google has no transit data in Japan). The Places page shows the places matching
the filters on a map (`src/pages/trip/places/PlacesMap.tsx`, no routes): filled calendar markers for places used
in a day, dashed heart markers for the wishlist. Both share the collapsible card in `src/components/map/`.
It needs two build-time variables:

- `VITE_GMAPS_KEY`: a Maps JavaScript API key;
- `VITE_GMAPS_MAP_ID`: a map ID (Advanced Markers, light/dark map); Google's `DEMO_MAP_ID` is used when unset.

For local development put them in `.env.local` (git-ignored, never commit it); for the deploy add them as
repository secrets (Settings → Secrets and variables → Actions) with the same names.

To create them, in the [Google Cloud console](https://console.cloud.google.com/):

1. Create (or pick) a project and link a billing account: Google Maps Platform requires one, even within the
   free usage.
2. **Enable** the three APIs the site uses (APIs & Services → Library): **Maps JavaScript API** (the maps),
   **Routes API** (the walk / drive / bike routes) and **Places API (New)** (the Planner's coordinates lookup).
3. Create the key (APIs & Services → Credentials → Create credentials → API key) and restrict it as below.
4. Create the map ID (Google Maps Platform → Map management → Create map ID, type JavaScript).

The key ends up in the public JavaScript bundle, so restrict it:

- **Application restrictions**: websites, only `http://localhost:5173/*`, `http://localhost:4173/*` and the
  GitHub Pages site (`https://<user>.github.io/*`);
- **API restrictions**: only Maps JavaScript API, Routes API and Places API (New). An API must be both enabled
  in the project (step 2) and allowed here: otherwise Google refuses its requests as blocked;
- **Quotas**: set a low daily limit on these APIs (e.g. a few hundred requests a day) and a budget alert.

A change to the restrictions can take a few minutes to apply.

The Planner uses the Places API (New) for one thing: when you paste a Google place ID in a place, it loads its
coordinates (one request per paste). Without that API on the key, the Planner says so and the coordinates are
typed by hand.

Routes are requested once per leg and cached in `sessionStorage`, so browsing days does not repeat requests.
Without a key (e.g. a build from a fork) there is no map at all; offline, or when the Maps script or a route
fails (e.g. quota exceeded), the page shows a short note or falls back to straight lines, and the walking
distances stay estimated (`≈`) unless set by hand in the trip.

## Deploy

`.github/workflows/deploy.yml` deploys to GitHub Pages on every push to `main`; pull requests run the same
checks (lint, generated files up to date, type check, trip checks, build) without deploying. The site is served
under `/<repo name>/`, and `404.html` is a copy of `index.html` so deep links like `/<repo>/<slug>` work on reload.

One-time setup: repository Settings → Pages → Source: **GitHub Actions**.
