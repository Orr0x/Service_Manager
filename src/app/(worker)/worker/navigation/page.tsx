'use client';

import { useState, useEffect, useRef } from 'react';
// import Map, { NavigationControl, GeolocateControl, Marker, Source, Layer, MapRef } from 'react-map-gl';
// import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, Navigation, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function WorkerNavigationPage() {
    const searchParams = useSearchParams();
    const destinationParam = searchParams.get('destination'); // Format: lat,lng

    // Placeholder state
    const isNavigating = false;

    return (
        <div className="h-screen w-full relative bg-gray-900 text-white overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <Link href="/worker/jobs" className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-lg font-bold drop-shadow-md">Navigation</h1>
                </div>
            </div>

            <div className="text-center p-8 max-w-md">
                <Navigation className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">3D Navigation Loading...</h2>
                <p className="text-gray-400 mb-6">We are finalizing the map download. In the meantime, please use Google Maps.</p>

                {destinationParam && (
                    <a
                        href={`https://maps.google.com/?q=${destinationParam}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg inline-flex items-center gap-2"
                    >
                        Open Google Maps
                    </a>
                )}
            </div>

            {/* Map Temporarily Disabled due to Build Error
            <Map ... />
            */}
        </div>
    );
}
