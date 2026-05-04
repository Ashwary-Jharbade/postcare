import { useRef, useState } from 'react'
import { useCollections } from './useCollections'
import { useImportExport } from './useImportExport'
import './CollectionsListView.css'
import { useConfirm } from '../../hooks/useConfirm'

interface CollectionsListViewProps {
  selectedCollectionId: string | null
  onSelectCollection: (id: string) => void
  onImportSuccess?: () => void
  filterQuery?: string
  collectionsState?: ReturnType<typeof useCollections>
}

export function CollectionsListView({
  selectedCollectionId,
  onSelectCollection,
  onImportSuccess,
  filterQuery = '',
  collectionsState: externalCollectionsState,
}: CollectionsListViewProps) {
  const internalCollections = useCollections()
  const collections = externalCollectionsState ?? internalCollections
  const importExport = useImportExport()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const showConfirm = useConfirm()

  async function handleCreate() {
    if (!newCollectionName.trim()) return
    try {
      const newCollection = await collections.createCollection(newCollectionName.trim())
      setNewCollectionName('')
      setIsCreating(false)
      onSelectCollection(newCollection.id)
    } catch (err) {
      console.error('Failed to create collection:', err)
    }
  }

  async function handleUpdate(id: string, name: string) {
    if (!name.trim()) return
    try {
      await collections.updateCollection(id, { name: name.trim() })
      setEditingId(null)
      setEditingName('')
    } catch (err) {
      console.error('Failed to update collection:', err)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm('Delete collection', 'Delete this collection and all its requests?')
    if (!confirmed) return
    try {
      await collections.deleteCollection(id)
      if (selectedCollectionId === id) {
        // After deleteCollection, the hook has reloaded, but we use
        // a filtered view of what we know to find the next valid item
        const remaining = collections.collections.filter((c) => c.id !== id)
        onSelectCollection(remaining[0]?.id ?? '')
      }
    } catch (err) {
      console.error('Failed to delete collection:', err)
    }
  }

  async function handleExportAll() {
    const result = await importExport.exportCollections()
    if (result.success) {
      setImportMessage({ type: 'success', text: 'All collections exported successfully' })
      setTimeout(() => setImportMessage(null), 3000)
    } else {
      setImportMessage({ type: 'error', text: `Export failed: ${result.message}` })
    }
  }

  async function handleExportCollection(id: string) {
    const result = await importExport.exportCollection(id)
    if (result.success) {
      setImportMessage({ type: 'success', text: 'Collection exported successfully' })
      setTimeout(() => setImportMessage(null), 3000)
    } else {
      setImportMessage({ type: 'error', text: `Export failed: ${result.message}` })
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await importExport.handleFileImport(file)
      if (result.success) {
        setImportMessage({
          type: 'success',
          text: `Imported ${result.collectionsImported} collection(s) and ${result.requestsImported} request(s)`,
        })
        onImportSuccess?.()
        setTimeout(() => setImportMessage(null), 3000)
      } else {
        setImportMessage({ type: 'error', text: `Import failed: ${result.message}` })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setImportMessage({ type: 'error', text: `Import error: ${errorMsg}` })
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const normalizedFilter = filterQuery.trim().toLowerCase()
  const visibleCollections = normalizedFilter
    ? collections.collections.filter((collection) =>
      collection.name.toLowerCase().includes(normalizedFilter),
    )
    : collections.collections

  if (collections.isLoading) {
    return <div className="collections-list">Loading collections...</div>
  }

  return (
    <div className="collections-list">
      <div className="collections-header">
        <h3>Collections</h3>
        <div className="collections-header-actions">
          <button
            className="btn-icon"
            onClick={() => {
              setIsCreating(!isCreating)
              setNewCollectionName('')
            }}
            title="Create new collection"
          >
            +
          </button>
          <button
            className="btn-icon"
            onClick={handleExportAll}
            title="Export all collections"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button
            className="btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Import collections"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {importMessage && (
        <div className={`import-message ${importMessage.type}`}>
          {importMessage.text}
        </div>
      )}

      {collections.error && <div className="error-message">{collections.error}</div>}

      {isCreating && (
        <div className="collection-create-form">
          <input
            type="text"
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') {
                setIsCreating(false)
                setNewCollectionName('')
              }
            }}
            autoFocus
          />
          <div className="form-actions">
            <button onClick={handleCreate} className="btn-sm">
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewCollectionName('')
              }}
              className="btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="collection-items">
        {visibleCollections.map((collection) => (
          <li
            key={collection.id}
            className={`collection-item ${selectedCollectionId === collection.id ? 'selected' : ''}`}
            onClick={(event) => {
              const target = event.target as HTMLElement
              if (target.closest('button, input, textarea, select, a, [role="button"]')) {
                return
              }
              onSelectCollection(collection.id)
            }}
          >
            {editingId === collection.id ? (
              <div className="collection-edit-form">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(collection.id, editingName)
                    if (e.key === 'Escape') {
                      setEditingId(null)
                      setEditingName('')
                    }
                  }}
                  autoFocus
                />
                <div className="form-actions">
                  <button
                    onClick={() => handleUpdate(collection.id, editingName)}
                    className="btn-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditingName('')
                    }}
                    className="btn-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="collection-name"
                  onClick={() => onSelectCollection(collection.id)}
                >
                  {collection.name}
                  <span className="request-count">({collection.requestIds?.length || 0})</span>
                </button>
                <div className="collection-actions">
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleExportCollection(collection.id)}
                    title="Export collection"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                  <button
                    className="btn-icon-sm"
                    onClick={() => {
                      setEditingId(collection.id)
                      setEditingName(collection.name)
                    }}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon-sm btn-danger"
                    onClick={() => handleDelete(collection.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {!isCreating && visibleCollections.length === 0 && (
        <p className="empty-state">
          {normalizedFilter
            ? 'No collections match your filter.'
            : 'No collections yet. Create one to get started.'}
        </p>
      )}
      {/* ConfirmDialog rendered by ConfirmProvider at app root */}
    </div>
  )
}
