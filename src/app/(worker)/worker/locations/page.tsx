'use client';

import { api } from '@/trpc/react';
import { MapPin, Navigation, Building, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';


export default function WorkerLocationsPage() {
    // Fetch jobs for the current month to extract active locations.
    // Switching to 'month' allows seeing locations for recent past jobs too.
    const { data: jobs, isLoading } = api.worker.getAssignedJobs.useQuery({
        filter: 'month',
        limit: 50
    });

    const [searchTerm, setSearchTerm] = useState('');

    const uniqueSites = useMemo(() => {
        if (!jobs) return [];

        const siteMap = new Map();

        jobs.forEach(job => {
            const sites = Array.isArray(job.job_sites) ? job.job_sites : (job.job_sites ? [job.job_sites] : []);
            sites.forEach(site => {
                if (site && !siteMap.has(site.id)) {
                    siteMap.set(site.id, {
                        ...site,
                        nextJobDate: job.start_time
                    });
                }
            });
        });

        return Array.from(siteMap.values());
    }, [jobs]);

    const filteredSites = uniqueSites.filter(site =>
        site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Locations</h1>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            ) : filteredSites.length > 0 ? (
                <div className="space-y-4">
                    {filteredSites.map((site) => (
                        <div key={site.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                                        <Building className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">
                                            {site.name || site.address?.split(',')[0] || 'Unknown Site'}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {site.city}, {site.state}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-600 pl-11 mb-4">
                                <p className="line-clamp-1">{site.address}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Link
                                    href={`/worker/navigation?destination=${site.latitude && site.longitude ? `${site.latitude},${site.longitude}` : ''}`}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors shadow-sm"
                                    onClick={(e) => {
                                        if (!site.latitude || !site.longitude) {
                                            e.preventDefault();
                                            alert(`Coordinates missing for ${site.address}. Please use Google Maps.`);
                                        }
                                    }}
                                >
                                    <Navigation className="h-4 w-4" />
                                    Start Navigation
                                </Link>
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(`${site.address}, ${site.city}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-xs transition-colors"
                                >
                                    <MapPin className="h-3 w-3" />
                                    Google Maps
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <p className="text-gray-500">No locations found from your upcoming jobs.</p>
                </div>
            )}
        </div>
    );
}
