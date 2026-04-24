import { useState } from 'react'
import { RequestComposer } from './features/requests/RequestComposer'
import { CollectionsListView } from './features/collections/CollectionsListView'
import { RequestListView } from './features/collections/RequestListView'
import { EnvironmentsListView } from './features/environments/EnvironmentsListView'
import { EnvironmentVariablesEditor } from './features/environments/EnvironmentVariablesEditor'
import { useStorageSummary } from './features/storage/useStorageSummary'
import { useEnvironments } from './features/environments/useEnvironments'
import { HelpCenter } from './features/help/HelpCenter'
import './features/help/HelpCenter.css'

export function App() {
  const storage = useStorageSummary()
  const environments = useEnvironments()
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'collections' | 'requests' | 'environments'>('collections')
  const [sidebarFilter, setSidebarFilter] = useState('')
  const [showEnvironmentEditor, setShowEnvironmentEditor] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  function renderWorkflow() {
    // Show default intro until storage is ready
    if (storage.status === 'loading') {
      return (
        <main className="app-shell">
          <section className="hero">
            <p className="eyebrow">Local-first API client</p>
            <h1>Postcare</h1>
            <p className="lede">
              Secure request workflows, offline-capable tooling, and guarded AI assistance.
            </p>
          </section>
          <div className="panel">
            <p>Initializing IndexedDB schema and local seed data.</p>
          </div>
        </main>
      )
    }

    if (storage.status === 'unavailable' || storage.status === 'error') {
      return (
        <main className="app-shell">
          <section className="hero">
            <h1>Postcare</h1>
          </section>
          <div className="panel">
            <p>
              {storage.status === 'unavailable'
                ? 'IndexedDB is unavailable in this environment.'
                : `Storage bootstrap failed: ${storage.message}`}
            </p>
          </div>
        </main>
      )
    }

    // Auto-select first collection if none selected
    const allCollections = storage.summary.collections ?? 0
    const currentCollectionId = selectedCollectionId
    const hasValidSelection = currentCollectionId !== null
    const selectedEnvironment = environments.environments.find((e) => e.id === selectedEnvironmentId)

    // Initialize selected environment if not set
    if (!selectedEnvironmentId && environments.activeEnvironmentId) {
      setSelectedEnvironmentId(environments.activeEnvironmentId)
    }

    // Show workflow with docs-style single sidebar and focused main pane
    return (
      <main className="app-shell-docs">
        <aside className="workspace-sidebar">
          <div className="workspace-sidebar-tabs" role="tablist" aria-label="Workspace sections">
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'collections'}
              className={`workspace-tab ${sidebarTab === 'collections' ? 'workspace-tab-active' : ''}`}
              onClick={() => {
                setSidebarTab('collections')
                setSidebarFilter('')
              }}
            >
              Collections
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'requests'}
              className={`workspace-tab ${sidebarTab === 'requests' ? 'workspace-tab-active' : ''}`}
              onClick={() => {
                setSidebarTab('requests')
                setSidebarFilter('')
              }}
            >
              Requests
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'environments'}
              className={`workspace-tab ${sidebarTab === 'environments' ? 'workspace-tab-active' : ''}`}
              onClick={() => {
                setSidebarTab('environments')
                setSidebarFilter('')
              }}
            >
              Environments
            </button>
          </div>

          <div className="workspace-sidebar-search-summary">Filtered by: {sidebarFilter || 'none'}</div>

          <div className="workspace-sidebar-content">
            {sidebarTab === 'collections' && (
              <CollectionsListView
                selectedCollectionId={currentCollectionId}
                filterQuery={sidebarFilter}
                onSelectCollection={(id) => {
                  setSelectedCollectionId(id)
                  setSelectedRequestId(null)
                }}
              />
            )}
            {sidebarTab === 'requests' && (
              <RequestListView
                collectionId={currentCollectionId}
                selectedRequestId={selectedRequestId}
                filterQuery={sidebarFilter}
                onSelectRequest={setSelectedRequestId}
              />
            )}
            {sidebarTab === 'environments' && (
              <EnvironmentsListView
                selectedEnvironmentId={selectedEnvironmentId}
                filterQuery={sidebarFilter}
                onSelectEnvironment={setSelectedEnvironmentId}
              />
            )}
          </div>
        </aside>

        <section className="workspace-main">
          <div className="workspace-command-bar">
            <input
              className="input workspace-filter-input"
              placeholder={`Filter ${sidebarTab}`}
              value={sidebarFilter}
              onChange={(event) => setSidebarFilter(event.target.value)}
            />
            <button
              type="button"
              className="ghost-button"
              onClick={() => setSidebarFilter('')}
              disabled={!sidebarFilter}
            >
              Clear filter
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowEnvironmentEditor((value) => !value)}
            >
              {showEnvironmentEditor ? 'Hide environment variables' : 'Show environment variables'}
            </button>
          </div>

          <div className="workspace-main-header">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>Request Workflow</h2>
            </div>
            <div className="workspace-main-actions">
              <span className="subtle-chip">
                Active environment: {selectedEnvironment?.name ?? 'None selected'}
              </span>
            </div>
          </div>

          <div className="workspace-main-content">
            <div className="composer-container">
              {hasValidSelection && selectedRequestId ? (
                <RequestComposer requestId={selectedRequestId} environment={selectedEnvironment} />
              ) : (
                <section className="composer-shell">
                  <h2>Request composer</h2>
                  {!hasValidSelection && allCollections > 0 ? (
                    <p>Select a collection and request to start editing.</p>
                  ) : allCollections === 0 ? (
                    <p>Create a collection to begin.</p>
                  ) : (
                    <p>Select a request to edit.</p>
                  )}
                </section>
              )}
            </div>

            {showEnvironmentEditor && (
              <div className="workspace-env-editor">
                <EnvironmentVariablesEditor environmentId={selectedEnvironmentId} />
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  return (
    <>
      {renderWorkflow()}
      <button
        type="button"
        className="help-fab"
        onClick={() => setIsHelpOpen(true)}
        aria-label="Open help center"
      >
        Help
      </button>
      <HelpCenter open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  )
}
