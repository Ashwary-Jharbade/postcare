import { useEffect, useRef, useState } from 'react'
import { useChatSession, type ChatUIMessage, type ExecutionResultData } from './useChatSession'
import { type CollectionRecord, type RequestRecord, type EnvironmentRecord } from '../../domain/models'
import './ChatModal.css'

interface ChatModalProps {
  open: boolean
  onClose: () => void
  collections: CollectionRecord[]
  requests: RequestRecord[]
  activeEnvironment?: EnvironmentRecord
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Lightweight markdown → HTML renderer (no external dependency)
// Handles: headers, bold, italic, inline code, code blocks, lists, method badges, URLs
// ---------------------------------------------------------------------------

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(text: string): string {
  // Remove execution tags from display
  const md = text
    .replace(/\[EXECUTE_REQUEST:\s*[^\]]+\]/g, '')
    .replace(/\[EXECUTE_COLLECTION:\s*[^\]]+\]/g, '')
    .trim()

  // Split into blocks by code fences first
  const parts: string[] = []
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(md)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineBlocks(md.slice(lastIndex, match.index)))
    }
    const lang = match[1] || ''
    const code = escapeHtml((match[2] || '').trim())
    parts.push(`<pre class="chat-md-codeblock"><code${lang ? ` data-lang="${lang}"` : ''}>${code}</code></pre>`)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < md.length) {
    parts.push(renderInlineBlocks(md.slice(lastIndex)))
  }

  return parts.join('')
}

function renderInlineBlocks(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let inList = false
  let listType: 'ul' | 'ol' = 'ul'

  for (const line of lines) {
    // Headers
    if (line.startsWith('### ')) {
      if (inList) { out.push(`</${listType}>`); inList = false }
      out.push(`<h4 class="chat-md-h3">${renderInline(escapeHtml(line.slice(4)))}</h4>`)
      continue
    }
    if (line.startsWith('## ')) {
      if (inList) { out.push(`</${listType}>`); inList = false }
      out.push(`<h3 class="chat-md-h2">${renderInline(escapeHtml(line.slice(3)))}</h3>`)
      continue
    }
    if (line.startsWith('# ')) {
      if (inList) { out.push(`</${listType}>`); inList = false }
      out.push(`<h3 class="chat-md-h2">${renderInline(escapeHtml(line.slice(2)))}</h3>`)
      continue
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)/)
    if (ulMatch && ulMatch[2] !== undefined) {
      if (!inList || listType !== 'ul') {
        if (inList) out.push(`</${listType}>`)
        out.push('<ul class="chat-md-list">')
        inList = true
        listType = 'ul'
      }
      out.push(`<li>${renderInline(escapeHtml(ulMatch[2]))}</li>`)
      continue
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+[.)]\s+(.*)/)
    if (olMatch && olMatch[2] !== undefined) {
      if (!inList || listType !== 'ol') {
        if (inList) out.push(`</${listType}>`)
        out.push('<ol class="chat-md-list">')
        inList = true
        listType = 'ol'
      }
      out.push(`<li>${renderInline(escapeHtml(olMatch[2]))}</li>`)
      continue
    }

    // Close list if we hit a non-list line
    if (inList) {
      out.push(`</${listType}>`)
      inList = false
    }

    // Empty line
    if (line.trim() === '') {
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push('<hr class="chat-md-hr"/>')
      continue
    }

    // Normal paragraph
    out.push(`<p class="chat-md-p">${renderInline(escapeHtml(line))}</p>`)
  }

  if (inList) out.push(`</${listType}>`)

  return out.join('')
}

function renderInline(html: string): string {
  let result = html

  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code class="chat-md-code">$1</code>')

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')

  // HTTP method badges
  for (const method of HTTP_METHODS) {
    const re = new RegExp(`\\b(${method})\\b`, 'g')
    result = result.replace(re, `<span class="chat-md-method chat-md-method-${method.toLowerCase()}">$1</span>`)
  }

  // URLs (basic — not inside tags)
  result = result.replace(
    /(?<!")(https?:\/\/[^\s<)"]+)/g,
    '<span class="chat-md-url">$1</span>',
  )

  return result
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ExecutionResult({ result }: { result: ExecutionResultData }) {
  return (
    <div className="chat-exec-result">
      <div className="chat-exec-result-header">
        <span className={`chat-exec-status ${result.ok ? 'chat-exec-status-ok' : 'chat-exec-status-error'}`}>
          {result.ok ? '✓' : '✗'} {result.status || 'ERR'}
        </span>
        <span>{result.requestName}</span>
      </div>
      <div className="chat-exec-meta">
        <span>{result.method} {result.url}</span>
        {result.durationMs > 0 && <span>{result.durationMs}ms</span>}
      </div>
      {result.error && (
        <div className="chat-key-error" style={{ marginBottom: '0.35rem' }}>{result.error}</div>
      )}
      {result.bodyPreview && (
        <pre className="chat-exec-body">{result.bodyPreview}</pre>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatUIMessage }) {
  if (message.isLoading) {
    return (
      <div className="chat-message chat-message-assistant">
        <div className="chat-loading-dots">
          <span className="chat-loading-dot" />
          <span className="chat-loading-dot" />
          <span className="chat-loading-dot" />
        </div>
      </div>
    )
  }

  const isAssistant = message.role === 'assistant'

  return (
    <div className={`chat-message chat-message-${message.role}`}>
      {isAssistant ? (
        <div
          className="chat-message-bubble chat-md-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
      ) : (
        <div className="chat-message-bubble">{message.content}</div>
      )}
      {message.executionResult && (
        <ExecutionResult result={message.executionResult} />
      )}
      {message.batchResults && message.batchResults.length > 0 && (
        <div className="chat-batch-results">
          <div className="chat-batch-summary">
            {message.batchResults.filter((r) => r.ok).length}/{message.batchResults.length} requests succeeded
          </div>
          {message.batchResults.map((result, i) => (
            <ExecutionResult key={i} result={result} />
          ))}
        </div>
      )}
      <span className="chat-message-timestamp">{formatTime(message.timestamp)}</span>
    </div>
  )
}

export function ChatModal({
  open,
  onClose,
  collections,
  requests,
  activeEnvironment,
}: ChatModalProps) {
  const chat = useChatSession(collections, requests, activeEnvironment)
  const [input, setInput] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Focus input when chat opens
  useEffect(() => {
    if (open && chat.apiKeyStatus === 'valid') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, chat.apiKeyStatus])

  if (!open) return null

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || chat.isLoading) return
    setInput('')
    void chat.sendMessage(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = keyInput.trim()
    if (!trimmed) return
    await chat.validateKey(trimmed)
  }

  function handleHintClick(text: string) {
    setInput(text)
    void chat.sendMessage(text)
  }

  return (
    <div className="chat-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <svg className="chat-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <h3>Postcare AI</h3>
          </div>
          <div className="chat-header-actions">
            {chat.apiKeyStatus === 'valid' && (
              <button className="chat-header-btn" onClick={chat.clearKey} title="Change API key">
                Key
              </button>
            )}
            <button className="chat-header-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Key Prompt */}
        {chat.apiKeyStatus !== 'valid' ? (
          <div className="chat-key-prompt">
            <svg className="chat-key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <h4>Connect to Cerebras AI</h4>
            <p>
              Enter your Cerebras API key to start chatting.
              Your key is stored locally and never shared.
            </p>
            <form className="chat-key-form" onSubmit={handleKeySubmit}>
              <input
                type="password"
                className="chat-key-input"
                placeholder="csk-xxxxxxxxxxxx"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="chat-key-submit"
                disabled={!keyInput.trim() || chat.apiKeyStatus === 'validating'}
              >
                {chat.apiKeyStatus === 'validating' ? 'Validating…' : 'Connect'}
              </button>
            </form>
            {chat.error && <div className="chat-key-error">{chat.error}</div>}
            <a
              className="chat-key-link"
              href="https://cloud.cerebras.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get a free API key at cloud.cerebras.ai →
            </a>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="chat-messages">
              {chat.messages.length === 0 && (
                <div className="chat-welcome">
                  <strong>Welcome to Postcare AI</strong>
                  Ask about your collections and requests, or execute APIs directly.
                  <div className="chat-welcome-hints">
                    {collections.length > 0 && (
                      <button
                        className="chat-welcome-hint"
                        onClick={() => handleHintClick('List all my collections and their requests')}
                      >
                        💬 List all my collections and their requests
                      </button>
                    )}
                    {collections.length > 0 && collections[0] && (
                      <button
                        className="chat-welcome-hint"
                        onClick={() => handleHintClick(`Execute all requests in "${collections[0]?.name}"`)}
                      >
                        ⚡ Execute all requests in &ldquo;{collections[0]?.name}&rdquo;
                      </button>
                    )}
                    <button
                      className="chat-welcome-hint"
                      onClick={() => handleHintClick('What can you help me with?')}
                    >
                      ❓ What can you help me with?
                    </button>
                  </div>
                </div>
              )}
              {chat.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Ask about your APIs…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || chat.isLoading}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
