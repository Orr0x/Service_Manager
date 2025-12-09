import { Calendar, Briefcase, Clock, CheckCircle, MapPin, ClipboardList, User, Info, FileText, AlertTriangle, Navigation } from "lucide-react";
import Link from 'next/link';

export default function WorkerDashboard() {
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto md:max-w-4xl">
            {/* Greeting Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Good Evening, John!</h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{currentDate}</span>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden">
                    <span className="text-xs font-medium text-blue-600 z-10">Jobs Today</span>
                    <span className="text-2xl font-bold text-gray-900 z-10">0</span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-1.5 text-white shadow-sm">
                        <Briefcase className="h-4 w-4" />
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden">
                    <span className="text-xs font-medium text-emerald-600 z-10">Hours This Week</span>
                    <span className="text-2xl font-bold text-gray-900 z-10">0.0</span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 rounded-full p-1.5 text-white shadow-sm">
                        <Clock className="h-4 w-4" />
                    </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden">
                    <span className="text-xs font-medium text-purple-600 z-10">Completed</span>
                    <span className="text-2xl font-bold text-gray-900 z-10">0</span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-500 rounded-full p-1.5 text-white shadow-sm">
                        <CheckCircle className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Today's Jobs (Empty State) */}
            <div className="space-y-2">
                <h3 className="text-base font-bold text-gray-900">Today's Jobs</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-48">
                    <div className="bg-gray-100 p-3 rounded-full mb-3 text-gray-400">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No cleaning jobs scheduled today</p>
                    <p className="text-xs text-gray-500 mt-1">Enjoy your day off!</p>
                </div>
            </div>

            {/* Status Widgets Row */}
            <div className="grid grid-cols-2 gap-3">
                {/* Weather Widget (Mock) */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                    <div className="animate-pulse h-6 w-6 bg-gray-200 rounded-full"></div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900">Weather</span>
                        <span className="text-[10px] text-gray-400">Loading...</span>
                    </div>
                </div>

                {/* Next Job Widget (Mock Error/Empty) */}
                <div className="bg-white rounded-xl border border-red-100 p-3 flex items-center gap-3">
                    <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                        <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">Next Job</span>
                        <span className="text-[10px] text-red-500 font-medium">Tap to retry</span>
                    </div>
                </div>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-2 gap-3 pb-8">
                <Link href="/worker/jobs" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-blue-600">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">My Jobs</h4>
                        <p className="text-[10px] text-gray-500">View cleaning jobs</p>
                    </div>
                </Link>

                <Link href="/worker/reports" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-orange-500">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">My Reports</h4>
                        <p className="text-[10px] text-gray-500">Maintenance Issues</p>
                    </div>
                </Link>

                <Link href="/worker/schedule" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-green-600">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">My Schedule</h4>
                        <p className="text-[10px] text-gray-500">View all jobs</p>
                    </div>
                </Link>

                <Link href="/worker/availability" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-purple-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Availability</h4>
                        <p className="text-[10px] text-gray-500">Block dates</p>
                    </div>
                </Link>

                <Link href="/worker/checklists" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-teal-600">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">My Checklists</h4>
                        <p className="text-[10px] text-gray-500">Reference guides</p>
                    </div>
                </Link>

                <Link href="/worker/locations" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-blue-500">
                        <Navigation className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">My Locations</h4>
                        <p className="text-[10px] text-gray-500">Navigate to jobs</p>
                    </div>
                </Link>

                <Link href="/worker/info" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-colors">
                    <div className="text-indigo-600">
                        <Info className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Useful Info</h4>
                        <p className="text-[10px] text-gray-500">Safety & guidelines</p>
                    </div>
                </Link>

            </div>
        </div>
    );
}
