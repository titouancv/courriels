import { fetchThreadsList, fetchThreadDetailsRaw } from './gmailApi'
import { mapThreadToEmail } from './gmailMapper'
import type { FolderId, Email } from '../types'

export async function getEmailsForFolder(
    accessToken: string,
    folder: FolderId,
    pageToken?: string,
    queryOverride?: string
): Promise<{ emails: Email[]; nextPageToken: string | null }> {
    let query = ''
    if (queryOverride !== undefined) {
        query = queryOverride
    } else {
        switch (folder) {
            case 'notifications':
                query = ''
                break
            case 'conversations':
                query = 'from:me'
                break
            case 'trash':
                query = 'in:trash'
                break
        }
    }

    const listData = await fetchThreadsList(accessToken, query, pageToken)

    if (!listData.threads) {
        return { emails: [], nextPageToken: null }
    }

    const BATCH_SIZE = 5
    const results: (Email | null)[] = []

    for (let i = 0; i < listData.threads.length; i += BATCH_SIZE) {
        const batch = listData.threads.slice(i, i + BATCH_SIZE)
        const batchPromises = batch.map((thread: { id: string }) =>
            fetchThreadDetailsRaw(accessToken, thread.id)
                .then(mapThreadToEmail)
                .catch((error) => {
                    console.error(`Failed to fetch thread ${thread.id}:`, error)
                    return null
                })
        )
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
    }

    const emails = results.filter((email): email is Email => email !== null)

    return {
        emails,
        nextPageToken: listData.nextPageToken || null,
    }
}
