'use client'

import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Users, Briefcase, HardHat, Building2, UserSquare2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Define the fields for each form
const formFields = {
    customers: [
        { key: 'customers.business_name', label: 'Business Name', default: 'Business Name' },
        { key: 'customers.contact_name', label: 'Contact Person Name', default: 'Contact Person Name' },
        { key: 'customers.type', label: 'Customer Type', default: 'Customer Type' },
        { key: 'customers.email', label: 'Email Address', default: 'Email Address' },
        { key: 'customers.phone', label: 'Phone Number', default: 'Phone Number' },
        { key: 'customers.address', label: 'Address Line 1', default: 'Address Line 1' },
        { key: 'customers.city', label: 'City', default: 'City' },
        { key: 'customers.postalCode', label: 'Postcode', default: 'Postcode' },
        { key: 'customers.country', label: 'Country', default: 'Country' },
        { key: 'customers.paymentTerms', label: 'Payment Terms', default: 'Payment Terms' },
        { key: 'customers.engagementType', label: 'Engagement Type', default: 'Engagement Type' },
    ],
    jobs: [
        { key: 'jobs.title', label: 'Job Title', default: 'Job Title' },
        { key: 'jobs.description', label: 'Description', default: 'Description' },
        { key: 'jobs.priority', label: 'Priority', default: 'Priority' },
        { key: 'jobs.customerId', label: 'Customer', default: 'Customer' },
        { key: 'jobs.jobSiteId', label: 'Job Site', default: 'Job Site' },
        { key: 'jobs.startTime', label: 'Start Time', default: 'Start Time' },
        { key: 'jobs.endTime', label: 'End Time', default: 'End Time' },
        { key: 'jobs.assignments', label: 'Assignments', default: 'Assignments' },
    ],
    workers: [
        { key: 'workers.firstName', label: 'First Name', default: 'First Name' },
        { key: 'workers.lastName', label: 'Last Name', default: 'Last Name' },
        { key: 'workers.email', label: 'Email Address', default: 'Email Address' },
        { key: 'workers.phone', label: 'Phone Number', default: 'Phone Number' },
        { key: 'workers.role', label: 'Role', default: 'Role' },
        { key: 'workers.status', label: 'Status', default: 'Status' },
        { key: 'workers.hourlyRate', label: 'Hourly Rate', default: 'Hourly Rate' },
        { key: 'workers.skills', label: 'Skills', default: 'Skills' },
        { key: 'workers.licenses', label: 'Licenses & Certifications', default: 'Licenses & Certifications' },
        { key: 'workers.areaPostcode', label: 'Area Postcode', default: 'Area Postcode' },
        { key: 'workers.areaRadius', label: 'Area Radius (Miles)', default: 'Area Radius (Miles)' },
        { key: 'workers.hasOwnTransport', label: 'Has Own Transport', default: 'Has Own Transport' },
    ],
    contractors: [
        { key: 'contractors.companyName', label: 'Company Name', default: 'Company Name' },
        { key: 'contractors.contactName', label: 'Contact Person', default: 'Contact Person' },
        { key: 'contractors.status', label: 'Status', default: 'Status' },
        { key: 'contractors.email', label: 'Email', default: 'Email' },
        { key: 'contractors.phone', label: 'Phone', default: 'Phone' },
        { key: 'contractors.specialties', label: 'Specialties', default: 'Specialties' },
        { key: 'contractors.profile-photo', label: 'Profile Picture', default: 'Profile Picture' },
        { key: 'contractors.area-postcode', label: 'Area Covered (Postcode)', default: 'Area Covered (Postcode)' },
        { key: 'contractors.area-radius', label: 'Area Radius (Miles)', default: 'Area Radius (Miles)' },
        { key: 'contractors.transport', label: 'Has Own Transport', default: 'Has Own Transport' },
        { key: 'contractors.licenses', label: 'Licenses', default: 'Licenses' },
    ],
    job_sites: [
        { key: 'job_sites.name', label: 'Site Name', default: 'Site Name' },
        { key: 'job_sites.customerId', label: 'Customer', default: 'Customer' },
        { key: 'job_sites.address', label: 'Address', default: 'Address' },
        { key: 'job_sites.city', label: 'City', default: 'City' },
        { key: 'job_sites.postalCode', label: 'Postcode', default: 'Postcode' },
        { key: 'job_sites.country', label: 'Country', default: 'Country' },
        { key: 'job_sites.siteType', label: 'Site Type', default: 'Site Type' },
        { key: 'job_sites.latitude', label: 'Latitude', default: 'Latitude' },
        { key: 'job_sites.longitude', label: 'Longitude', default: 'Longitude' },
        { key: 'job_sites.what3words', label: 'What3Words', default: 'What3Words' },
        { key: 'job_sites.accessInstructions', label: 'Access Instructions', default: 'Access Instructions' },
        { key: 'job_sites.securityCodes', label: 'Security Codes', default: 'Security Codes' },
        { key: 'job_sites.keyHolder', label: 'Key Holder', default: 'Key Holder' },
        { key: 'job_sites.parkingInfo', label: 'Parking Information', default: 'Parking Information' },
        { key: 'job_sites.facilities', label: 'Facilities', default: 'Facilities' },
    ],
    quotes: [
        { key: 'quotes.customerId', label: 'Customer', default: 'Customer' },
        { key: 'quotes.jobSiteId', label: 'Job Site', default: 'Job Site' },
        { key: 'quotes.title', label: 'Quote Title', default: 'Quote Title' },
        { key: 'quotes.status', label: 'Status', default: 'Status' },
        { key: 'quotes.issuedDate', label: 'Issued Date', default: 'Issued Date' },
        { key: 'quotes.expiryDate', label: 'Expiry Date', default: 'Expiry Date' },
        { key: 'quotes.description', label: 'Description', default: 'Description' },
    ],
    invoices: [
        { key: 'invoices.customerId', label: 'Customer', default: 'Customer' },
        { key: 'invoices.jobSiteId', label: 'Job Site', default: 'Job Site' },
        { key: 'invoices.status', label: 'Status', default: 'Status' },
        { key: 'invoices.issueDate', label: 'Issue Date', default: 'Issue Date' },
        { key: 'invoices.dueDate', label: 'Due Date', default: 'Due Date' },
        { key: 'invoices.notes', label: 'Notes', default: 'Notes' },
    ],
    contracts: [
        { key: 'contracts.customerId', label: 'Customer', default: 'Customer' },
        { key: 'contracts.jobSiteId', label: 'Job Site', default: 'Job Site' },
        { key: 'contracts.name', label: 'Contract Name', default: 'Contract Name' },
        { key: 'contracts.type', label: 'Type', default: 'Type' },
        { key: 'contracts.status', label: 'Status', default: 'Status' },
        { key: 'contracts.startDate', label: 'Start Date', default: 'Start Date' },
        { key: 'contracts.endDate', label: 'End Date', default: 'End Date' },
        { key: 'contracts.amount', label: 'Value', default: 'Value' },
        { key: 'contracts.billingFrequency', label: 'Billing Frequency', default: 'Billing Frequency' },
        { key: 'contracts.description', label: 'Description', default: 'Description' },
    ],
    services: [
        { key: 'services.name', label: 'Service Name', default: 'Service Name' },
        { key: 'services.category', label: 'Category', default: 'Category' },
        { key: 'services.basePrice', label: 'Base Price', default: 'Base Price' },
        { key: 'services.durationMinutes', label: 'Duration', default: 'Duration' },
        { key: 'services.description', label: 'Description', default: 'Description' },
    ],
    checklists: [
        { key: 'checklists.name', label: 'Name', default: 'Name' },
        { key: 'checklists.description', label: 'Description', default: 'Description' },
        { key: 'checklists.isTemplate', label: 'Save as Template', default: 'Save as Template' },
    ]
}

type FormType = keyof typeof formFields

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

const tabs = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'workers', label: 'Workers', icon: HardHat },
    { id: 'contractors', label: 'Contractors', icon: UserSquare2 },
    { id: 'job_sites', label: 'Job Sites', icon: Building2 },
]

export default function FormSettingsPage() {
    const router = useRouter()
    const utils = api.useUtils()
    const { data: settings, isLoading } = api.settings.getSettings.useQuery()

    const updateTerminology = api.settings.updateTerminology.useMutation({
        onSuccess: () => {
            utils.settings.getSettings.invalidate()
            router.refresh()
            alert('Form field names updated successfully!')
        },
    })

    const [aliases, setAliases] = useState<Record<string, string>>({})
    const [activeTab, setActiveTab] = useState('customers')

    useEffect(() => {
        if (settings) {
            setAliases((settings.terminology as Record<string, string>) || {})
        }
    }, [settings])

    const handleAliasChange = (key: string, value: string) => {
        setAliases(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateTerminology.mutate(aliases)
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    const currentFields = formFields[activeTab as keyof typeof formFields] || []

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link href="/dashboard/settings" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to System Settings
                </Link>
            </div>
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Form Field Names
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Customize standard field labels to match your business terminology.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={updateTerminology.isPending}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {updateTerminology.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex flex-wrap gap-4" aria-label="Tabs">
                        {[
                            { id: 'customers', name: 'Customers' },
                            { id: 'jobs', name: 'Jobs' },
                            { id: 'job_sites', name: 'Job Sites' },
                            { id: 'workers', name: 'Workers' },
                            { id: 'contractors', name: 'Contractors' },
                            { id: 'quotes', name: 'Quotes' },
                            { id: 'invoices', name: 'Invoices' },
                            { id: 'contracts', name: 'Contracts' },
                            { id: 'services', name: 'Services' },
                            { id: 'checklists', name: 'Checklists' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as FormType)}
                                className={classNames(
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                                )}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Field List */}
                <div className="mt-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Standard Field Name</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Custom Alias (Optional)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {currentFields.map((field) => (
                                <tr key={field.key}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        {field.label}
                                        <p className="font-mono text-xs text-gray-400 mt-1">{field.key}</p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <input
                                            type="text"
                                            value={aliases[field.key] || ''}
                                            onChange={(e) => handleAliasChange(field.key, e.target.value)}
                                            placeholder={field.label}
                                            className="block w-full max-w-sm rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
