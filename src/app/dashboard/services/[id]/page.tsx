import { api, HydrateClient } from '@/trpc/server'
import { ServiceDetail } from './service-detail'

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    void api.services.getById.prefetch({ id })

    return (
        <HydrateClient>
            <ServiceDetail id={id} />
        </HydrateClient>
    )
}
