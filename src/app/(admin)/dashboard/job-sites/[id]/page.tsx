import { api, HydrateClient } from '@/trpc/server'
import { JobSiteDetail } from './job-site-detail'

export default async function JobSiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await api.jobSites.getById.prefetch({ id })

    return (
        <HydrateClient>
            <JobSiteDetail id={id} />
        </HydrateClient>
    )
}
