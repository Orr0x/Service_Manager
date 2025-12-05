import { api, HydrateClient } from '@/trpc/server'
import { QuoteDetail } from './quote-detail'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    void api.quotes.getById.prefetch({ id })

    return (
        <HydrateClient>
            <QuoteDetail id={id} />
        </HydrateClient>
    )
}
