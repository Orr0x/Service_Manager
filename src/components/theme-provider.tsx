'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ThemeProviderProps {
    children: React.ReactNode
    branding: {
        primary_color: string
        secondary_color: string
    }
}

export function ThemeProvider({ children, branding }: ThemeProviderProps) {
    const router = useRouter()

    // Apply CSS variables to the root element
    useEffect(() => {
        const root = document.documentElement
        root.style.setProperty('--primary-color', branding.primary_color)
        root.style.setProperty('--secondary-color', branding.secondary_color)
    }, [branding])

    return <>{children}</>
}
