import { useCallback, useRef, useState } from 'react'
import {
  type ChatMessage,
  chatCompletion,
  getStoredApiKey,
  storeApiKey,
  clearApiKey,
  validateApiKey,
} from '../../lib/ai/cerebrasClient'
import {
  buildChatContext,
  buildSystemPrompt,
} from '../../lib/ai/chatContext'
import { type CollectionRecord, type RequestRecord, type EnvironmentRecord } from '../../domain/models'
import { executeRequest } from '../requests/requestExecution'
import { database } from '../../lib/storage/db'

export interface ChatUIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  executionResult?: ExecutionResultData
  batchResults?: ExecutionResultData[]
  isLoading?: boolean
}

export interface ExecutionResultData {
  requestName: string
  method: string
  url: string
  status: number
  statusText: string
  durationMs: number
  bodyPreview: string
  ok: boolean
  error?: string
}

interface ChatSessionState {
  messages: ChatUIMessage[]
  isLoading: boolean
  error: string | null
  apiKeyStatus: 'unchecked' | 'validating' | 'valid' | 'invalid'
}

const EXECUTE_REQUEST_REGEX = /\[EXECUTE_REQUEST:\s*([^\]]+)\]/
const EXECUTE_COLLECTION_REGEX = /\[EXECUTE_COLLECTION:\s*([^\]]+)\]/

function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function truncateBody(body: string, maxLen = 500): string {
  if (body.length <= maxLen) return body
  return body.slice(0, maxLen) + '…'
}

export function useChatSession(
  collections: CollectionRecord[],
  allRequests: RequestRecord[],
  activeEnvironment?: EnvironmentRecord,
) {
  const [state, setState] = useState<ChatSessionState>({
    messages: [],
    isLoading: false,
    error: null,
    apiKeyStatus: getStoredApiKey() ? 'valid' : 'unchecked',
  })

  // Keep a ref to messages so async callbacks always see the latest list
  const messagesRef = useRef<ChatUIMessage[]>([])

  const addMessage = useCallback((msg: Omit<ChatUIMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatUIMessage = {
      ...msg,
      id: createMessageId(),
      timestamp: Date.now(),
    }
    messagesRef.current = [...messagesRef.current, newMsg]
    setState((prev) => ({
      ...prev,
      messages: messagesRef.current,
    }))
    return newMsg
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<ChatUIMessage>) => {
    messagesRef.current = messagesRef.current.map((m) =>
      m.id === id ? { ...m, ...updates } : m,
    )
    setState((prev) => ({
      ...prev,
      messages: messagesRef.current,
    }))
  }, [])

  const handleValidateKey = useCallback(async (key: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, apiKeyStatus: 'validating', error: null }))
    try {
      const valid = await validateApiKey(key)
      if (valid) {
        storeApiKey(key)
        setState((prev) => ({ ...prev, apiKeyStatus: 'valid', error: null }))
        return true
      } else {
        setState((prev) => ({
          ...prev,
          apiKeyStatus: 'invalid',
          error: 'Invalid API key. Please check and try again.',
        }))
        return false
      }
    } catch {
      setState((prev) => ({
        ...prev,
        apiKeyStatus: 'invalid',
        error: 'Failed to validate API key. Please try again.',
      }))
      return false
    }
  }, [])

  const handleClearKey = useCallback(() => {
    clearApiKey()
    messagesRef.current = []
    setState({
      messages: [],
      isLoading: false,
      error: null,
      apiKeyStatus: 'unchecked',
    })
  }, [])

  const executeRequestById = useCallback(async (requestId: string): Promise<ExecutionResultData> => {
    const trimmedId = requestId.trim()
    const request = allRequests.find((r) => r.id === trimmedId)
    if (!request) {
      // Try to find by fetching from DB directly
      const dbRequest = await database.requests.get(trimmedId)
      if (!dbRequest) {
        return {
          requestName: trimmedId,
          method: 'UNKNOWN',
          url: '',
          status: 0,
          statusText: 'Not Found',
          durationMs: 0,
          bodyPreview: '',
          ok: false,
          error: `Request "${trimmedId}" not found.`,
        }
      }
      try {
        const response = await executeRequest(dbRequest, activeEnvironment)
        return {
          requestName: dbRequest.name,
          method: dbRequest.method,
          url: dbRequest.url,
          status: response.status,
          statusText: response.statusText,
          durationMs: response.durationMs,
          bodyPreview: truncateBody(response.body),
          ok: response.ok,
        }
      } catch (err) {
        return {
          requestName: dbRequest.name,
          method: dbRequest.method,
          url: dbRequest.url,
          status: 0,
          statusText: 'Error',
          durationMs: 0,
          bodyPreview: '',
          ok: false,
          error: err instanceof Error ? err.message : 'Execution failed',
        }
      }
    }

    try {
      const response = await executeRequest(request, activeEnvironment)
      return {
        requestName: request.name,
        method: request.method,
        url: request.url,
        status: response.status,
        statusText: response.statusText,
        durationMs: response.durationMs,
        bodyPreview: truncateBody(response.body),
        ok: response.ok,
      }
    } catch (err) {
      return {
        requestName: request.name,
        method: request.method,
        url: request.url,
        status: 0,
        statusText: 'Error',
        durationMs: 0,
        bodyPreview: '',
        ok: false,
        error: err instanceof Error ? err.message : 'Execution failed',
      }
    }
  }, [allRequests, activeEnvironment])

  const executeCollectionById = useCallback(async (collectionId: string): Promise<ExecutionResultData[]> => {
    const trimmedId = collectionId.trim()
    const collection = collections.find((c) => c.id === trimmedId)
    if (!collection) {
      return [{
        requestName: 'Unknown Collection',
        method: '',
        url: '',
        status: 0,
        statusText: 'Not Found',
        durationMs: 0,
        bodyPreview: '',
        ok: false,
        error: `Collection "${trimmedId}" not found.`,
      }]
    }

    const requestIds = collection.requestIds || []
    if (requestIds.length === 0) {
      return [{
        requestName: collection.name,
        method: '',
        url: '',
        status: 0,
        statusText: 'Empty',
        durationMs: 0,
        bodyPreview: '',
        ok: false,
        error: `Collection "${collection.name}" has no requests.`,
      }]
    }

    const results = await Promise.allSettled(
      requestIds.map((id) => executeRequestById(id)),
    )

    return results.map((result) => {
      if (result.status === 'fulfilled') return result.value
      return {
        requestName: 'Unknown',
        method: '',
        url: '',
        status: 0,
        statusText: 'Error',
        durationMs: 0,
        bodyPreview: '',
        ok: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      }
    })
  }, [collections, executeRequestById])

  const sendMessage = useCallback(async (userMessage: string) => {
    const apiKey = getStoredApiKey()
    if (!apiKey) {
      setState((prev) => ({ ...prev, error: 'No API key configured.' }))
      return
    }

    // Add user message
    addMessage({ role: 'user', content: userMessage })

    // Add loading assistant message
    const loadingMsg = addMessage({ role: 'assistant', content: '', isLoading: true })

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Build system prompt with current workspace context
      const context = buildChatContext(collections, allRequests, activeEnvironment)
      const systemPrompt = buildSystemPrompt(context)

      // Build conversation history from the ref (always up-to-date)
      const conversationMessages: ChatMessage[] = messagesRef.current
        .filter((m) => m.role !== 'system' && !m.isLoading)
        .slice(-20)
        .map((m): ChatMessage => ({
          role: m.role as 'user' | 'assistant',
          content: m.content + (m.executionResult
            ? `\n\n[Execution result: ${m.executionResult.requestName} - ${m.executionResult.status} ${m.executionResult.statusText} (${m.executionResult.durationMs}ms)]`
            : '') + (m.batchResults
            ? `\n\n[Batch execution: ${m.batchResults.length} requests executed. ${m.batchResults.filter((r) => r.ok).length} succeeded, ${m.batchResults.filter((r) => !r.ok).length} failed.]`
            : ''),
        }))

      const history: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationMessages,
      ]

      const response = await chatCompletion(apiKey, history)
      const assistantContent = response.choices[0]?.message?.content ?? 'No response received.'

      // Check for execution intents
      const execMatch = assistantContent.match(EXECUTE_REQUEST_REGEX)
      const collExecMatch = assistantContent.match(EXECUTE_COLLECTION_REGEX)

      if (execMatch && execMatch[1]) {
        const requestId = execMatch[1]
        const cleanContent = assistantContent.replace(EXECUTE_REQUEST_REGEX, '').trim()
        updateMessage(loadingMsg.id, { content: cleanContent || 'Executing request…', isLoading: true })

        const result = await executeRequestById(requestId)
        updateMessage(loadingMsg.id, {
          content: cleanContent || `Executed "${result.requestName}".`,
          executionResult: result,
          isLoading: false,
        })
      } else if (collExecMatch && collExecMatch[1]) {
        const collectionId = collExecMatch[1]
        const cleanContent = assistantContent.replace(EXECUTE_COLLECTION_REGEX, '').trim()
        updateMessage(loadingMsg.id, { content: cleanContent || 'Executing collection…', isLoading: true })

        const results = await executeCollectionById(collectionId)
        updateMessage(loadingMsg.id, {
          content: cleanContent || `Executed ${results.length} request(s).`,
          batchResults: results,
          isLoading: false,
        })
      } else {
        updateMessage(loadingMsg.id, { content: assistantContent, isLoading: false })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response.'
      updateMessage(loadingMsg.id, {
        content: `Error: ${errorMessage}`,
        isLoading: false,
      })
      setState((prev) => ({ ...prev, error: errorMessage }))
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [collections, allRequests, activeEnvironment, addMessage, updateMessage, executeRequestById, executeCollectionById])

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    apiKeyStatus: state.apiKeyStatus,
    sendMessage,
    validateKey: handleValidateKey,
    clearKey: handleClearKey,
  }
}
