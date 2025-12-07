'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export function SearchInput({
    placeholder = 'Search...',
    className,
}: {
    placeholder?: string
    className?: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Initial value from URL
    const initialSearch = searchParams.get('search') || ''
    const [value, setValue] = useState(initialSearch)

    // Debounce the value to avoid hitting the server on every keystroke
    const debouncedValue = useDebounce(value, 500)

    useEffect(() => {
        const params = new URLSearchParams(searchParams)

        if (debouncedValue) {
            params.set('search', debouncedValue)
        } else {
            params.delete('search')
        }

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`)
        })
    }, [debouncedValue, pathname, router, searchParams])

    return (
        <div className={`relative ${className}`}>
            <label htmlFor="search" className="sr-only">
                Search
            </label>
            <div className="relative w-full text-gray-400 focus-within:text-[var(--primary-color)]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5" aria-hidden="true" />
                </div>
                <input
                    id="search"
                    className="block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--primary-color)] sm:text-sm sm:leading-6"
                    placeholder={placeholder}
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                {isPending && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    </div>
                )}
            </div>
        </div>
    )
}
