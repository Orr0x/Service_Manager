'use client'

import { ExternalLink, Lock, MapPin, Unlock } from 'lucide-react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox'
import type { Feature, Polygon } from 'geojson'
import { getMapboxTokenUnavailableMessage, getPublicMapboxToken } from '@/lib/mapbox-token'
import 'mapbox-gl/dist/mapbox-gl.css'

type JobSiteLocationSummaryProps = {
    latitude?: number | null
    longitude?: number | null
    what3words?: string | null
    coordinatesLocked?: boolean | null
    rangeMeters?: number | null
    rangeLocked?: boolean | null
}

type JobSiteMapPreviewProps = {
    latitude?: number | null
    longitude?: number | null
    rangeMeters?: number | null
    className?: string
}

export function JobSiteLocationSummary({
    latitude,
    longitude,
    what3words,
    coordinatesLocked,
    rangeMeters,
    rangeLocked,
}: JobSiteLocationSummaryProps) {
    const hasValidCoordinates = typeof latitude === 'number'
        && typeof longitude === 'number'
        && latitude >= -90
        && latitude <= 90
        && longitude >= -180
        && longitude <= 180
    const normalizedRangeMeters = Math.min(250, Math.max(10, rangeMeters || 250))
    const mapboxToken = getPublicMapboxToken()
    const rangeCircle = hasValidCoordinates
        ? createCirclePolygon(latitude, longitude, normalizedRangeMeters)
        : null
    const mapBounds = hasValidCoordinates
        ? createBoundsFromRadius(latitude, longitude, 150)
        : null
    const googleMapsHref = hasValidCoordinates
        ? `https://maps.google.com/?q=${latitude},${longitude}`
        : null

    return (
        <>
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    Geolocation
                </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-y-5">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Latitude</dt>
                        <dd className="mt-1 text-sm text-gray-900">{hasValidCoordinates ? latitude.toFixed(6) : '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Longitude</dt>
                        <dd className="mt-1 text-sm text-gray-900">{hasValidCoordinates ? longitude.toFixed(6) : '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">What3Words</dt>
                        <dd className="mt-1 break-words text-sm text-gray-900">{what3words || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Start Range</dt>
                        <dd className="mt-1 text-sm text-gray-900">{normalizedRangeMeters}m</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                        <dd className="mt-1 inline-flex items-center gap-1 text-sm text-gray-900">
                            {coordinatesLocked ? <Lock className="h-4 w-4 text-gray-500" /> : <Unlock className="h-4 w-4 text-gray-500" />}
                            {coordinatesLocked ? 'Locked' : 'Unlocked'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Range</dt>
                        <dd className="mt-1 inline-flex items-center gap-1 text-sm text-gray-900">
                            {rangeLocked ? <Lock className="h-4 w-4 text-gray-500" /> : <Unlock className="h-4 w-4 text-gray-500" />}
                            {rangeLocked ? 'Locked' : 'Unlocked'}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900">
                        <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                        Map
                    </h3>
                    {googleMapsHref && (
                        <a
                            href={googleMapsHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Google Maps
                        </a>
                    )}
                </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {hasValidCoordinates && mapboxToken.token ? (
                    <div className="space-y-2">
                        <div className="aspect-[4/3] max-h-80 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 sm:aspect-square sm:max-h-none">
                            <Map
                                initialViewState={{
                                    bounds: mapBounds ?? undefined,
                                    fitBoundsOptions: {
                                        padding: 28,
                                        maxZoom: 18,
                                    },
                                }}
                                mapboxAccessToken={mapboxToken.token}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                                style={{ width: '100%', height: '100%' }}
                            >
                                <NavigationControl position="top-right" />
                                {rangeCircle && (
                                    <Source id="job-site-detail-range" type="geojson" data={rangeCircle}>
                                        <Layer
                                            id="job-site-detail-range-fill"
                                            type="fill"
                                            paint={{
                                                'fill-color': '#2563eb',
                                                'fill-opacity': 0.16,
                                            }}
                                        />
                                        <Layer
                                            id="job-site-detail-range-line"
                                            type="line"
                                            paint={{
                                                'line-color': '#2563eb',
                                                'line-width': 2,
                                                'line-opacity': 0.75,
                                            }}
                                        />
                                    </Source>
                                )}
                                <Marker latitude={latitude} longitude={longitude} anchor="bottom">
                                    <MapPin className="h-9 w-9 fill-red-600 text-white drop-shadow" />
                                </Marker>
                            </Map>
                        </div>
                        <p className="text-xs text-gray-600">
                            Worker start gate uses this pin and {normalizedRangeMeters}m range.
                        </p>
                    </div>
                ) : (
                    <div className="flex aspect-[4/3] max-h-80 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600 sm:aspect-square sm:max-h-none">
                        {hasValidCoordinates
                            ? getMapboxTokenUnavailableMessage(mapboxToken.status)
                            : 'No valid coordinates saved for this job site.'}
                    </div>
                )}
            </div>
        </div>
        </>
    )
}

export function JobSiteMapPreview({
    latitude,
    longitude,
    rangeMeters,
    className = '',
}: JobSiteMapPreviewProps) {
    const hasValidCoordinates = typeof latitude === 'number'
        && typeof longitude === 'number'
        && latitude >= -90
        && latitude <= 90
        && longitude >= -180
        && longitude <= 180
    const normalizedRangeMeters = Math.min(250, Math.max(10, rangeMeters || 250))
    const mapboxToken = getPublicMapboxToken()
    const rangeCircle = hasValidCoordinates
        ? createCirclePolygon(latitude, longitude, normalizedRangeMeters)
        : null
    const mapBounds = hasValidCoordinates
        ? createBoundsFromRadius(latitude, longitude, 120)
        : null

    if (!hasValidCoordinates || !mapboxToken.token) {
        return (
            <div className={`flex aspect-[5/3] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-xs text-gray-500 ${className}`}>
                {hasValidCoordinates
                    ? getMapboxTokenUnavailableMessage(mapboxToken.status, 'Map preview')
                    : 'No map coordinates'}
            </div>
        )
    }

    return (
        <div className={`aspect-[5/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 ${className}`}>
            <Map
                initialViewState={{
                    bounds: mapBounds ?? undefined,
                    fitBoundsOptions: {
                        padding: 18,
                        maxZoom: 18,
                    },
                }}
                mapboxAccessToken={mapboxToken.token}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                style={{ width: '100%', height: '100%' }}
                interactive={false}
                attributionControl={false}
            >
                {rangeCircle && (
                    <Source id="job-site-card-range" type="geojson" data={rangeCircle}>
                        <Layer
                            id="job-site-card-range-fill"
                            type="fill"
                            paint={{
                                'fill-color': '#2563eb',
                                'fill-opacity': 0.14,
                            }}
                        />
                        <Layer
                            id="job-site-card-range-line"
                            type="line"
                            paint={{
                                'line-color': '#2563eb',
                                'line-width': 2,
                                'line-opacity': 0.7,
                            }}
                        />
                    </Source>
                )}
                <Marker latitude={latitude} longitude={longitude} anchor="bottom">
                    <MapPin className="h-7 w-7 fill-red-600 text-white drop-shadow" />
                </Marker>
            </Map>
        </div>
    )
}

function createCirclePolygon(latitude: number, longitude: number, radiusMeters: number): Feature<Polygon> {
    const earthRadiusMeters = 6371000
    const points = 96
    const coordinates: [number, number][] = []
    const latRadians = toRadians(latitude)
    const lngRadians = toRadians(longitude)
    const angularDistance = radiusMeters / earthRadiusMeters

    for (let i = 0; i <= points; i += 1) {
        const bearing = (2 * Math.PI * i) / points
        const pointLat = Math.asin(
            Math.sin(latRadians) * Math.cos(angularDistance)
            + Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearing)
        )
        const pointLng = lngRadians + Math.atan2(
            Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRadians),
            Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(pointLat)
        )

        coordinates.push([toDegrees(pointLng), toDegrees(pointLat)])
    }

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
        },
    }
}

function createBoundsFromRadius(latitude: number, longitude: number, radiusMeters: number): [[number, number], [number, number]] {
    const earthRadiusMeters = 6371000
    const latDelta = toDegrees(radiusMeters / earthRadiusMeters)
    const lngDelta = toDegrees(radiusMeters / (earthRadiusMeters * Math.max(Math.abs(Math.cos(toRadians(latitude))), 0.000001)))

    return [
        [longitude - lngDelta, latitude - latDelta],
        [longitude + lngDelta, latitude + latDelta],
    ]
}

function toRadians(value: number) {
    return value * Math.PI / 180
}

function toDegrees(value: number) {
    return value * 180 / Math.PI
}
