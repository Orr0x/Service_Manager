import { Suspense } from 'react'
import { JobDetail } from '@/app/dashboard/jobs/[id]/job-detail'
import { notFound } from 'next/navigation'

export default async function JobDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    if (!id) return notFound()

    return (
        <div className="space-y-6">
            <Suspense fallback={<div>Loading job details...</div>}>
                <JobDetail id={id} />
            </Suspense>
        </div>
    )
}
