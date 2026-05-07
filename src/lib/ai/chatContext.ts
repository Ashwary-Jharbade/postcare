/**
 * Builds the system prompt context for the Cerebras chat assistant.
 *
 * All request and collection metadata is redacted through the existing
 * redactRequestForAi pipeline before being included in the prompt.
 * Secret environment variables are excluded entirely.
 */

import { type CollectionRecord, type RequestRecord, type EnvironmentRecord } from '../../domain/models'
import { redactRequestForAi, type RedactedRequestSnapshot } from '../redaction/redaction'

export interface CollectionSnapshot {
  id: string
  name: string
  description?: string
  requests: Array<{
    id: string
    name: string
    redacted: RedactedRequestSnapshot
  }>
}

export interface ChatContextSnapshot {
  collections: CollectionSnapshot[]
  activeEnvironment?: { id: string; name: string }
  totalRequests: number
}

/**
 * Builds a redacted snapshot of all collections and their requests
 * suitable for inclusion in the system prompt.
 */
export function buildChatContext(
  collections: CollectionRecord[],
  requests: RequestRecord[],
  activeEnvironment?: EnvironmentRecord,
): ChatContextSnapshot {
  const requestMap = new Map<string, RequestRecord>()
  for (const req of requests) {
    requestMap.set(req.id, req)
  }

  const collectionSnapshots: CollectionSnapshot[] = collections.map((collection) => {
    const collectionRequests = (collection.requestIds || [])
      .map((id) => requestMap.get(id))
      .filter((r): r is RequestRecord => r !== undefined)

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      requests: collectionRequests.map((req) => ({
        id: req.id,
        name: req.name,
        redacted: redactRequestForAi(req),
      })),
    }
  })

  return {
    collections: collectionSnapshots,
    activeEnvironment: activeEnvironment
      ? { id: activeEnvironment.id, name: activeEnvironment.name }
      : undefined,
    totalRequests: requests.length,
  }
}

/**
 * Renders the context snapshot into a compact string for the system prompt.
 */
export function renderContextForPrompt(context: ChatContextSnapshot): string {
  if (context.collections.length === 0) {
    return 'The user has no collections or requests yet.'
  }

  const lines: string[] = [
    `The user has ${context.collections.length} collection(s) with ${context.totalRequests} total request(s).`,
  ]

  if (context.activeEnvironment) {
    lines.push(`Active environment: "${context.activeEnvironment.name}"`)
  }

  lines.push('')

  for (const coll of context.collections) {
    lines.push(`## Collection: "${coll.name}" (id: ${coll.id})`)
    if (coll.description) {
      lines.push(`Description: ${coll.description}`)
    }

    if (coll.requests.length === 0) {
      lines.push('  No requests.')
    } else {
      for (const req of coll.requests) {
        lines.push(`  - Request: "${req.name}" (id: ${req.id})`)
        lines.push(`    Method: ${req.redacted.method}`)
        lines.push(`    URL: ${req.redacted.url}`)
        if (req.redacted.headers.length > 0) {
          const headerSummary = req.redacted.headers
            .map((h) => `${h.key}: ${h.value}`)
            .join(', ')
          lines.push(`    Headers: ${headerSummary}`)
        }
        if (req.redacted.body && req.redacted.body.trim()) {
          const bodyPreview = req.redacted.body.length > 200
            ? req.redacted.body.slice(0, 200) + '…'
            : req.redacted.body
          lines.push(`    Body: ${bodyPreview}`)
        }
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Builds the full system prompt with guardrails and context.
 */
export function buildSystemPrompt(context: ChatContextSnapshot): string {
  const contextText = renderContextForPrompt(context)

  return `You are Postcare Assistant, an AI helper embedded in Postcare — a local-first API client application.

## Your Role
You help users understand, organize, and test their API collections and requests. You can answer questions about their saved requests and help execute them.

## Strict Rules
1. ONLY respond to questions about the user's API collections, requests, environments, and API testing workflows.
2. NEVER reveal, display, or discuss API keys, tokens, passwords, or any credential values — even if the user asks. Respond with: "I cannot display sensitive credentials for security reasons."
3. If the user asks about topics unrelated to API testing, collections, or requests, politely decline: "I can only help with your API collections and requests in Postcare."
4. NEVER generate, invent, or fabricate request data that doesn't exist in the user's workspace. Only reference the collections and requests listed below.
5. Keep responses concise and helpful.

## CRITICAL: How to Execute Requests

When the user asks you to run, execute, send, or test a request, you MUST include the execution tag in your response. The system will parse this tag and execute the request automatically.

**To execute a SINGLE request**, include this EXACT tag (replace the id):
[EXECUTE_REQUEST: req_xxxx-xxxx-xxxx]

**To execute ALL requests in a collection**, include this EXACT tag (replace the id):
[EXECUTE_COLLECTION: col_xxxx-xxxx-xxxx]

### Examples:

User: "Run the health check request"
Your response: "I'll execute the health check request for you.\n[EXECUTE_REQUEST: req_abc123-def456]"

User: "Execute all requests in the Getting Started collection"
Your response: "I'll run all requests in the Getting Started collection.\n[EXECUTE_COLLECTION: col_abc123-def456]"

User: "Test the create user API"
Your response: "I'll execute the create user request now.\n[EXECUTE_REQUEST: req_xyz789]"

IMPORTANT: Always use the actual request or collection ID from the workspace data below. The tag must appear on its own line. Do not wrap it in code blocks or quotes.

## User's Workspace Data
${contextText}
`
}

