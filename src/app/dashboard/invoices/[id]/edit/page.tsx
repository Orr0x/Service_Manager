import { EditInvoiceForm } from './edit-invoice-form'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <EditInvoiceForm id={id} />
}
