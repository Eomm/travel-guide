import type { LogisticsList } from '../../../model/edit.ts'

/** The open key and issue path of a logistics item, e.g. `logistics.reservations[0]`. */
export const itemKey = (list: LogisticsList, index: number) => `logistics.${list}[${index}]`
