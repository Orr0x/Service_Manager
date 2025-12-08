
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const locationRouter = createTRPCRouter({
    getCoordinates: protectedProcedure
        .input(z.object({ address: z.string().min(1) }))
        .mutation(async ({ input }) => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input.address)}&limit=1`,
                    {
                        headers: {
                            'User-Agent': 'ServiceManager/1.0',
                        },
                    }
                )

                if (!response.ok) {
                    throw new Error('Failed to fetch from Nominatim')
                }

                const data = await response.json()

                if (Array.isArray(data) && data.length > 0) {
                    const result = data[0]
                    return {
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon),
                        displayName: result.display_name,
                    }
                }

                return null
            } catch (error) {
                console.error('Nominatim error:', error)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to fetch coordinates',
                })
            }
        }),

    getWhat3Words: protectedProcedure
        .input(z.object({
            latitude: z.number(),
            longitude: z.number(),
        }))
        .mutation(async ({ input }) => {
            const apiKeyRaw = process.env.WHAT3WORDS_API_KEY
            if (!apiKeyRaw) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'What3Words API key not configured',
                })
            }
            // Sanitize key (remove trailing dot if present from copy-paste)
            const apiKey = apiKeyRaw.replace(/\.$/, '')

            try {
                const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${input.latitude},${input.longitude}&key=${apiKey}`;
                // console.log('Fetching W3W:', url.replace(apiKey, 'HIDDEN')); 

                const response = await fetch(url)

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('W3W API Error:', response.status, errorText);
                    throw new Error(`W3W API returned ${response.status}: ${errorText}`)
                }

                const data = await response.json()

                if (data.words) {
                    return {
                        words: data.words, // e.g., "limit.broom.flip"
                        mapLink: data.map,
                    }
                }

                return null
            } catch (error) {
                console.error('What3Words error:', error)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to fetch What3Words address: ${(error as Error).message}`,
                })
            }
        }),

    getFromWhat3Words: protectedProcedure
        .input(z.object({ words: z.string().min(1) }))
        .mutation(async ({ input }) => {
            const apiKeyRaw = process.env.WHAT3WORDS_API_KEY
            if (!apiKeyRaw) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'What3Words API key not configured',
                })
            }
            // Sanitize key
            const apiKey = apiKeyRaw.replace(/\.$/, '')

            try {
                // Ensure words start with /// or strip it if API doesn't need it?
                // API expects "word.word.word". If user types ///, we should strip it.
                const cleanWords = input.words.replace(/^\/{3}/, '')

                const response = await fetch(
                    `https://api.what3words.com/v3/convert-to-coordinates?words=${cleanWords}&key=${apiKey}`
                )

                if (!response.ok) {
                    throw new Error('Failed to fetch from What3Words')
                }

                const data = await response.json()

                if (data.coordinates) {
                    return {
                        latitude: data.coordinates.lat,
                        longitude: data.coordinates.lng,
                        country: data.country,
                        nearestPlace: data.nearestPlace,
                    }
                }

                // W3W returns 200 even on some logic errors, check for error block
                if (data.error) {
                    throw new Error(data.error.message || 'Invalid 3 word address')
                }

                return null
            } catch (error) {
                console.error('What3Words error:', error)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to resolve What3Words address',
                })
            }
        }),
})
