import { Mistral } from '@mistralai/mistralai'

export async function generateReply(
    thread: string,
    apiKey: string
): Promise<string> {
    if (!apiKey) {
        throw new Error('Mistral API key is missing')
    }

    const client = new Mistral({ apiKey })

    try {
        const chatResponse = await client.chat.complete({
            model: 'mistral-medium',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an assistant specialized in generating accurate, context-aware email responses. When the user provides an email, you must: analyze the sender’s intention, tone, formality level, and communication style; generate a reply that matches the tone and formality while staying clear and helpful; include all relevant information needed to respond appropriately; if key details are missing, propose reasonable options or ask clarifying questions; keep the writing natural, coherent, and aligned with the style of the original message; provide only the last email reply, without giving the subject line, explanations, or advice.',
                },
                {
                    role: 'user',
                    content: thread,
                },
            ],
        })

        const content = chatResponse.choices?.[0]?.message?.content

        if (typeof content === 'string') {
            return content
        }

        return ''
    } catch (error) {
        console.error('Mistral API Error:', error)
        throw new Error('Failed to generate reply from Mistral AI')
    }
}
