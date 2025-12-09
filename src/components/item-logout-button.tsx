'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/sign-in')
    }

    return (
        <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
            Logout
        </button>
    )
}
