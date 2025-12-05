import { api, HydrateClient } from '@/trpc/server'
import { CustomerDetail } from './customer-detail'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    void api.customers.getById.prefetch({ id })

    return (
        <HydrateClient>
            <CustomerDetail id={id} />
        </HydrateClient>
    )
}
