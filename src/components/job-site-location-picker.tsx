'use client'

import { ExternalLink, LocateFixed, Lock, MapPin, Unlock } from 'lucide-react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox'
import type { Feature, Polygon } from 'geojson'
import { getMapboxTokenUnavailableMessage, getPublicMapboxToken } from '@/lib/mapbox-token'
import 'mapbox-gl/dist/mapbox-gl.css'

type JobSiteLocationPickerProps = {
    latitude: string
    longitude: string
    what3words: string
    onLatitudeChange: (value: string) => void
    onLongitudeChange: (value: string) => void
    onWhat3WordsChange: (value: string) => void
    onFindCoordinates: () => void | Promise<void>
    isLocating: boolean
    coordinatesLocked: boolean
    onCoordinatesLockedChange: (value: boolean) => void
    rangeMeters: number
    onRangeMetersChange: (value: number) => void
    rangeLocked: boolean
    onRangeLockedChange: (value: boolean) => void
    getLabel?: (key: string, defaultLabel: string) => string
}

const defaultView = {
    latitude: 54.5,
    longitude: -3,
    zoom: 5,
}

export function JobSiteLocationPicker({
    latitude,
    longitude,
    what3words,
    onLatitudeChange,
    onLongitudeChange,
    onWhat3WordsChange,
    onFindCoordinates,
    isLocating,
    coordinatesLocked,
    onCoordinatesLockedChange,
    rangeMeters,
    onRangeMetersChange,
    rangeLocked,
    onRangeLockedChange,
    getLabel = (_key, defaultLabel) => defaultLabel,
}: JobSiteLocationPickerProps) {
    const numericLatitude = Number(latitude)
    const numericLongitude = Number(longitude)
    const hasValidCoordinates = Number.isFinite(numericLatitude)
        && Number.isFinite(numericLongitude)
        && numericLatitude >= -90
        && numericLatitude <= 90
        && numericLongitude >= -180
        && numericLongitude <= 180
    const mapboxToken = getPublicMapboxToken()
    const viewState = hasValidCoordinates
        ? { latitude: numericLatitude, longitude: numericLongitude, zoom: 16 }
        : defaultView
    const googleMapsHref = hasValidCoordinates
        ? `https://maps.google.com/?q=${numericLatitude},${numericLongitude}`
        : null
    const normalizedRangeMeters = Math.min(250, Math.max(10, rangeMeters || 250))
    const rangeCircle = hasValidCoordinates ? createCirclePolygon(numericLatitude, numericLongitude, normalizedRangeMeters) : null

    const setCoordinates = (nextLatitude: number, nextLongitude: number) => {
        if (coordinatesLocked) return
        onLatitudeChange(nextLatitude.toFixed(6))
        onLongitudeChange(nextLongitude.toFixed(6))
    }

    const setRange = (value: number) => {
        if (rangeLocked) return
        onRangeMetersChange(Math.min(250, Math.max(10, value || 10)))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold leading-7 text-gray-900">Geolocation</h3>
                <div className="flex items-center gap-3">
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
                    <button
                        type="button"
                        onClick={onFindCoordinates}
                        disabled={isLocating || coordinatesLocked}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-50"
                    >
                        <LocateFixed className="h-4 w-4" />
                        {isLocating ? 'Locating...' : 'Find Coordinates'}
                    </button>
                    <button
                        type="button"
                        onClick={() => onCoordinatesLockedChange(!coordinatesLocked)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                    >
                        {coordinatesLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {coordinatesLocked ? 'Unlock Coordinates' : 'Lock Coordinates'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                <div className="sm:col-span-2">
                    <label htmlFor="latitude" className="block text-sm font-medium leading-6 text-gray-900">
                        {getLabel('job_sites.latitude', 'Latitude')}
                    </label>
                    <div className="mt-2">
                        <input
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            name="latitude"
                            id="latitude"
                            value={latitude}
                            readOnly={coordinatesLocked}
                            onChange={(event) => onLatitudeChange(event.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 read-only:bg-gray-50 read-only:text-gray-500 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="e.g., 52.862379"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="longitude" className="block text-sm font-medium leading-6 text-gray-900">
                        {getLabel('job_sites.longitude', 'Longitude')}
                    </label>
                    <div className="mt-2">
                        <input
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            name="longitude"
                            id="longitude"
                            value={longitude}
                            readOnly={coordinatesLocked}
                            onChange={(event) => onLongitudeChange(event.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 read-only:bg-gray-50 read-only:text-gray-500 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="e.g., -1.558399"
                        />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="what3words" className="block text-sm font-medium leading-6 text-gray-900">
                        {getLabel('job_sites.what3words', 'What3Words')}
                    </label>
                    <div className="mt-2">
                        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600">
                            <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">{'///'}</span>
                            <input
	                                type="text"
	                                name="what3words"
	                                id="what3words"
	                                value={what3words}
	                                onChange={(event) => onWhat3WordsChange(event.target.value)}
	                                className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
	                                placeholder="word.word.word"
	                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <label htmlFor="locationRadiusMeters" className="text-sm font-medium text-gray-900">
                        Start range
                    </label>
                    <button
                        type="button"
                        onClick={() => onRangeLockedChange(!rangeLocked)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900"
                    >
                        {rangeLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {rangeLocked ? 'Unlock Range' : 'Lock Range'}
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_6rem] items-center gap-3">
                    <input
                        id="locationRadiusMeters"
                        type="range"
                        min="10"
                        max="250"
                        step="10"
                        value={normalizedRangeMeters}
                        disabled={rangeLocked}
                        onChange={(event) => setRange(Number(event.target.value))}
                        className="w-full accent-blue-600 disabled:opacity-50"
                    />
                    <div className="relative">
                        <input
                            type="number"
                            min="10"
                            max="250"
                            step="1"
                            value={normalizedRangeMeters}
                            readOnly={rangeLocked}
                            onChange={(event) => setRange(Number(event.target.value))}
                            className="block w-full rounded-md border-0 py-1.5 pr-8 text-right text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 read-only:bg-gray-100 read-only:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-gray-500">m</span>
                    </div>
                </div>
            </div>

            {mapboxToken.token ? (
                <div className="space-y-2">
                    <div className="h-80 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    <Map
                        key={`${viewState.latitude}:${viewState.longitude}:${viewState.zoom}`}
                        initialViewState={viewState}
                        mapboxAccessToken={mapboxToken.token}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        style={{ width: '100%', height: '100%' }}
                        onClick={(event) => setCoordinates(event.lngLat.lat, event.lngLat.lng)}
                    >
                        <NavigationControl position="top-right" />
                        {rangeCircle && (
                            <>
                                <Source id="job-site-range" type="geojson" data={rangeCircle}>
                                    <Layer
                                        id="job-site-range-fill"
                                        type="fill"
                                        paint={{
                                            'fill-color': '#2563eb',
                                            'fill-opacity': 0.16,
                                        }}
                                    />
                                    <Layer
                                        id="job-site-range-line"
                                        type="line"
                                        paint={{
                                            'line-color': '#2563eb',
                                            'line-width': 2,
                                            'line-opacity': 0.75,
                                        }}
                                    />
                                </Source>
                            </>
                        )}
                        {hasValidCoordinates && (
                            <Marker
                                latitude={numericLatitude}
                                longitude={numericLongitude}
                                anchor="bottom"
                                draggable={!coordinatesLocked}
                                onDragEnd={(event) => setCoordinates(event.lngLat.lat, event.lngLat.lng)}
                            >
                                <MapPin className={`h-9 w-9 text-white drop-shadow ${coordinatesLocked ? 'fill-gray-700' : 'fill-red-600'}`} />
                            </Marker>
                        )}
                    </Map>
                    </div>
                    {hasValidCoordinates && (
                        <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                            <span>Start range: {Math.round(normalizedRangeMeters)}m from the pin</span>
                            <span>
                                {coordinatesLocked && rangeLocked
                                    ? 'Coordinates and range locked'
                                    : coordinatesLocked
                                        ? 'Coordinates locked'
                                        : rangeLocked
                                            ? 'Range locked'
                                            : 'Click map or drag pin to set coordinates'}
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                    {getMapboxTokenUnavailableMessage(mapboxToken.status, 'Map picker')}
                </div>
            )}
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

function toRadians(value: number) {
    return value * Math.PI / 180
}

function toDegrees(value: number) {
    return value * 180 / Math.PI
}
