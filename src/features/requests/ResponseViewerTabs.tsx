import { useState } from 'react'
import { type ResponseRecord } from '../../domain/models'
import './ResponseViewerTabs.css'

export interface ResponseViewerTabsProps {
  response: ResponseRecord
}

export function ResponseViewerTabs({ response }: ResponseViewerTabsProps) {
  const [activeTab, setActiveTab] = useState<'pretty' | 'raw' | 'preview'>('pretty')

  function isPrettyJson(body: string): boolean {
    try {
      JSON.parse(body)
      return true
    } catch {
      return false
    }
  }

  function formatJson(json: string): string {
    try {
      return JSON.stringify(JSON.parse(json), null, 2)
    } catch {
      return json
    }
  }

  function renderPrettyTab() {
    if (response.bodyFormat === 'json' && isPrettyJson(response.body)) {
      return (
        <pre className="response-formatted-json">
          {formatJson(response.body)}
        </pre>
      )
    }

    if (response.body.length === 0) {
      return <p className="empty-response">(empty response body)</p>
    }

    return <pre className="response-body">{response.body}</pre>
  }

  function renderRawTab() {
    return (
      <div className="raw-response">
        <div className="raw-status-line">
          <strong>HTTP/1.1</strong> {response.status} {response.statusText}
        </div>
        <div className="raw-headers">
          {response.headers.map((header) => (
            <div key={`${header.key}-${header.value}`} className="raw-header-line">
              <strong>{header.key}:</strong> {header.value}
            </div>
          ))}
        </div>
        <div className="raw-body">
          {response.body || '(empty response body)'}
        </div>
      </div>
    )
  }

  function renderPreviewTab() {
    // Try to render HTML if the response looks like HTML
    if (
      response.body.toLowerCase().includes('<!doctype html') ||
      response.body.toLowerCase().startsWith('<html')
    ) {
      return (
        <iframe
          className="html-preview"
          srcDoc={response.body}
          title="HTML Preview"
          sandbox=""
        />
      )
    }

    // Otherwise show as text
    return (
      <pre className="response-body">
        {response.body || '(empty response body)'}
      </pre>
    )
  }

  return (
    <div className="response-viewer-tabs">
      <div className="response-meta">
        <span className={`status-badge ${response.ok ? 'status-ok' : 'status-error'}`}>
          {response.status} {response.statusText}
        </span>
        <span className="timing-chip">{response.durationMs} ms</span>
        <span className="format-chip">{response.bodyFormat.toUpperCase()}</span>
        <span className="size-chip">{response.body.length} bytes</span>
      </div>

      <p className="response-url">
        <strong>URL:</strong> {response.url}
      </p>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'pretty' ? 'active' : ''}`}
            onClick={() => setActiveTab('pretty')}
          >
            Pretty
          </button>
          <button
            className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw
          </button>
          {response.body.toLowerCase().includes('html') && (
            <button
              className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'pretty' && renderPrettyTab()}
          {activeTab === 'raw' && renderRawTab()}
          {activeTab === 'preview' && renderPreviewTab()}
        </div>
      </div>

      <div className="response-info">
        <h4>Headers ({response.headers.length})</h4>
        <ul className="headers-list">
          {response.headers.map((header) => (
            <li key={`${header.key}-${header.value}`}>
              <code className="header-key">{header.key}</code>: {header.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
