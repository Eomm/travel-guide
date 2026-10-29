export interface Issue {
  /** Location in the trip file, e.g. `days[0].stops[1].time`; empty for the whole file. */
  path: string
  message: string
}

export function formatIssue({ path, message }: Issue): string {
  return path ? `${path}: ${message}` : message
}

/** `['days', 0, 'stops', 1]` → `days[0].stops[1]` */
export function formatPath(segments: (string | number)[]): string {
  return segments.reduce<string>((path, segment) => {
    if (typeof segment === 'number') return `${path}[${segment}]`
    return path ? `${path}.${segment}` : segment
  }, '')
}
