export type GroupedRows<T> = Array<{
    key: string
    label: string
    rows: T[]
}>

export function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc' = 'asc') {
    const multiplier = direction === 'asc' ? 1 : -1

    if (a == null && b == null) return 0
    if (a == null) return 1
    if (b == null) return -1

    if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * multiplier
    }

    const aDate = typeof a === 'string' ? Date.parse(a) : Number.NaN
    const bDate = typeof b === 'string' ? Date.parse(b) : Number.NaN
    if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
        return (aDate - bDate) * multiplier
    }

    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * multiplier
}

export function groupRows<T>(
    rows: T[],
    groupBy: string,
    getGroup: (row: T, groupBy: string) => { key: string; label: string }
): GroupedRows<T> {
    if (!groupBy || groupBy === 'none') {
        return [{ key: 'all', label: 'All', rows }]
    }

    const groups = new Map<string, { key: string; label: string; rows: T[] }>()

    rows.forEach((row) => {
        const group = getGroup(row, groupBy)
        if (!groups.has(group.key)) {
            groups.set(group.key, { ...group, rows: [] })
        }
        groups.get(group.key)?.rows.push(row)
    })

    return Array.from(groups.values())
}

export function includesSearch(values: Array<unknown>, search: string) {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return true

    return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))
}
