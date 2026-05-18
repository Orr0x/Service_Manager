'use client'

import { Search, X } from 'lucide-react'

export type DataViewOption = {
    value: string
    label: string
}

type DataViewControlsProps = {
    search: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    sortBy: string
    onSortByChange: (value: string) => void
    sortOptions: DataViewOption[]
    sortDirection: 'asc' | 'desc'
    onSortDirectionChange: (value: 'asc' | 'desc') => void
    groupBy: string
    onGroupByChange: (value: string) => void
    groupOptions: DataViewOption[]
    filters?: Array<{
        id: string
        label: string
        value: string
        options: DataViewOption[]
        onChange: (value: string) => void
    }>
    onReset?: () => void
}

export function DataViewControls({
    search,
    onSearchChange,
    searchPlaceholder = 'Search...',
    sortBy,
    onSortByChange,
    sortOptions,
    sortDirection,
    onSortDirectionChange,
    groupBy,
    onGroupByChange,
    groupOptions,
    filters = [],
    onReset,
}: DataViewControlsProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,auto))]">
                <label className="text-sm lg:col-span-1">
                    <span className="sr-only">Search</span>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
                        />
                    </div>
                </label>

                {filters.map((filter) => (
                    <label key={filter.id} className="text-sm">
                        <span className="mb-1 block font-medium text-gray-700">{filter.label}</span>
                        <select
                            value={filter.value}
                            onChange={(event) => filter.onChange(event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                            {filter.options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                ))}

                <label className="text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Sort by</span>
                    <select
                        value={sortBy}
                        onChange={(event) => onSortByChange(event.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>

                <label className="text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Direction</span>
                    <select
                        value={sortDirection}
                        onChange={(event) => onSortDirectionChange(event.target.value as 'asc' | 'desc')}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </label>

                <label className="text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Group by</span>
                    <select
                        value={groupBy}
                        onChange={(event) => onGroupByChange(event.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                        {groupOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </label>

                {onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 lg:self-end"
                    >
                        <X className="h-4 w-4" />
                        Reset
                    </button>
                )}
            </div>
        </div>
    )
}
