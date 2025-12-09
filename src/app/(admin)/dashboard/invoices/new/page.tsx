'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

export default function NewInvoicePage() {
    const router = useRouter()
    const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0, total: 0 }])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

    const { data: customers } = api.customers.getAll.useQuery()
    const { data: jobSites } = api.jobSites.getByCustomerId.useQuery(
        { customerId: selectedCustomerId },
        { enabled: !!selectedCustomerId }
    )

    const createInvoice = api.invoices.create.useMutation({
        onSuccess: () => {
            router.push('/dashboard/invoices')
            router.refresh()
        },
    })

    const { data: settings } = api.settings.getSettings.useQuery()
    const terminology = (settings?.terminology as Record<string, string>) || {}
    const getLabel = (key: string, defaultLabel: string) => terminology[key] || defaultLabel

    // Calculate item total when quantity or price changes
    const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items]
        const item = newItems[index]

        if (field === 'description') {
            item.description = value as string
        } else if (field === 'quantity') {
            item.quantity = Number(value)
            item.total = item.quantity * item.unitPrice
        } else if (field === 'unitPrice') {
            item.unitPrice = Number(value)
            item.total = item.quantity * item.unitPrice
        }

        setItems(newItems)
    }

    // Add new item row
    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
    }

    // Remove item row
    const removeItem = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index)
            setItems(newItems)
        }
    }

    // Calculate grand total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

    async function onSubmit(formData: FormData) {
        const customerId = formData.get('customerId') as string
        const jobSiteId = formData.get('jobSiteId') as string
        const status = formData.get('status') as string
        const issueDate = formData.get('issueDate') as string
        const dueDate = formData.get('dueDate') as string
        const notes = formData.get('notes') as string

        // Filter out empty items
        const validItems = items.filter(item => item.description.trim() !== '')

        createInvoice.mutate({
            customerId,
            jobSiteId: jobSiteId || undefined,
            status,
            issueDate,
            dueDate,
            totalAmount: grandTotal,
            items: validItems,
            notes: notes || undefined,
        })
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        New Invoice
                    </h2>
                </div>
            </div>

            <form action={onSubmit} className="mt-8 space-y-8">
                {createInvoice.error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error creating invoice: {createInvoice.error.message}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">Invoice Details</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">General information about the invoice.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="customerId" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('invoices.customerId', 'Customer')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="customerId"
                                    name="customerId"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    value={selectedCustomerId}
                                >
                                    <option value="">Select a customer</option>
                                    {customers?.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.business_name || customer.contact_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="jobSiteId" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('invoices.jobSiteId', 'Job Site')}
                            </label>
                            <div className="mt-2">
                                <select
                                    id="jobSiteId"
                                    name="jobSiteId"
                                    disabled={!selectedCustomerId}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Select a job site (optional)</option>
                                    {jobSites?.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('invoices.status', 'Status')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <select
                                    id="status"
                                    name="status"
                                    required
                                    defaultValue="draft"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="issueDate" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('invoices.issueDate', 'Issue Date')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="issueDate"
                                    id="issueDate"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="dueDate" className="block text-sm font-medium leading-6 text-gray-900">
                                {getLabel('invoices.dueDate', 'Due Date')} <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="dueDate"
                                    id="dueDate"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold leading-7 text-gray-900">Line Items</h3>
                            <p className="mt-1 text-sm leading-6 text-gray-600">Add services or products to this invoice.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-2 text-right">Price</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-6">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                        placeholder="Item description"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-right text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                            <span className="text-gray-500 sm:text-sm">£</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                            className="block w-full rounded-md border-0 py-1.5 pl-6 text-right text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-x-2">
                                    <span className="text-sm font-medium text-gray-900">£{item.total.toFixed(2)}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end border-t border-gray-200 pt-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">£{grandTotal.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-full">
                    <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
                        {getLabel('invoices.notes', 'Notes')}
                    </label>
                    <div className="mt-2">
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Payment instructions or additional notes..."
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createInvoice.isPending}
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    >
                        {createInvoice.isPending ? 'Creating Invoice...' : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    )
}
