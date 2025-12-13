'use client';

import { api } from '@/trpc/react';
import Link from 'next/link';
import { FileText, AlertTriangle, Wrench, Info, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkerReportsPage() {
    const { data: reports, isLoading } = api.reports.getAll.useQuery();

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'damage': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'maintenance': return <Wrench className="h-4 w-4 text-orange-500" />;
            case 'incident': return <AlertTriangle className="h-4 w-4 text-red-600" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'reviewed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
                {/* Optional: Add 'New Report' button here if generic reports are allowed */}
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            ) : reports && reports.length > 0 ? (
                <div className="grid gap-4">
                    {reports.map((report: any) => (
                        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:border-indigo-200">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full bg-gray-50 flex-shrink-0`}>
                                        {getTypeIcon(report.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">{report.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{report.description}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${getStatusColor(report.status)}`}>
                                    {report.status}
                                </span>
                            </div>

                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 ml-11">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</span>
                                </div>
                                {report.jobs && (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <FileText className="h-3 w-3" />
                                        <span className="truncate">
                                            Job: {report.jobs.title}
                                            <span className="text-gray-400"> ({report.jobs.customers?.business_name || report.jobs.customers?.contact_name})</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Check Reports</h3>
                    <p className="text-gray-500 text-sm mt-1">You haven't submitted any reports yet.</p>
                </div>
            )}
        </div>
    );
}
