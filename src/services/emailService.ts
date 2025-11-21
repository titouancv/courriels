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
            case 'inbox':
                query = 'label:INBOX'
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

    // Concurrency limit to avoid hitting Gmail API rate limits too hard
    // while maximizing throughput.
    const CONCURRENCY = 10
    const threads = listData.threads
    const results = new Array(threads.length).fill(null)
    const iterator = threads.entries()

    const worker = async () => {
        for (const [index, thread] of iterator) {
            try {
                const data = await fetchThreadDetailsRaw(
                    accessToken,
                    thread.id,
                    'metadata'
                )
                results[index] = mapThreadToEmail(data, false)
            } catch (error) {
                console.error(`Failed to fetch thread ${thread.id}:`, error)
                results[index] = null
            }
        }
    }

    // Start workers
    const workers = Array(CONCURRENCY)
        .fill(null)
        .map(() => worker())

    await Promise.all(workers)

    const emails = results.filter((email): email is Email => email !== null)

    return {
        emails,
        nextPageToken: listData.nextPageToken || null,
    }
}

export async function getEmailDetails(
    accessToken: string,
    threadId: string
): Promise<Email | null> {
    try {
        const data = await fetchThreadDetailsRaw(accessToken, threadId, 'full')
        return mapThreadToEmail(data, true)
    } catch (error) {
        console.error(`Failed to fetch thread details ${threadId}:`, error)
        return null
    }
}
