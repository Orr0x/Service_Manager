'use client';

import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, GeolocateControl, Marker, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, Navigation, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function WorkerNavigationPage() {
    const searchParams = useSearchParams();
    const destinationParam = searchParams.get('destination'); // Format: lat,lng

    const [viewState, setViewState] = useState({
        latitude: 51.505, // Default (London)
        longitude: -0.09,
        zoom: 13,
        pitch: 0,
        bearing: 0
    });

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
    const [route, setRoute] = useState<any>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [steps, setSteps] = useState<any[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Fetch Route when destination & user location are set
    useEffect(() => {
        if (userLocation && destination) {
            fetchRoute(userLocation, destination);
        }
    }, [userLocation, destination]);

    const fetchRoute = async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;

        try {
            const query = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&geometries=geojson&access_token=${token}`
            );
            const json = await query.json();
            const data = json.routes[0];
            setRoute(data.geometry);
            setSteps(data.legs[0].steps);
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };

    const startNavigation = () => {
        setIsNavigating(true);
        // Initial "Jump" to driver view
        if (userLocation) {
            setViewState(prev => ({
                ...prev,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                pitch: 60,
                zoom: 17
            }));
        }
    };

    const exitNavigation = () => {
        setIsNavigating(false);
        setViewState(prev => ({ ...prev, pitch: 0, zoom: 14 }));
    };

    const mapRef = useRef<MapRef>(null);

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

            {/* Bottom Controls */}
            <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col gap-3">
                {destination && !isNavigating && (
                    <button
                        onClick={startNavigation}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg"
                    >
                        <Navigation className="h-6 w-6 fill-current" />
                        Start Navigation
                    </button>
                )}

                {isNavigating && (
                    <button
                        onClick={exitNavigation}
                        className="w-full bg-red-500/90 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <X className="h-5 w-5" />
                        Exit Navigation
                    </button>
                )}
            </div>

            <Map
                {...viewState}
                onMove={(evt: any) => !isNavigating && setViewState(evt.viewState)} // Only allow manual move if NOT navigating (or handle interruptions)
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/navigation-night-v1"
                ref={mapRef}
            >
                <GeolocateControl position="top-right" />
                <NavigationControl position="top-right" />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                        <div className="relative">
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10 relative"></div>
                            {isNavigating && <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>}
                        </div>
                    </Marker>
                )}

                {/* Destination Marker */}
                {destination && (
                    <Marker longitude={destination.lng} latitude={destination.lat} color="#ef4444" />
                )}

                {/* Route Line */}
                {route && (
                    <Source id="route" type="geojson" data={route}>
                        <Layer
                            id="route"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': '#3b82f6',
                                'line-width': 6,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}
            </Map>
        </div>
    );
}
