import { api, HydrateClient } from '@/trpc/server'
import { InvoiceDetail } from './invoice-detail'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    void api.invoices.getById.prefetch({ id })

    return (
        <HydrateClient>
            <InvoiceDetail id={id} />
        </HydrateClient>
    )
}
