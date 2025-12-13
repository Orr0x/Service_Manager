'use client';

import { api } from "@/trpc/react";
import Link from 'next/link';
import { format } from 'date-fns';
import { Configurable } from "@/components/ui/configurable";

export default function CustomerDashboard() {
    const { data: customer, isLoading: loadingProfile } = api.customerPortal.getProfile.useQuery();
    const { data: stats, isLoading: loadingStats } = api.customerPortal.getDashboardStats.useQuery();
    const { data: activeJobs, isLoading: loadingJobs } = api.customerPortal.getActiveJobs.useQuery({ limit: 5 });

    const displayName = customer ? (customer.business_name || customer.contact_name) : 'Customer';

    if (loadingProfile && !customer) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-slate-400">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <section>
                <h2 className="text-3xl font-bold text-slate-800">Welcome home, {displayName}.</h2>
                <p className="text-slate-500 mt-2">Manage your scheduled services, view invoices, and request new jobs.</p>
            </section>

            {/* Quick Stats Grid */}
            <Configurable configKey="customer.dashboard.stats">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Jobs</div>
                        <div className="text-2xl font-bold text-slate-900">{loadingStats ? '-' : stats?.activeJobs}</div>
                        <Link href="/customer/jobs" className="text-emerald-600 text-sm mt-2 font-medium inline-block hover:underline">View Schedule &rarr;</Link>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Open Requests</div>
                        <div className="text-2xl font-bold text-slate-900">{loadingStats ? '-' : stats?.openQuotes}</div>
                        <div className="text-slate-400 text-sm mt-2">Pending quotes</div>
                    </div>

                    <Configurable configKey="customer.dashboard.requestService">
                        <Link href="/customer/request" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group block">
                            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-200 transition-colors">
                                <span className="text-xl font-bold">+</span>
                            </div>
                            <div className="font-semibold text-slate-900">Request Service</div>
                            <div className="text-slate-500 text-sm">Book a new job online</div>
                        </Link>
                    </Configurable>
                </div>
            </Configurable>

            {/* Recent Activity / Jobs List */}
            <Configurable configKey="customer.dashboard.activeJobs">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800">Upcoming & Active Jobs</h3>
                        <Link href="/customer/jobs" className="text-sm text-emerald-600 font-medium hover:text-emerald-700">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {loadingJobs && <div className="p-6 text-center text-slate-400">Loading jobs...</div>}

                        {!loadingJobs && activeJobs?.length === 0 && (
                            <div className="p-6 text-center text-slate-400">No active jobs found.</div>
                        )}

                        {activeJobs?.map((job) => (
                            <Link href={`/customer/jobs/${job.id}`} key={job.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer block">
                                <div>
                                    <div className="font-medium text-slate-900">{job.title}</div>
                                    <div className="text-sm text-slate-500">
                                        {job.start_time ? format(new Date(job.start_time), 'MMM d, yyyy') : 'Date TBD'}
                                        {' '}&bull;{' '}
                                        <span className="text-slate-400">
                                            {Array.isArray(job.job_sites) ? (job.job_sites[0]?.address || 'No Location') : (job.job_sites?.address || 'No Location')}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                                    ${job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'}`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </Configurable>
        </div>
    );
}
