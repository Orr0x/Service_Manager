import { LayoutGrid, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
    view: 'list' | 'grid'
    setView: (view: 'list' | 'grid') => void
}

export function ViewToggle({ view, setView }: ViewToggleProps) {
    return (
        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
            <button
                onClick={() => setView('list')}
                className={cn(
                    "flex items-center justify-center rounded-md p-1.5 transition-all text-sm font-medium",
                    view === 'list'
                        ? "bg-gray-100 text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
                title="List view"
            >
                <LayoutList className="h-4 w-4" />
                <span className="sr-only">List view</span>
            </button>
            <button
                onClick={() => setView('grid')}
                className={cn(
                    "flex items-center justify-center rounded-md p-1.5 transition-all text-sm font-medium",
                    view === 'grid'
                        ? "bg-gray-100 text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                )}
                title="Grid view"
            >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
            </button>
        </div>
    )
}
