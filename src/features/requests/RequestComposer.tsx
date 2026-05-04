import { useState } from 'react'
import {
  type AuthType,
  type HttpMethod,
  type KeyValueEntry,
  type RequestBodyMode,
  type EnvironmentRecord,
} from '../../domain/models'
import { useRequestComposer } from './useRequestComposer'
import { useRequestExecution } from './useRequestExecution'
import { useResponseComparison } from './useResponseComparison'
import { ResponseViewerTabs } from './ResponseViewerTabs'
import { VariableInfo } from './VariableInfo'
import { CodeGeneratorPanel } from './CodeGeneratorPanel'
import { ResponseComparisonPanel } from './ResponseComparisonPanel'
import { AiAssistPanel } from './AiAssistPanel'
import { type SimulationMode } from './requestExecution'
import {
  createFormDataEntry,
  getBodyPreviewText,
  getDefaultContentType,
} from '../../lib/body/requestBodyState'
import { parseCurlCommand } from './curlImport'
import './ResponseViewerTabs.css'
import './VariableInfo.css'
import './ResponseComparisonPanel.css'
import './AiAssistPanel.css'

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const BODY_MODES: RequestBodyMode[] = ['none', 'json', 'text', 'form-data', 'raw']
const AUTH_TYPES: AuthType[] = ['none', 'apiKey', 'bearer', 'basic', 'oauth2']
type ComposerTab = 'queryParams' | 'header' | 'auth' | 'body'
const COMPOSER_TABS: Array<{ id: ComposerTab; label: string }> = [
  { id: 'queryParams', label: 'Query params' },
  { id: 'header', label: 'Header' },
  { id: 'auth', label: 'Auth' },
  { id: 'body', label: 'Body' },
]
const SIMULATION_MODES: Array<{ label: string; value: SimulationMode }> = [
  { label: 'Off', value: 'off' },
  { label: 'Network error', value: 'network-error' },
  { label: 'Timeout', value: 'timeout' },
  { label: 'HTTP error', value: 'http-error' },
  { label: 'Malformed JSON', value: 'malformed-json' },
  { label: 'Empty body', value: 'empty-body' },
  { label: 'Large payload', value: 'large-payload' },
]

export interface RequestComposerProps {
  requestId: string | null
  environment?: EnvironmentRecord
}

export function RequestComposer({ requestId, environment }: RequestComposerProps) {
  const composer = useRequestComposer(requestId)
  const execution = useRequestExecution()
  const comparison = useResponseComparison()
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('off')
  const [simulationDelayMs, setSimulationDelayMs] = useState('0')
  const [simulationStatusCode, setSimulationStatusCode] = useState('500')
  const [jsonFormatError, setJsonFormatError] = useState<string | null>(null)
  const [activeComposerTab, setActiveComposerTab] = useState<ComposerTab>('queryParams')
  const [isCurlImportOpen, setIsCurlImportOpen] = useState(false)
  const [curlImportText, setCurlImportText] = useState('')
  const [curlImportError, setCurlImportError] = useState<string | null>(null)
  const [curlImportWarnings, setCurlImportWarnings] = useState<string[]>([])

  function updateFieldRows(
    rows: KeyValueEntry[],
    rowId: string,
    key: 'key' | 'value',
    value: string,
    target: 'headers' | 'queryParams',
  ) {
    const nextRows = rows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))

    if (target === 'headers') {
      composer.setHeaders(nextRows)
      return
    }

    composer.setQueryParams(nextRows)
  }

  function toggleFieldRow(
    rows: KeyValueEntry[],
    rowId: string,
    target: 'headers' | 'queryParams',
  ) {
    const nextRows = rows.map((row) =>
      row.id === rowId ? { ...row, enabled: !row.enabled } : row,
    )

    if (target === 'headers') {
      composer.setHeaders(nextRows)
      return
    }

    composer.setQueryParams(nextRows)
  }

  function removeFieldRow(
    rows: KeyValueEntry[],
    rowId: string,
    target: 'headers' | 'queryParams',
  ) {
    const nextRows = rows.filter((row) => row.id !== rowId)

    if (target === 'headers') {
      composer.setHeaders(nextRows)
      return
    }

    composer.setQueryParams(nextRows)
  }

  function renderFieldTable(label: 'headers' | 'queryParams', rows: KeyValueEntry[]) {
    return (
      <div className="field-table">
        {rows.length === 0 ? <p className="subtle">No {label} configured yet.</p> : null}
        {rows.map((row) => (
          <div className="field-row" key={row.id}>
            <label className="check-row">
              <input
                checked={row.enabled}
                onChange={() => toggleFieldRow(rows, row.id, label)}
                type="checkbox"
              />
              <span>Enabled</span>
            </label>
            <input
              aria-label={`${label} key`}
              className="input"
              onChange={(event) =>
                updateFieldRows(rows, row.id, 'key', event.target.value, label)
              }
              placeholder="Key"
              value={row.key}
            />
            <input
              aria-label={`${label} value`}
              className="input"
              onChange={(event) =>
                updateFieldRows(rows, row.id, 'value', event.target.value, label)
              }
              placeholder="Value"
              value={row.value}
            />
            <button
              className="ghost-button"
              onClick={() => removeFieldRow(rows, row.id, label)}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    )
  }

  if (composer.state.status === 'loading') {
    return (
      <section className="composer-shell">
        <h2>Request composer</h2>
        <p>Loading request from local storage.</p>
      </section>
    )
  }

  if (composer.state.status === 'unavailable') {
    return (
      <section className="composer-shell">
        <h2>Request composer</h2>
        <p>IndexedDB is unavailable, so request editing cannot start in this environment.</p>
      </section>
    )
  }

  if (composer.state.status === 'error') {
    return (
      <section className="composer-shell">
        <h2>Request composer</h2>
        <p>Composer failed to load: {composer.state.message}</p>
      </section>
    )
  }

  const { request, saveMessage, saveState } = composer.state

  function setAuthType(type: AuthType) {
    composer.setAuth(type)
  }

  function setAuthField(key: string, value: string) {
    composer.setAuthConfig(key, value)
  }

  function openCurlImport() {
    setIsCurlImportOpen(true)
    setCurlImportError(null)
  }

  function closeCurlImport() {
    setIsCurlImportOpen(false)
    setCurlImportError(null)
  }

  function applyCurlImport() {
    try {
      const imported = parseCurlCommand(curlImportText)
      composer.importCurlRequest(imported)
      setCurlImportWarnings(imported.warnings)
      setCurlImportError(null)
      setIsCurlImportOpen(false)
      setActiveComposerTab(
        imported.body.mode !== 'none'
          ? 'body'
          : imported.headers.length > 0
            ? 'header'
            : 'queryParams',
      )
    } catch (error) {
      setCurlImportError(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  function renderAuthFields() {
    if (request.auth.type === 'none') {
      return <p className="subtle">No authentication will be attached to this request.</p>
    }

    if (request.auth.type === 'apiKey') {
      return (
        <div className="composer-grid">
          <label className="stack-field">
            <span>Header or key name</span>
            <input
              className="input"
              onChange={(event) => setAuthField('keyName', event.target.value)}
              value={request.auth.config.keyName ?? ''}
            />
          </label>
          <label className="stack-field">
            <span>API key value</span>
            <input
              className="input"
              onChange={(event) => setAuthField('keyValue', event.target.value)}
              type="password"
              value={request.auth.config.keyValue ?? ''}
            />
          </label>
        </div>
      )
    }

    if (request.auth.type === 'bearer') {
      return (
        <label className="stack-field">
          <span>Bearer token</span>
          <input
            className="input"
            onChange={(event) => setAuthField('token', event.target.value)}
            type="password"
            value={request.auth.config.token ?? ''}
          />
        </label>
      )
    }

    if (request.auth.type === 'basic') {
      return (
        <div className="composer-grid">
          <label className="stack-field">
            <span>Username</span>
            <input
              className="input"
              onChange={(event) => setAuthField('username', event.target.value)}
              value={request.auth.config.username ?? ''}
            />
          </label>
          <label className="stack-field">
            <span>Password</span>
            <input
              className="input"
              onChange={(event) => setAuthField('password', event.target.value)}
              type="password"
              value={request.auth.config.password ?? ''}
            />
          </label>
        </div>
      )
    }

    return (
      <p className="subtle">
        OAuth2 UI is planned next. This placeholder preserves the auth contract without sending
        OAuth secrets yet.
      </p>
    )
  }

  function handleBodyModeChange(mode: RequestBodyMode) {
    const previousMode = request.body.mode

    const newBody = {
      mode,
      contentType: getDefaultContentType(mode),
      content: '',
      formData: [] as import('../../domain/models').KeyValueEntry[],
    }

    if (mode === 'form-data') {
      newBody.formData =
        previousMode === 'form-data' && request.body.formData.length > 0
          ? request.body.formData
          : [createFormDataEntry()]
    } else if (previousMode !== 'form-data') {
      // Preserve existing text content when switching between text modes
      newBody.content = request.body.content
    }

    composer.setBody(newBody)
  }

  function updateFormDataEntries(
    updater: (entries: KeyValueEntry[]) => KeyValueEntry[],
  ) {
    composer.setFormData(updater(request.body.formData))
  }

  function renderBodyEditor() {
    if (request.body.mode === 'none') {
      return <p className="subtle">No body will be sent for this request.</p>
    }

    if (request.body.mode === 'json') {
      return (
        <>
          <div className="section-header">
            <h4>JSON body</h4>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(request.body.content || '{}')
                  composer.setBodyContent(JSON.stringify(parsed, null, 2))
                  setJsonFormatError(null)
                } catch {
                  setJsonFormatError('Cannot format invalid JSON.')
                }
              }}
            >
              Format JSON
            </button>
          </div>
          <textarea
            className="textarea"
            onChange={(event) => {
              setJsonFormatError(null)
              composer.setBodyContent(event.target.value)
            }}
            placeholder='{"message":"Hello from Postcare"}'
            rows={10}
            value={request.body.content}
          />
          {jsonFormatError && <p className="response-error-state">{jsonFormatError}</p>}
        </>
      )
    }

    if (request.body.mode === 'text') {
      return (
        <textarea
          className="textarea"
          onChange={(event) => composer.setBodyContent(event.target.value)}
          placeholder="Plain text body"
          rows={8}
          value={request.body.content}
        />
      )
    }

    if (request.body.mode === 'raw') {
      return (
        <>
          <div className="composer-grid">
            <label className="stack-field">
              <span>Content-Type</span>
              <input
                className="input"
                value={request.body.contentType}
                onChange={(event) => composer.setBodyContentType(event.target.value)}
                placeholder="application/octet-stream"
              />
            </label>
          </div>
          <textarea
            className="textarea"
            value={request.body.content}
            onChange={(event) => composer.setBodyContent(event.target.value)}
            placeholder="Raw payload"
            rows={8}
          />
        </>
      )
    }

    const formDataEntries = request.body.formData.length > 0
      ? request.body.formData
      : [createFormDataEntry()]

    return (
      <>
        <div className="section-header">
          <h4>Form data fields</h4>
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              updateFormDataEntries((entries) => [...entries, createFormDataEntry()])
            }
          >
            Add field
          </button>
        </div>
        <div className="field-table">
          {formDataEntries.map((entry) => (
            <div className="field-row" key={entry.id}>
              <label className="check-row">
                <input
                  checked={entry.enabled}
                  type="checkbox"
                  onChange={() =>
                    updateFormDataEntries((entries) =>
                      entries.map((item) =>
                        item.id === entry.id ? { ...item, enabled: !item.enabled } : item,
                      ),
                    )
                  }
                />
                <span>Enabled</span>
              </label>
              <input
                className="input"
                placeholder="Field name"
                value={entry.key}
                onChange={(event) =>
                  updateFormDataEntries((entries) =>
                    entries.map((item) =>
                      item.id === entry.id ? { ...item, key: event.target.value } : item,
                    ),
                  )
                }
              />
              <input
                className="input"
                placeholder="Field value"
                value={entry.value}
                onChange={(event) =>
                  updateFormDataEntries((entries) =>
                    entries.map((item) =>
                      item.id === entry.id ? { ...item, value: event.target.value } : item,
                    ),
                  )
                }
              />
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  updateFormDataEntries((entries) => entries.filter((item) => item.id !== entry.id))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </>
    )
  }

  function renderResponsePanel() {
    if (execution.state.status === 'idle') {
      return <p className="response-empty-state">No response yet. Send the request to inspect the result.</p>
    }

    if (execution.state.status === 'running') {
      return <p className="response-loading-state">{execution.state.message}</p>
    }

    if (execution.state.status === 'error') {
      return <p className="response-error-state">Request failed: {execution.state.message}</p>
    }

    const { response } = execution.state

    return <ResponseViewerTabs response={response} />
  }

  return (
    <section className="composer-shell" aria-label="request composer">
      <div className="composer-header">
        <div>
          <p className="eyebrow">First workflow</p>
          <h2>Request composer</h2>
        </div>
        <p
          className={`save-pill ${saveState === 'error' ? 'save-pill-error' : ''}`}
          role="status"
        >
          {saveState === 'saving' ? 'Saving locally' : saveMessage ?? 'Ready'}
        </p>
      </div>

      <div className="section-header">
        <div>
          <h3>Execution</h3>
          <p className="subtle">Run the current request directly from the browser.</p>
        </div>
        <button className="ghost-button" onClick={openCurlImport} type="button">
          Import cURL
        </button>
      </div>

      {curlImportWarnings.length > 0 && (
        <div className="composer-import-feedback" role="status">
          <strong>Imported with warnings.</strong>
          <ul>
            {curlImportWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {isCurlImportOpen && (
        <div
          aria-label="Import cURL"
          aria-modal="true"
          className="composer-import-overlay"
          role="dialog"
        >
          <div className="composer-import-dialog">
            <div className="section-header">
              <div>
                <h3>Import request from cURL</h3>
                <p className="subtle">
                  Paste a single cURL command. Postcare will only parse it locally.
                </p>
              </div>
            </div>
            <label className="stack-field">
              <span>cURL command</span>
              <textarea
                className="textarea"
                onChange={(event) => setCurlImportText(event.target.value)}
                placeholder={'curl https://api.example.com/users -H "Content-Type: application/json" --data \'{"name":"Ada"}\''}
                value={curlImportText}
              />
            </label>
            {curlImportError && (
              <p className="response-error-state" role="alert">
                {curlImportError}
              </p>
            )}
            <div className="composer-import-actions">
              <button className="ghost-button" onClick={closeCurlImport} type="button">
                Cancel
              </button>
              <button className="primary-button" onClick={applyCurlImport} type="button">
                Apply to composer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="composer-grid">
        <label className="stack-field">
          <span>Simulation mode</span>
          <select
            className="input"
            onChange={(event) => setSimulationMode(event.target.value as SimulationMode)}
            value={simulationMode}
          >
            {SIMULATION_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
        <label className="stack-field">
          <span>Mock delay (ms)</span>
          <input
            className="input"
            min={0}
            onChange={(event) => setSimulationDelayMs(event.target.value)}
            type="number"
            value={simulationDelayMs}
          />
        </label>
        <label className="stack-field">
          <span>Mock status code</span>
          <input
            className="input"
            max={599}
            min={100}
            onChange={(event) => setSimulationStatusCode(event.target.value)}
            type="number"
            value={simulationStatusCode}
          />
        </label>
      </div>

      <div className="composer-grid">
        <label className="stack-field">
          <span>Name</span>
          <input
            className="input"
            onChange={(event) => composer.setName(event.target.value)}
            value={request.name}
          />
        </label>
      </div>

      <label className="stack-field">
        <span>URL</span>
        <div className="url-input-row">
          <select
            className="input method-select"
            onChange={(event) => composer.setMethod(event.target.value as HttpMethod)}
            value={request.method}
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <input
            className="input"
            onChange={(event) => composer.setUrl(event.target.value)}
            placeholder="https://api.example.com/health"
            value={request.url}
          />
          <button
            className="primary-button"
            disabled={execution.state.status === 'running'}
            onClick={() =>
              execution.run(request, environment, {
                simulation: {
                  mode: simulationMode,
                  delayMs: Number.parseInt(simulationDelayMs, 10) || 0,
                  forcedStatus: Number.parseInt(simulationStatusCode, 10) || 500,
                },
              })
            }
            type="button"
          >
            {execution.state.status === 'running' ? 'Sending…' : 'Send'}
          </button>
        </div>
      </label>

      <div className="composer-section composer-tabs-section">
        <div className="composer-tabs-container">
          <div className="composer-tabs" role="tablist" aria-label="Request sections">
            {COMPOSER_TABS.map((tab) => {
              const tabPanelId = `composer-tab-panel-${tab.id}`
              const isActive = activeComposerTab === tab.id

              return (
                <button
                  key={tab.id}
                  className={`composer-tab ${isActive ? 'composer-tab-active' : ''}`}
                  role="tab"
                  type="button"
                  id={`composer-tab-${tab.id}`}
                  aria-controls={tabPanelId}
                  aria-selected={isActive}
                  onClick={() => setActiveComposerTab(tab.id)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeComposerTab === 'queryParams' && (
            <div
              className="composer-tab-panel"
              id="composer-tab-panel-queryParams"
              role="tabpanel"
              aria-labelledby="composer-tab-queryParams"
            >
            <div className="section-header">
              <h3>Query params</h3>
              <button className="ghost-button" onClick={() => composer.addQueryParamRow()} type="button">
                Add param
              </button>
            </div>
            {renderFieldTable('queryParams', request.queryParams)}
          </div>
          )}

          {activeComposerTab === 'header' && (
            <div
              className="composer-tab-panel"
              id="composer-tab-panel-header"
              role="tabpanel"
              aria-labelledby="composer-tab-header"
            >
            <div className="section-header">
              <h3>Header</h3>
              <button className="ghost-button" onClick={() => composer.addHeaderRow()} type="button">
                Add header
              </button>
            </div>
            {renderFieldTable('headers', request.headers)}
          </div>
          )}

          {activeComposerTab === 'auth' && (
            <div
              className="composer-tab-panel"
              id="composer-tab-panel-auth"
              role="tabpanel"
              aria-labelledby="composer-tab-auth"
            >
            <div className="section-header">
              <h3>Auth</h3>
            </div>
            <div className="composer-grid">
              <label className="stack-field">
                <span>Auth type</span>
                <select
                  className="input"
                  onChange={(event) => setAuthType(event.target.value as AuthType)}
                  value={request.auth.type}
                >
                  {AUTH_TYPES.map((authType) => (
                    <option key={authType} value={authType}>
                      {authType}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {renderAuthFields()}
          </div>
          )}

          {activeComposerTab === 'body' && (
            <div
              className="composer-tab-panel"
              id="composer-tab-panel-body"
              role="tabpanel"
              aria-labelledby="composer-tab-body"
            >
            <div className="section-header">
              <h3>Body</h3>
            </div>
            <div className="composer-grid">
              <label className="stack-field">
                <span>Body mode</span>
                <select
                  className="input"
                  onChange={(event) => handleBodyModeChange(event.target.value as RequestBodyMode)}
                  value={request.body.mode}
                >
                  {BODY_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {renderBodyEditor()}
          </div>
          )}
        </div>
      </div>

      {environment && (
        <div className="composer-section">
          <VariableInfo
            url={request.url}
            headers={request.headers}
            queryParams={request.queryParams}
            body={getBodyPreviewText(request.body)}
            environment={environment}
          />
        </div>
      )}

      <div className="composer-section">
        <div className="section-header">
          <h3>Response</h3>
        </div>
        {renderResponsePanel()}
      </div>

      <div className="composer-section">
        <div className="section-header">
          <h3>Diagnostics</h3>
          {(execution.logs.length > 0 || execution.latestDiagnostic) && (
            <button
              className="ghost-button"
              onClick={() => execution.clearDiagnostics()}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
        {execution.latestDiagnostic ? (
          <div className="response-shell">
            <div className="response-meta">
              <span className="subtle-chip">Trace: {execution.latestDiagnostic.traceId}</span>
              <span className="subtle-chip">Severity: {execution.latestDiagnostic.severity}</span>
              <span className="subtle-chip">Simulation: {execution.latestDiagnostic.simulationMode}</span>
              {execution.latestDiagnostic.responseStatus && (
                <span className="subtle-chip">Status: {execution.latestDiagnostic.responseStatus}</span>
              )}
              {execution.latestDiagnostic.durationMs !== undefined && (
                <span className="subtle-chip">Duration: {execution.latestDiagnostic.durationMs}ms</span>
              )}
              {execution.latestDiagnostic.responseBytes !== undefined && (
                <span className="subtle-chip">Size: {execution.latestDiagnostic.responseBytes} bytes</span>
              )}
              {execution.latestDiagnostic.errorCategory && (
                <span className="subtle-chip">Error: {execution.latestDiagnostic.errorCategory}</span>
              )}
            </div>
            {execution.latestDiagnostic.errorMessage && (
              <p className="response-error-state">{execution.latestDiagnostic.errorMessage}</p>
            )}
          </div>
        ) : (
          <p className="subtle">No diagnostics yet.</p>
        )}
        {execution.logs.length > 0 && (
          <div className="response-card">
            <h4>Execution Trace Log</h4>
            <ul className="response-list">
              {execution.logs.slice(0, 8).map((entry) => (
                <li key={entry.id}>
                  [{entry.stage}] {entry.message} ({new Date(entry.timestamp).toLocaleTimeString()})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="composer-section">
        <div className="section-header">
          <h3>Code Generator</h3>
        </div>
        <CodeGeneratorPanel request={request} />
      </div>

      <div className="composer-section">
        <AiAssistPanel request={request} />
      </div>

      <div className="composer-section">
        <div className="section-header">
          <h3>Response Comparison</h3>
          {comparison.results.length > 0 && (
            <button
              className="ghost-button"
              onClick={() => comparison.clear()}
              title="Clear comparison"
            >
              Clear
            </button>
          )}
        </div>
        <ResponseComparisonPanel
          results={comparison.results}
          isExecuting={comparison.isExecuting}
          error={comparison.error}
        />
      </div>
    </section>
  )
}
