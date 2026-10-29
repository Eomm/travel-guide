# Trip schema

`trip.schema.json` (JSON Schema 2020-12) validates one trip file: `trips/<slug>/trip.json` or `trip.json5`.
The folder name is the trip URL slug; relative paths (audio, images) are resolved from that folder.
See `trips/hiroshima-sample/trip.json5` for a complete example.

## Structure

| Key | Content |
| --- | --- |
| `schemaVersion` | Always `1` for now |
| `trip` | Title, dates, `timezone` (IANA), `currency` (ISO 4217, used by every price), optional `convertCurrency`, content `language` |
| `places[]` | Places catalog. Places not used by any stop form the wishlist |
| `days[]` | `date`, optional `start` point, ordered `stops[]`. A stop references a place (`placeId`) or is a free `title`; `travel` describes how to get there from the previous stop (or from `start`); `bookedId` links it to a reservation |
| `logistics` | `accommodations[]`, `transports[]` (flights, trains, passes), `reservations[]` |

Conventions:
- All ids are strings (`"5173"`, `"peace-museum"`).
- Dates `YYYY-MM-DD`, times `HH:MM`, date-times `YYYY-MM-DDTHH:MM` (local, in `trip.timezone`).
- Prices are plain numbers in `trip.currency`.
- `convertCurrency: { currency: 'EUR', oneEquals: 170 }` means 1 € = 170 ¥; prices are shown as `1700 ¥ (≈ 10 €)`.
- Unknown keys are rejected to catch typos. Use an `x-` prefix (e.g. `x-source`) for custom data.
- Audio: `src` (file) now; `script` is reserved for build-time text-to-speech.

## Routes and walking distance

Each day is drawn as a route: `start` → stop 1 → stop 2 … Each leg uses the stop's `travel.mode`, mapped to
Google Maps travel modes (walk → walking; train/subway/bus/tram/ferry → transit; taxi/car → driving;
bike → bicycling; flight/other → straight line). A leg without `travel` is drawn as a straight line.

The day recap shows the walking km: the sum of `distanceKm` of the `walk` legs. When `distanceKm` is missing,
the build computes it from the route service, or from the straight-line distance × 1.3 as a fallback.

## Checks done by the build (not expressible in JSON Schema)

Errors:
1. `id`s are unique within places, within all stops, and within each logistics list.
2. Every `placeId`, `accommodationId`, `bookedId` points to an existing item.
3. A reservation is referenced by at most one stop; the stop's day `date` equals the reservation `date`, and
   the stop `time` equals the reservation `time` when set.
4. Day dates are unique, in order, and inside `trip.startDate`..`trip.endDate`; `endDate >= startDate`.
5. Stop times within a day are ascending.
6. Relative files (`src`, `image`, `cover`) exist in the trip folder.

Warnings:
- a stop time outside the place's `openingHours.weekly`, or on one of its `closedDates`;
- a stop on a place whose `status` is not `open`;
- a stop or `start` without coordinates (it can't be placed on the map/route).

## Budget rules

Stop cost = price of the reservation in `bookedId` if it has one, else the stop `price`, else the place `price`.

Trip total = Σ stop cost + Σ `travel.price` + Σ accommodation price + Σ transport price
+ Σ price of reservations not referenced by any stop.
Per-day totals use the stops and travel of that day.

## POI converter

Field mapping used by the POI converter (input: `poi_*.json`):

| POI field | schema |
| --- | --- |
| `id` (number) | `id` (string) |
| `cat`, `icon`, `stars`, `veg`, `name`, `lat`, `lng` | same names (`cat` → `category`) |
| `desc` / `info` / `consiglio` | `description` / `info` / `tip` |
| `url` / `img` / `booking` | `url` / `image` / `bookingUrl` |
| `indirizzo` / `telefono` / `placeid` | `address` / `phone` / `googlePlaceId` |
| `orario` / `chiusura` | `openingHours.text` (+ parsed `weekly`) / `openingHours.closures` |
| `costo`, `costo_yen` | `priceInfo` |
| `durata` / `come_arrivare` | `visitDuration` / `directions` |
| `aperto: CLOSED_TEMPORARILY` | `status: closedTemporarily` |
| `gf` | `glutenFree` |
| `vegliv`, `vegcert` | dropped (`veg` is enough) |
| `pshare` | dropped (share slug) |

~92% of the `orario` strings follow the pattern `Lunedì - Domenica: dalle 10 alle 17; Martedì: chiuso`
and can be converted to `weekly` automatically; the rest keep `text` only.
