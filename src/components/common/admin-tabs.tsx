'use client'

import type { ElementType } from 'react'

type AdminTab = {
    id: string
    name: string
    icon?: ElementType
    badge?: string | number
    count?: string | number
}

type AdminTabsProps = {
    tabs: AdminTab[]
    activeTab: string
    onChange: (tabId: string) => void
    className?: string
}

export function AdminTabs({ tabs, activeTab, onChange, className = '' }: AdminTabsProps) {
    const mobileColumns = tabs.length > 6 ? 6 : tabs.length

    return (
        <div className={`${className} border-b border-gray-200 sm:overflow-x-auto`}>
            <nav
                className="grid gap-x-1 gap-y-1 sm:-mb-px sm:flex sm:min-w-max sm:gap-8"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, mobileColumns)}, minmax(0, 1fr))` }}
                aria-label="Tabs"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon
                    const badge = tab.badge ?? tab.count

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            aria-label={tab.name}
                            title={tab.name}
                            className={`
                                group inline-flex min-h-12 w-full items-center justify-center border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:min-w-0 sm:w-auto sm:justify-start sm:px-1 sm:py-4
                                ${isActive
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                            `}
                        >
                            {Icon ? (
                                <Icon
                                    className={`
                                        h-5 w-5 shrink-0 sm:-ml-0.5 sm:mr-2
                                        ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                                    `}
                                    aria-hidden
                                />
                            ) : (
                                <span
                                    aria-hidden
                                    className={`
                                        flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:hidden
                                        ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}
                                    `}
                                >
                                    {tab.name.slice(0, 1).toUpperCase()}
                                </span>
                            )}
                            <span className="hidden whitespace-nowrap sm:inline">{tab.name}</span>
                            {badge !== undefined && (
                                <span className={`ml-2 hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'}`}>
                                    {badge}
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
