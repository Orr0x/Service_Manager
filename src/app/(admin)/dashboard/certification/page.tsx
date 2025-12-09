import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CertificationManager from '@/components/certification/CertificationManager'

export default async function CertificationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/sign-in')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Business Certification
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Manage your business-level certifications, insurance documents, and legal requirements.
                </p>
            </div>

            <CertificationManager
                entityType="tenant"
                entityId={user.user_metadata.tenant_id}
            />
        </div>
    )
}
