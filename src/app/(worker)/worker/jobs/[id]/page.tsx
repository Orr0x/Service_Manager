'use client';

import { ArrowLeft, Clock, MapPin, Home, Key, User, Wrench, FileText, ChevronDown, Navigation, Play, ClipboardList, CheckSquare, Square, Camera, ExternalLink, RefreshCw, Send } from "lucide-react";
import Link from 'next/link';
import { api } from "@/trpc/react";
import { use, useState } from "react";
import { format } from 'date-fns';
import { ReportIssueModal } from "@/components/report-issue-modal";
import { createClient } from "@/utils/supabase/client";

type ChecklistItem = {
    text?: string;
    isCompleted?: boolean;
}

type JobChecklist = {
    id: string;
    items?: ChecklistItem[] | null;
    checklists?: {
        name?: string | null;
        items?: ChecklistItem[] | null;
    } | null;
}

type WorkerReport = {
    id: string;
    title?: string | null;
    description?: string | null;
    status?: string | null;
    created_at: string;
}

type JobPhoto = {
    id: string;
    photo_type: 'before' | 'during' | 'after';
    description?: string | null;
    file_name: string;
    status: string;
    google_drive_web_view_link?: string | null;
    last_error?: string | null;
    created_at: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const utils = api.useUtils();
    const { data: job, isLoading, error } = api.worker.getJobDetails.useQuery({ jobId: id });
    const updateChecklist = api.worker.updateChecklistItem.useMutation({
        onSuccess: () => {
            utils.worker.getJobDetails.invalidate({ jobId: id });
        }
    });
    const startJob = api.worker.startJob.useMutation({
        onSuccess: () => {
            setActionError(null);
            utils.worker.getJobDetails.invalidate({ jobId: id });
        },
        onError: (mutationError) => {
            setActionError(mutationError.message);
        },
    });
    const completeJob = api.worker.completeJob.useMutation({
        onSuccess: () => {
            setActionError(null);
            utils.worker.getJobDetails.invalidate({ jobId: id });
        },
        onError: (mutationError) => {
            setActionError(mutationError.message);
        },
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
    const [actionError, setActionError] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState('');

    const notesQuery = api.notes.getByEntity.useQuery(
        { entityType: 'job', entityId: id },
        { enabled: openSections.notes }
    );
    const createNote = api.notes.create.useMutation({
        onSuccess: () => {
            setNoteContent('');
            utils.notes.getByEntity.invalidate({ entityType: 'job', entityId: id });
        }
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };
    const handleSectionToggle = (section: string) => (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        toggleSection(section);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading job details...</div>;
    if (error || !job) return <div className="p-8 text-center text-red-500">Job not found or access denied.</div>;

    const startTime = job.start_time ? new Date(job.start_time) : null;
    const endTime = job.end_time ? new Date(job.end_time) : null;
    const duration = startTime && endTime ?
        ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1) + 'h' : 'TBD';

    // Extract coordinates if available, otherwise defaulting to null (UI will handle)
    const coordinates = job.job_sites?.latitude && job.job_sites?.longitude
        ? { lat: job.job_sites.latitude, lng: job.job_sites.longitude }
        : null;

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) return undefined;

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000,
                });
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
            };
        } catch {
            return undefined;
        }
    };

    const handlePrimaryAction = async () => {
        setActionError(null);
        const location = await getCurrentLocation();

        try {
            if (job.status === 'in_progress') {
                await completeJob.mutateAsync({ jobId: id, location });
            } else {
                await startJob.mutateAsync({ jobId: id, location });
            }
        } catch {
            // The mutation onError handlers surface the server reason in the UI.
        }
    };

    const isActionPending = startJob.isPending || completeJob.isPending;
    const canAddEvidence = job.status === 'in_progress' || job.status === 'completed';

    const handleNoteSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!noteContent.trim()) return;
        createNote.mutate({ entityType: 'job', entityId: id, content: noteContent });
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-[calc(11rem+var(--impersonation-banner-offset,0px))]">
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
                >
                    <summary
                        className="flex items-center justify-between p-4 cursor-pointer list-none"
                        onClick={handleSectionToggle('schedule')}
                    >
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
                >
                    <summary
                        className="flex items-center justify-between p-4 cursor-pointer list-none"
                        onClick={handleSectionToggle('property')}
                    >
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

                            <div className="flex flex-col gap-2">
                                <Link
                                    href={`/worker/navigation?destination=${coordinates ? `${coordinates.lat},${coordinates.lng}` : ''}`}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
                                    onClick={(e) => {
                                        if (!coordinates) {
                                            e.preventDefault();
                                            alert('Location coordinates not available for this job.');
                                        }
                                    }}
                                >
                                    <Navigation className="h-4 w-4" />
                                    Start Navigation
                                </Link>
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(`${job.job_sites?.address}, ${job.job_sites?.city}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-xs shadow-sm transition-colors"
                                >
                                    <MapPin className="h-3 w-3" />
                                    Open in Google Maps
                                </a>
                            </div>

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
                >
                    <summary
                        className="flex items-center justify-between p-4 cursor-pointer list-none"
                        onClick={handleSectionToggle('access')}
                    >
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
                >
                    <summary
                        className="flex items-center justify-between p-4 cursor-pointer list-none"
                        onClick={handleSectionToggle('customer')}
                    >
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
                    >
                        <summary
                            className="flex items-center justify-between p-4 cursor-pointer list-none"
                            onClick={handleSectionToggle('checklists')}
                        >
                            <div className="flex items-center gap-3 font-semibold text-gray-900">
                                <ClipboardList className="h-5 w-5 text-gray-500" />
                                Checklists
                            </div>
                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.checklists ? 'rotate-180' : ''}`} />
                        </summary>
                        {openSections.checklists && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                                {(job.job_checklists as JobChecklist[]).map((checklist) => {
                                    const displayItems = (checklist.items && checklist.items.length > 0)
                                        ? checklist.items
                                        : checklist.checklists?.items || [];

                                    return (
                                        <div key={checklist.id} className="space-y-2">
                                            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                                {checklist.checklists?.name || 'Checklist'}
                                            </h4>
                                            <div className="space-y-2 pl-1">
                                                {displayItems.map((item, idx) => (
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
                {canAddEvidence && (
                    <JobPhotosSection jobId={id} photos={(job.job_photos || []) as JobPhoto[]} />
                )}

                <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    open={openSections.maintenance}
                >
                    <summary
                        className="flex items-center justify-between p-4 cursor-pointer list-none"
                        onClick={handleSectionToggle('maintenance')}
                    >
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
                                (job.worker_reports as WorkerReport[]).map((report) => (
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
                >
                    <summary
                        className="flex items-center justify-between p-4 cursor-pointer list-none"
                        onClick={handleSectionToggle('notes')}
                    >
                        <div className="flex items-center gap-3 font-semibold text-gray-900">
                            <FileText className="h-5 w-5 text-gray-500" />
                            Job Notes
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openSections.notes ? 'rotate-180' : ''}`} />
                    </summary>
                    {openSections.notes && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                            <div className="text-sm text-gray-600">
                                <p className="font-semibold text-gray-900">Job description</p>
                                <p className="mt-1 whitespace-pre-wrap">{job.description || 'No description provided.'}</p>
                            </div>

                            <div className="space-y-3">
                                <p className="font-semibold text-gray-900 text-sm">Worker notes</p>
                                {notesQuery.isLoading ? (
                                    <p className="text-sm text-gray-500">Loading notes...</p>
                                ) : notesQuery.data && notesQuery.data.length > 0 ? (
                                    <div className="space-y-2">
                                        {notesQuery.data.map((note) => (
                                            <div key={note.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                                <p className="mt-1 text-[11px] text-gray-500">{format(new Date(note.created_at), 'MMM d, h:mm a')}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No notes yet.</p>
                                )}
                            </div>

                            <form onSubmit={handleNoteSubmit} className="space-y-2">
                                <textarea
                                    rows={3}
                                    value={noteContent}
                                    onChange={(event) => setNoteContent(event.target.value)}
                                    placeholder="Add a job note..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={createNote.isPending || !noteContent.trim()}
                                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
                                >
                                    <Send className="h-4 w-4" />
                                    {createNote.isPending ? 'Saving...' : 'Add Note'}
                                </button>
                            </form>
                        </div>
                    )}
                </details>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div
                className="fixed left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20"
                style={{ bottom: 'var(--impersonation-banner-offset, 0px)' }}
            >
                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                    <Wrench className="h-5 w-5" />
                    Report Maintenance Issue
                </button>
                {actionError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {actionError}
                    </div>
                )}
                {job.status !== 'completed' && (
                    <button
                        onClick={handlePrimaryAction}
                        disabled={isActionPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                        <Play className="h-5 w-5 fill-current" />
                        {isActionPending ? 'Checking...' : job.status === 'in_progress' ? 'Complete Job' : 'Start Job'}
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

function JobPhotosSection({ jobId, photos }: { jobId: string; photos: JobPhoto[] }) {
    const utils = api.useUtils();
    const supabase = createClient();
    const [description, setDescription] = useState<Record<JobPhoto['photo_type'], string>>({
        before: '',
        during: '',
        after: '',
    });
    const [uploadingType, setUploadingType] = useState<JobPhoto['photo_type'] | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const createPhoto = api.jobPhotos.createFromStagedUpload.useMutation({
        onSuccess: () => {
            utils.worker.getJobDetails.invalidate({ jobId });
            utils.jobPhotos.getByJob.invalidate({ jobId });
            setUploadingType(null);
            setUploadError(null);
        },
        onError: (error) => {
            setUploadingType(null);
            setUploadError(error.message);
        }
    });

    const retrySync = api.jobPhotos.retryGoogleDriveSync.useMutation({
        onSuccess: () => {
            utils.worker.getJobDetails.invalidate({ jobId });
        }
    });

    const groupedPhotos = photos.reduce<Record<JobPhoto['photo_type'], JobPhoto[]>>((groups, photo) => {
        groups[photo.photo_type].push(photo);
        return groups;
    }, { before: [], during: [], after: [] });

    const handleUpload = async (photoType: JobPhoto['photo_type'], file?: File | null) => {
        if (!file) return;

        setUploadingType(photoType);
        setUploadError(null);

        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const storagePath = `jobs/${jobId}/${photoType}/${fileName}`;

            const { error } = await supabase.storage
                .from('job-photos')
                .upload(storagePath, file, {
                    contentType: file.type || 'image/jpeg',
                });

            if (error) throw error;

            await createPhoto.mutateAsync({
                jobId,
                photoType,
                description: description[photoType] || undefined,
                fileName: file.name,
                fileType: file.type || 'image/jpeg',
                fileSize: file.size,
                storagePath,
                capturedAt: new Date().toISOString(),
            });

            setDescription((current) => ({ ...current, [photoType]: '' }));
        } catch (error) {
            setUploadingType(null);
            setUploadError(error instanceof Error ? error.message : 'Failed to upload photo');
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 font-semibold text-gray-900">
                    <Camera className="h-5 w-5 text-gray-500" />
                    Job Evidence Photos
                </div>
            </div>
            <div className="p-4 space-y-4">
                {(['before', 'during', 'after'] as const).map((photoType) => (
                    <div key={photoType} className="rounded-lg border border-gray-200 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold capitalize text-gray-900">{photoType} photos</h3>
                            <span className="text-xs text-gray-500">{groupedPhotos[photoType].length}</span>
                        </div>

                        <textarea
                            rows={2}
                            value={description[photoType]}
                            onChange={(event) => setDescription((current) => ({ ...current, [photoType]: event.target.value }))}
                            placeholder={`Optional ${photoType} photo note`}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm cursor-pointer">
                            <Camera className="h-4 w-4" />
                            {uploadingType === photoType ? 'Uploading...' : `Add ${photoType} photo`}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                disabled={uploadingType !== null}
                                onChange={(event) => handleUpload(photoType, event.target.files?.[0])}
                            />
                        </label>

                        {groupedPhotos[photoType].length > 0 && (
                            <div className="space-y-2">
                                {groupedPhotos[photoType].map((photo) => (
                                    <div key={photo.id} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-gray-900">{photo.file_name}</p>
                                                <p className="text-xs text-gray-500">{format(new Date(photo.created_at), 'MMM d, h:mm a')}</p>
                                                {photo.description && <p className="mt-1 text-xs text-gray-700">{photo.description}</p>}
                                                {photo.last_error && <p className="mt-1 text-xs text-red-600">{photo.last_error}</p>}
                                            </div>
                                            <PhotoStatus photo={photo} retrySync={() => retrySync.mutate({ photoId: photo.id })} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {uploadError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {uploadError}
                    </div>
                )}
            </div>
        </section>
    );
}

function PhotoStatus({ photo, retrySync }: { photo: JobPhoto; retrySync: () => void }) {
    if (photo.status === 'stored_in_google_drive' && photo.google_drive_web_view_link) {
        return (
            <a
                href={photo.google_drive_web_view_link}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
            >
                Drive
                <ExternalLink className="h-3 w-3" />
            </a>
        );
    }

    if (photo.status === 'google_drive_failed') {
        return (
            <button
                type="button"
                onClick={retrySync}
                className="flex shrink-0 items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
            >
                Retry
                <RefreshCw className="h-3 w-3" />
            </button>
        );
    }

    return (
        <span className="shrink-0 rounded-md bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
            {photo.status.replaceAll('_', ' ')}
        </span>
    );
}
