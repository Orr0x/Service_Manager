'use client';

import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from 'next/link';
import { api } from "@/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestServicePage() {
    const router = useRouter();
    const { data: sites } = api.customerPortal.getJobSites.useQuery();
    const requestMutation = api.customerPortal.requestService.useMutation({
        onSuccess: () => {
            router.push('/customer?success=request_submitted');
            router.refresh();
        }
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        jobSiteId: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestMutation.mutate(formData);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
                <Link href="/customer" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">Request Service</h1>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">

                    {/* Service Type / Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            What do you need help with? <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Leaking faucet, Weekly cleaning..."
                            className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                            value={formData.jobSiteId}
                            onChange={(e) => setFormData({ ...formData, jobSiteId: e.target.value })}
                        >
                            <option value="">Select a location (Optional)</option>
                            {sites?.map(site => (
                                <option key={site.id} value={site.id}>
                                    {site.name || site.address} - {site.city}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Details
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Please describe the issue or service needed..."
                            className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={requestMutation.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {requestMutation.isPending ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Submit Request
                            </>
                        )}
                    </button>

                    {requestMutation.error && (
                        <div className="text-red-500 text-sm text-center">
                            {requestMutation.error.message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
