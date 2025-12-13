'use client'

import { useAppConfig } from '@/components/providers/app-config-provider'
import { Eye, EyeOff } from 'lucide-react'
import classNames from 'classnames'

interface ConfigurableProps {
    configKey: string
    children: React.ReactNode
    className?: string
    defaultVisible?: boolean
    as?: any // polymorphic? simple div ok for now
}

export function Configurable({
    configKey,
    children,
    className,
    defaultVisible = true
}: ConfigurableProps) {
    const { isVisible, isDesignMode, toggleConfig } = useAppConfig()
    const visible = isVisible(configKey, defaultVisible)

    if (!isDesignMode) {
        if (!visible) return null
        return <>{children}</>
    }

    // Design Mode
    return (
        <div className={classNames('relative group border-2 border-transparent rounded transition-all', className, {
            'border-dashed border-red-300 bg-red-50/50': !visible,
            'hover:border-blue-400': visible && !(!visible)
        })}>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleConfig(configKey)
                }}
                className={classNames(
                    'absolute -top-3 -right-3 z-50 p-1.5 rounded-full shadow-sm border border-gray-200 cursor-pointer',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    visible ? 'bg-white hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100 opacity-100 ring-2 ring-red-200'
                )}
                title={visible ? "Hide this component" : "Show this component"}
            >
                {visible ? <EyeOff className="h-3 w-3 text-gray-500" /> : <Eye className="h-3 w-3 text-red-600" />}
            </button>

            <div className={classNames({ 'opacity-50 grayscale pointer-events-none select-none': !visible })}>
                {children}
            </div>
        </div>
    )
}
