'use client';

import { ArrowLeft, Clock, MapPin, Home, Key, User, Wrench, FileText, ChevronDown, Navigation, AlertTriangle, Play, ClipboardList, CheckSquare, Square } from "lucide-react";
import Link from 'next/link';
import { api } from "@/trpc/react";
import { use, useState } from "react";
import { format } from 'date-fns';
import { ReportIssueModal } from "@/components/report-issue-modal";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const utils = api.useUtils();
    const { data: job, isLoading, error } = api.worker.getJobDetails.useQuery({ jobId: id });
    const updateChecklist = api.worker.updateChecklistItem.useMutation({
        onSuccess: () => {
            utils.worker.getJobDetails.invalidate({ jobId: id });
        }
    });

    // Accordion states
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        schedule: false,
        property: true,
        access: false,
        customer: false,

        maintenance: false,
        checklists: false,

        notes: false
    });

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading job details...</div>;
    if (error || !job) return <div className="p-8 text-center text-red-500">Job not found or access denied.</div>;

    const startTime = job.start_time ? new Date(job.start_time) : null;
    const endTime = job.end_time ? new Date(job.end_time) : null;
    const duration = startTime && endTime ?
        ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1) + 'h' : 'TBD';

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            {/* Page Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/worker/jobs" className="p-1 -ml-1 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">
                            {startTime ? format(startTime, 'EEEE, MMMM d, yyyy') : 'Date TBD'}
                        </h1>
                    </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize
                    ${job.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                    {job.status.replace('_', ' ')}
                </span>
            </div>

            <div className="p-4 space-y-3">

                {/* Schedule Accordion */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.schedule}
                    onClick={(e) => { e.preventDefault(); toggleSection('schedule'); }}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Schedule
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.schedule ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.schedule && (
                        <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                            <p className="font-medium text-gray-900">
                                {startTime ? format(startTime, 'HH:mm') : '--:--'} - {endTime ? format(endTime, 'HH:mm') : '--:--'}
                            </p>
                            <p>Duration: {duration}</p>
                        </div>
                    )}
                </details>

                {/* Property Info Accordion */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.property}
                    onClick={(e) => { e.preventDefault(); toggleSection('property'); }}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Home className="h-5 w-5 text-gray-500" />
                            Property Information
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.property ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.property && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                            <div className="flex items-start gap-2 text-gray-900 text-sm">
                                <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                                {job.job_sites?.address}, {job.job_sites?.city} {job.job_sites?.zip_code}
                            </div>

                            <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(`${job.job_sites?.address}, ${job.job_sites?.city}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
                            >
                                <Navigation className="h-4 w-4" />
                                Navigate Here
                            </a>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Type</span>
                                    <span className="text-xs font-bold text-gray-900">{job.job_sites?.site_type || 'N/A'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Parking</span>
                                    <span className="text-xs font-bold text-gray-900">{job.job_sites?.parking_info || 'N/A'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Gate Code</span>
                                    <span className="text-xs font-bold text-gray-900">{job.job_sites?.gate_code || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </details>

                {/* Access Info */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.access}
                    onClick={(e) => { e.preventDefault(); toggleSection('access'); }}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Key className="h-5 w-5 text-gray-500" />
                            Access Information
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.access ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.access && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
                            <p className="whitespace-pre-wrap">{job.job_sites?.access_instructions || 'No explicit access instructions.'}</p>
                        </div>
                    )}
                </details>

                {/* Customer Info */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.customer}
                    onClick={(e) => { e.preventDefault(); toggleSection('customer'); }}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <User className="h-5 w-5 text-gray-500" />
                            Customer Information
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.customer ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.customer && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 text-sm space-y-2">
                            <p><span className="font-medium text-gray-900">Name:</span> {job.customers?.business_name || job.customers?.contact_name}</p>
                            <p><span className="font-medium text-gray-900">Contact:</span> {job.customers?.phone || 'N/A'}</p>
                            <p><span className="font-medium text-gray-900">Email:</span> {job.customers?.email || 'N/A'}</p>
                        </div>
                    )}
                </details>

                {/* Checklists */}
                {job.job_checklists && job.job_checklists.length > 0 && (
                    <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                        open={openSections.checklists}
                        onClick={(e) => { e.preventDefault(); toggleSection('checklists'); }}
                    >
                        <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                            <div className="flex items-center gap-3 font-semibold text-gray-900">
                                <ClipboardList className="h-5 w-5 text-gray-500" />
                                Checklists
                            </div>
                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.checklists ? 'rotate-180' : ''}`} />
                        </summary>
                        {openSections.checklists && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                                {job.job_checklists.map((checklist: any) => {
                                    const displayItems = (checklist.items && checklist.items.length > 0)
                                        ? checklist.items
                                        : checklist.checklists?.items || [];

                                    return (
                                        <div key={checklist.id} className="space-y-2">
                                            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                                {checklist.checklists?.name || 'Checklist'}
                                            </h4>
                                            <div className="space-y-2 pl-1">
                                                {displayItems.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            // Toggle item locally
                                                            const newItems = [...displayItems];
                                                            newItems[idx] = { ...item, isCompleted: !item.isCompleted };

                                                            try {
                                                                await updateChecklist.mutateAsync({
                                                                    jobChecklistId: checklist.id,
                                                                    items: newItems
                                                                });
                                                            } catch (err) {
                                                                console.error('Failed to update checklist item', err);
                                                                // Ideally revert optimistic update here if we had local state
                                                            }
                                                        }}
                                                    >
                                                        <div className={`mt-0.5 ${item.isCompleted ? 'text-green-600' : 'text-gray-300'}`}>
                                                            {item.isCompleted ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                        </div>
                                                        <span className={`text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                            {item.text}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(!displayItems || displayItems.length === 0) && (
                                                    <p className="text-gray-400 text-xs italic ml-2">No items in this checklist.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </details>
                )}

                {/* Maintenance Issues */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.maintenance}
                    onClick={(e) => { e.preventDefault(); toggleSection('maintenance'); }}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <Wrench className="h-5 w-5 text-gray-500" />
                            Maintenance Issues
                            {/* Count would require a separate query/relation for reports */}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.maintenance ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.maintenance && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                            {job.worker_reports && job.worker_reports.length > 0 ? (
                                job.worker_reports.map((report: any) => (
                                    <div key={report.id} className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-gray-900 text-sm">{report.title}</h4>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border
                                                ${report.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                {report.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{report.description}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            <span>{format(new Date(report.created_at), 'MMM d, h:mm a')}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-2">
                                    No open issues reported by you.
                                </div>
                            )}
                        </div>
                    )}
                </details>

                {/* Job Notes */}
                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.notes}
                    onClick={(e) => { e.preventDefault(); toggleSection('notes'); }}
                >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <FileText className="h-5 w-5 text-gray-500" />
                            Job Notes
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.notes ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.notes && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
                            <p className="whitespace-pre-wrap">{job.description || 'No description provided.'}</p>
                        </div>
                    )}
                </details>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                    <Wrench className="h-5 w-5" />
                    Report Maintenance Issue
                </button>
                {job.status !== 'completed' && (
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
                        <Play className="h-5 w-5 fill-current" />
                        {job.status === 'in_progress' ? 'Complete Job' : 'Start Job'}
                    </button>
                )}
            </div>


            <ReportIssueModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                jobId={job.id}
            />
        </div >
    );
}
