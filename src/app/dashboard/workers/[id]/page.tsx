import { api, HydrateClient } from '@/trpc/server'
import { WorkerDetail } from './worker-detail'

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    await api.workers.getById.prefetch({ id })

    return (
        <HydrateClient>
            <WorkerDetail id={id} />
        </HydrateClient>
    )
}
