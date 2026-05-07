/**
 * Cerebras AI REST API client.
 *
 * Calls the OpenAI-compatible chat completions endpoint directly with fetch.
 * No external SDK dependency — keeps the bundle small and auditable.
 */

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions'
const DEFAULT_MODEL = 'llama3.1-8b'
const STORAGE_KEY = 'postcare:cerebras-api-key'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CerebrasCompletionResponse {
  id: string
  choices: Array<{
    message: { role: string; content: string }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface CerebrasClientOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

// ---------------------------------------------------------------------------
// API key management (localStorage only, never logged or exported)
// ---------------------------------------------------------------------------

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch {
    // Silently fail — key will need to be re-entered next session
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}

// ---------------------------------------------------------------------------
// Core API call
// ---------------------------------------------------------------------------

export async function chatCompletion(
  apiKey: string,
  messages: ChatMessage[],
  options: CerebrasClientOptions = {},
): Promise<CerebrasCompletionResponse> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 2048 } = options

  const response = await fetch(CEREBRAS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_completion_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    if (response.status === 401) {
      throw new Error('Invalid Cerebras API key. Please check your key and try again.')
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.')
    }
    throw new Error(`Cerebras API error (${response.status}): ${errorBody || response.statusText}`)
  }

  const data: CerebrasCompletionResponse = await response.json()
  return data
}

// ---------------------------------------------------------------------------
// Key validation — lightweight test call
// ---------------------------------------------------------------------------

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await chatCompletion(apiKey, [{ role: 'user', content: 'ping' }], {
      maxTokens: 5,
      temperature: 0,
    })
    return true
  } catch {
    return false
  }
}
