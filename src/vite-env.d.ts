/// <reference types="vite/client" />
/// <reference types="google.maps" />

interface ImportMetaEnv {
  /** Google Maps browser key: without it there is no embedded map (see README "Google Maps"). */
  readonly VITE_GMAPS_KEY?: string
  /** Map ID for Advanced Markers and cloud styling. */
  readonly VITE_GMAPS_MAP_ID?: string
}
