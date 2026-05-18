export type MapboxTokenStatus = 'valid' | 'missing' | 'invalid'

type MapboxTokenState = {
    token: string | null
    status: MapboxTokenStatus
}

export function getPublicMapboxToken(): MapboxTokenState {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim()

    if (!token) {
        return {
            token: null,
            status: 'missing',
        }
    }

    if (!token.startsWith('pk.')) {
        return {
            token: null,
            status: 'invalid',
        }
    }

    return {
        token,
        status: 'valid',
    }
}

export function getMapboxTokenUnavailableMessage(status: MapboxTokenStatus, mapLabel = 'Map') {
    if (status === 'invalid') {
        return `${mapLabel} unavailable because the Mapbox token must be a public pk.* token.`
    }

    return `${mapLabel} unavailable because the Mapbox public token is not configured.`
}
