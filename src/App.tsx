import { useEffect, useMemo, useState } from 'react'
import { RequestComposer } from './features/requests/RequestComposer'
import { CollectionsListView } from './features/collections/CollectionsListView'
import { RequestListView } from './features/collections/RequestListView'
import { EnvironmentsListView } from './features/environments/EnvironmentsListView'
import { EnvironmentVariablesEditor } from './features/environments/EnvironmentVariablesEditor'
import { useStorageSummary } from './features/storage/useStorageSummary'
import { useEnvironments } from './features/environments/useEnvironments'
import { useCollections } from './features/collections/useCollections'
import { useCollectionRequests } from './features/collections/useCollectionRequests'
import { HelpCenter } from './features/help/HelpCenter'
import './features/help/HelpCenter.css'

export function App() {
  const storage = useStorageSummary()
  const environments = useEnvironments()
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null)
  const collectionsState = useCollections()
  const requestsState = useCollectionRequests(selectedCollectionId)
  const [sidebarTab, setSidebarTab] = useState<'collections' | 'requests' | 'environments'>('collections')
  const [sidebarFilter, setSidebarFilter] = useState('')
  const [showEnvironmentEditor, setShowEnvironmentEditor] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const collections = useMemo(() => collectionsState.collections || [], [collectionsState.collections])
  const requestsForCollection = useMemo(() => requestsState.requests || [], [requestsState.requests])

  // Auto-select environment
  useEffect(() => {
    if (!selectedEnvironmentId && environments.activeEnvironmentId) {
      setSelectedEnvironmentId(environments.activeEnvironmentId)
    }
  }, [selectedEnvironmentId, environments.activeEnvironmentId])

  // Auto-select collection
  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0]?.id ?? null)
    }
    // If selected collection no longer exists, fallback to first
    if (selectedCollectionId && collections.length > 0 && !collections.find((c) => c.id === selectedCollectionId)) {
      setSelectedCollectionId(collections[0]?.id ?? null)
    }
  }, [selectedCollectionId, collections])

  // Auto-select request when collection has requests but none is selected
  useEffect(() => {
    if (!selectedCollectionId || requestsState.isLoading) return

    // If no request is selected and there are requests available, select the first
    if (!selectedRequestId && requestsForCollection.length > 0) {
      setSelectedRequestId(requestsForCollection[0]?.id ?? null)
    }

    // If selected request no longer exists in the collection, clear it
    if (selectedRequestId && requestsForCollection.length > 0 && !requestsForCollection.find((r) => r.id === selectedRequestId)) {
      setSelectedRequestId(null)
    }

    // If the collection is empty, clear the selection
    if (selectedRequestId && requestsForCollection.length === 0) {
      setSelectedRequestId(null)
    }
  }, [selectedCollectionId, selectedRequestId, requestsForCollection, requestsState.isLoading])

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

    const currentCollectionId = selectedCollectionId
    const hasValidSelection = currentCollectionId !== null
    const selectedEnvironment = environments.environments.find((e) => e.id === selectedEnvironmentId)

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
                collectionsState={collectionsState}
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
                requestsState={requestsState}
              />
            )}
            {sidebarTab === 'environments' && (
              <EnvironmentsListView
                selectedEnvironmentId={selectedEnvironmentId}
                filterQuery={sidebarFilter}
                onSelectEnvironment={(id) => {
                  setSelectedEnvironmentId(id)
                }}
                onToggleEnvironmentEditor={(id) => {
                  if (showEnvironmentEditor && selectedEnvironmentId === id) {
                    setShowEnvironmentEditor(false)
                  } else {
                    setSelectedEnvironmentId(id)
                    setShowEnvironmentEditor(true)
                  }
                }}
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
            
          </div>

          <div className="workspace-main-header">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>Request Workflow</h2>
            </div>
            <div className="workspace-main-actions">
              <div className="active-env">
                {selectedEnvironment ? (
                  <button
                    type="button"
                    className="active-env-chip"
                    title={`Active environment: ${selectedEnvironment.name}`}
                    onClick={() => {
                      // Toggle editor for this environment
                      if (showEnvironmentEditor && selectedEnvironmentId === selectedEnvironment.id) {
                        setShowEnvironmentEditor(false)
                      } else {
                        setSelectedEnvironmentId(selectedEnvironment.id)
                        setShowEnvironmentEditor(true)
                      }
                    }}
                  >
                    <span
                      className="env-dot"
                      style={{ backgroundColor: selectedEnvironment.color }}
                      aria-hidden="true"
                    />
                    <span className="env-name">{selectedEnvironment.name}</span>
                    <svg className="env-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : (
                  <span className="subtle-chip">Active environment: None</span>
                )}
              </div>
            </div>
          </div>

          <div className="workspace-main-content">
            <div className="composer-container">
              {hasValidSelection && selectedRequestId ? (
                <RequestComposer requestId={selectedRequestId} environment={selectedEnvironment} />
              ) : (
                <section className="composer-shell">
                  <h2>Request composer</h2>
                  {!hasValidSelection && collections.length > 0 ? (
                    <p>Select a collection and request to start editing.</p>
                  ) : collections.length === 0 ? (
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
