import { useMemo, useState } from 'react'
import { type ResponseRecord } from '../../domain/models'
import { type ComparisonResult } from '../../lib/comparison/models'
import { diffHeaders, diffJsonStructure, generateLineDiff } from '../../lib/comparison/diffHighlight'
import './ResponseComparisonPanel.css'

interface ResponseComparisonPanelProps {
  results: ComparisonResult[]
  isExecuting: boolean
  error: string | null
}

type ViewMode = 'side-by-side' | 'unified'

const MAX_HEADERS = 6
const MAX_BODY_PREVIEW = 220
const MAX_DIFF_LINES = 40
const MAX_STRUCTURE_ROWS = 8

function parseJsonBody(response: ResponseRecord): unknown | null {
  if (response.bodyFormat !== 'json') {
    return null
  }

  try {
    return JSON.parse(response.body)
  } catch {
    return null
  }
}

function formatBodyForDiff(response: ResponseRecord): string {
  const parsed = parseJsonBody(response)
  if (parsed !== null) {
    return JSON.stringify(parsed, null, 2)
  }

  return response.body
}

export function ResponseComparisonPanel({
  results,
  isExecuting,
  error,
}: ResponseComparisonPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side')

  const baselineResult = useMemo(
    () => results.find((result) => result.status === 'success' && result.response),
    [results],
  )

  if (error) {
    return (
      <div className="comparison-panel">
        <div className="comparison-error">{error}</div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="comparison-panel">
        <div className="comparison-empty">No comparison results yet</div>
      </div>
    )
  }

  if (isExecuting) {
    return (
      <div className="comparison-panel">
        <div className="comparison-executing">
          <div className="spinner"></div>
          Executing requests...
        </div>
      </div>
    )
  }

  if (viewMode === 'side-by-side') {
    return (
      <div className="comparison-panel">
        <div className="comparison-controls">
          <button
            className="view-mode-btn active"
            onClick={() => setViewMode('side-by-side')}
          >
            Side by Side
          </button>
          <button
            className="view-mode-btn"
            onClick={() => setViewMode('unified')}
          >
            Unified
          </button>
        </div>

        <div className="comparison-grid">
          {results.map((result) => {
            const baselineResponse = baselineResult?.response ?? null
            const isBaseline = baselineResult?.environmentId === result.environmentId

            if (result.status !== 'success' || !result.response) {
              return (
                <div key={result.environmentId} className="comparison-column">
                  <div
                    className="comparison-header"
                    style={{ borderColor: result.environmentColor }}
                  >
                    <span className="env-name">{result.environmentName}</span>
                    <span className={`status-badge ${result.status}`}>
                      {result.response ? `${result.response.status}` : 'Error'}
                    </span>
                  </div>

                  <div className="comparison-error-content">
                    <p>{result.error || 'Request failed'}</p>
                  </div>
                </div>
              )
            }

            const headerDiff =
              baselineResponse && !isBaseline
                ? diffHeaders(baselineResponse.headers, result.response.headers)
                : null

            const bodyDiff =
              baselineResponse && !isBaseline
                ? generateLineDiff(
                    formatBodyForDiff(baselineResponse),
                    formatBodyForDiff(result.response),
                  )
                : null

            const baselineJson = baselineResponse ? parseJsonBody(baselineResponse) : null
            const currentJson = parseJsonBody(result.response)

            const structureDiff =
              baselineJson !== null && currentJson !== null && !isBaseline
                ? diffJsonStructure(baselineJson, currentJson)
                : null

            const addedHeaderKeys = new Set(
              (headerDiff?.added ?? []).map((header) => header.key.toLowerCase()),
            )
            const changedHeaders = new Map(
              (headerDiff?.changed ?? []).map((header) => [header.key.toLowerCase(), header]),
            )

            return (
              <div key={result.environmentId} className="comparison-column">
                <div
                  className="comparison-header"
                  style={{ borderColor: result.environmentColor }}
                >
                  <span className="env-name">{result.environmentName}</span>
                  <span className={`status-badge ${result.status}`}>
                    {result.response.status}
                  </span>
                </div>

                <div className="comparison-content">
                  <div className="response-section">
                    <div className="section-label">Status</div>
                    <div className="section-value">
                      {result.response.status} {result.response.statusText}
                    </div>
                  </div>

                  <div className="response-section">
                    <div className="section-label">Duration</div>
                    <div className="section-value">{result.response.durationMs}ms</div>
                  </div>

                  <div className="response-section">
                    <div className="section-label">Headers</div>
                    {!headerDiff ? (
                      <div className="diff-note baseline-note">Baseline response</div>
                    ) : (
                      <div className="diff-note">
                        {headerDiff.added.length} added, {headerDiff.changed.length} changed, {headerDiff.removed.length} removed
                      </div>
                    )}
                    <div className="headers-list">
                      {result.response.headers.slice(0, MAX_HEADERS).map((header, idx) => {
                        const keyLower = header.key.toLowerCase()
                        const changedHeader = changedHeaders.get(keyLower)
                        const headerClass = addedHeaderKeys.has(keyLower)
                          ? 'header-added'
                          : changedHeader
                            ? 'header-changed'
                            : 'header-unchanged'

                        return (
                          <div key={idx} className={`header-item ${headerClass}`}>
                            <span className="header-key">{header.key}:</span>
                            <span className="header-value">
                              {changedHeader
                                ? `${header.value} (was ${changedHeader.old})`
                                : header.value}
                            </span>
                          </div>
                        )
                      })}
                      {result.response.headers.length > MAX_HEADERS && (
                        <div className="header-item">+{result.response.headers.length - MAX_HEADERS} more</div>
                      )}
                      {(headerDiff?.removed.length ?? 0) > 0 && (
                        <div className="removed-headers">
                          {(headerDiff?.removed ?? []).slice(0, 3).map((header, idx) => (
                            <div key={idx} className="header-item header-removed">
                              <span className="header-key">{header.key}:</span>
                              <span className="header-value">missing in this response</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="response-section">
                    <div className="section-label">Payload Diff</div>
                    {!bodyDiff ? (
                      <pre className="body-preview">
                        <code>
                          {result.response.body.length > MAX_BODY_PREVIEW
                            ? result.response.body.substring(0, MAX_BODY_PREVIEW) + '...'
                            : result.response.body}
                        </code>
                      </pre>
                    ) : (
                      <>
                        <div className="diff-note">
                          {bodyDiff.addedCount} added lines, {bodyDiff.removedCount} removed lines
                        </div>
                        <pre className="body-diff-preview">
                          <code>
                            {bodyDiff.lines.slice(0, MAX_DIFF_LINES).map((line) => (
                              <span
                                key={line.lineNumber}
                                className={`diff-line diff-${line.type}`}
                              >
                                {line.type === 'added'
                                  ? '+'
                                  : line.type === 'removed'
                                    ? '-'
                                    : ' '}
                                {line.content}
                                {'\n'}
                              </span>
                            ))}
                          </code>
                        </pre>
                      </>
                    )}
                  </div>

                  <div className="response-section">
                    <div className="section-label">JSON Structure</div>
                    {!structureDiff ? (
                      <div className="structure-note">Requires valid JSON responses for comparison.</div>
                    ) : !structureDiff.hasDifferences ? (
                      <div className="structure-note">No structural differences from baseline.</div>
                    ) : (
                      <div className="structure-diff">
                        <div className="diff-note">
                          {structureDiff.added.length} added paths, {structureDiff.removed.length} removed paths, {structureDiff.changed.length} type changes
                        </div>
                        {structureDiff.added.slice(0, MAX_STRUCTURE_ROWS).map((entry) => (
                          <div key={`added-${entry.path}`} className="structure-row structure-added">
                            + {entry.path} ({entry.type})
                          </div>
                        ))}
                        {structureDiff.removed.slice(0, MAX_STRUCTURE_ROWS).map((entry) => (
                          <div key={`removed-${entry.path}`} className="structure-row structure-removed">
                            - {entry.path} ({entry.type})
                          </div>
                        ))}
                        {structureDiff.changed.slice(0, MAX_STRUCTURE_ROWS).map((entry) => (
                          <div key={`changed-${entry.path}`} className="structure-row structure-changed">
                            ~ {entry.path} ({entry.oldType} to {entry.newType})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="comparison-panel">
      <div className="comparison-controls">
        <button
          className="view-mode-btn"
          onClick={() => setViewMode('side-by-side')}
        >
          Side by Side
        </button>
        <button
          className="view-mode-btn active"
          onClick={() => setViewMode('unified')}
        >
          Unified
        </button>
      </div>

      <div className="comparison-unified">
        {results.map((result, idx) => (
          <div key={result.environmentId} className="unified-result">
            {idx > 0 && <div className="unified-divider"></div>}

            <div
              className="unified-header"
              style={{ borderLeftColor: result.environmentColor }}
            >
              <span>{result.environmentName}</span>
              {result.response && <span className="unified-status">{result.response.status}</span>}
            </div>

            {result.status === 'success' && result.response && (
              <pre className="unified-body">
                <code>{result.response.body}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
