type GoogleTokenResponse = {
    access_token?: string
    error?: string
    error_description?: string
}

type GoogleDriveUploadResponse = {
    id?: string
    webViewLink?: string
    error?: {
        message?: string
    }
}

export type GoogleDriveUploadResult = {
    fileId: string
    webViewLink: string | null
    folderId: string | null
}

export function isGoogleDriveConfigured() {
    return Boolean(
        process.env.GOOGLE_DRIVE_CLIENT_ID &&
        process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
        process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
        process.env.GOOGLE_DRIVE_FOLDER_ID
    )
}

export async function uploadBufferToGoogleDrive(input: {
    fileName: string
    mimeType: string
    buffer: Buffer
    folderId?: string | null
}): Promise<GoogleDriveUploadResult> {
    const folderId = input.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID
    if (!folderId) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured')
    }

    const accessToken = await getAccessToken()
    const boundary = `service-manager-${crypto.randomUUID()}`
    const metadata = {
        name: input.fileName,
        parents: [folderId],
    }

    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
        Buffer.from(JSON.stringify(metadata)),
        Buffer.from(`\r\n--${boundary}\r\n`),
        Buffer.from(`Content-Type: ${input.mimeType}\r\n\r\n`),
        input.buffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
    ])

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
            'Content-Length': String(body.length),
        },
        body,
    })

    const data = await response.json() as GoogleDriveUploadResponse

    if (!response.ok || !data.id) {
        throw new Error(data.error?.message || `Google Drive upload failed with ${response.status}`)
    }

    return {
        fileId: data.id,
        webViewLink: data.webViewLink || null,
        folderId,
    }
}

async function getAccessToken() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google Drive OAuth credentials are not configured')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    const data = await response.json() as GoogleTokenResponse

    if (!response.ok || !data.access_token) {
        throw new Error(data.error_description || data.error || 'Failed to get Google Drive access token')
    }

    return data.access_token
}
