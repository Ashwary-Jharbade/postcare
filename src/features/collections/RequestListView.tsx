import { useState } from 'react'
import { database } from '../../lib/storage/db'
import { type RequestRecord, createId, createTimestamp } from '../../domain/models'
import { useCollectionRequests, type CollectionRequestsState } from './useCollectionRequests'
import './RequestListView.css'
import { useConfirm } from '../../hooks/useConfirm'

interface RequestListViewProps {
  collectionId: string | null
  selectedRequestId: string | null
  onSelectRequest: (id: string) => void
  filterQuery?: string
  requestsState?: CollectionRequestsState & { reload: () => Promise<void> }
}

export function RequestListView({
  collectionId,
  selectedRequestId,
  onSelectRequest,
  filterQuery = '',
  requestsState: externalRequestsState,
}: RequestListViewProps) {
  const internalRequests = useCollectionRequests(collectionId)
  const requests = externalRequestsState ?? internalRequests
  const [isCreating, setIsCreating] = useState(false)
  const [newRequestName, setNewRequestName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const showConfirm = useConfirm()

  async function handleCreateRequest() {
    if (!newRequestName.trim() || !collectionId) return
    try {
      const timestamp = createTimestamp()
      const newRequest: RequestRecord = {
        id: createId('req'),
        collectionId,
        name: newRequestName.trim(),
        method: 'GET',
        url: '',
        headers: [],
        queryParams: [],
        pathParams: [],
        body: { mode: 'none', content: '', contentType: 'application/json', formData: [] },
        auth: { type: 'none', config: {} },
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await database.requests.add(newRequest)

      // Add request to collection
      const collection = await database.collections.get(collectionId)
      if (collection) {
        const requestIds = collection.requestIds || []
        requestIds.push(newRequest.id)
        await database.collections.update(collectionId, {
          requestIds,
          updatedAt: timestamp,
        })
      }

      setNewRequestName('')
      setIsCreating(false)
      await requests.reload()
      onSelectRequest(newRequest.id)
    } catch (err) {
      console.error('Failed to create request:', err)
    }
  }

  async function handleUpdateRequestName(id: string, name: string) {
    if (!name.trim()) return
    try {
      await database.requests.update(id, {
        name: name.trim(),
        updatedAt: createTimestamp(),
      })
      setEditingId(null)
      setEditingName('')
      await requests.reload()
    } catch (err) {
      console.error('Failed to update request:', err)
    }
  }

  async function handleDeleteRequest(id: string) {
    const confirmed = await showConfirm('Delete request', 'Delete this request?')
    if (!confirmed) return
    if (!collectionId) return
    try {
      await database.requests.delete(id)

      // Remove from collection
      const collection = await database.collections.get(collectionId)
      if (collection) {
        const requestIds = (collection.requestIds || []).filter((rid) => rid !== id)
        await database.collections.update(collectionId, {
          requestIds,
          updatedAt: createTimestamp(),
        })
      }

      await requests.reload()

      if (selectedRequestId === id) {
        const remaining = requests.requests.filter((r) => r.id !== id)
        onSelectRequest(remaining.length > 0 ? remaining[0].id : '')
      }
    } catch (err) {
      console.error('Failed to delete request:', err)
    }
  }

  const normalizedFilter = filterQuery.trim().toLowerCase()
  const visibleRequests = normalizedFilter
    ? requests.requests.filter((request) =>
        `${request.method} ${request.name}`.toLowerCase().includes(normalizedFilter),
      )
    : requests.requests

  if (!collectionId) {
    return (
      <div className="request-list">
        <p className="empty-state">Select a collection to view requests</p>
      </div>
    )
  }

  if (requests.isLoading) {
    return <div className="request-list">Loading requests...</div>
  }

  return (
    <div className="request-list">
      <div className="request-list-header">
        <h3>Requests</h3>
        <button
          className="btn-icon"
          onClick={() => {
            setIsCreating(!isCreating)
            setNewRequestName('')
          }}
          title="Create new request"
        >
          +
        </button>
      </div>

      {requests.error && <div className="error-message">{requests.error}</div>}

      {isCreating && (
        <div className="request-create-form">
          <input
            type="text"
            placeholder="Request name"
            value={newRequestName}
            onChange={(e) => setNewRequestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateRequest()
              if (e.key === 'Escape') {
                setIsCreating(false)
                setNewRequestName('')
              }
            }}
            autoFocus
          />
          <div className="form-actions">
            <button onClick={handleCreateRequest} className="btn-sm">
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewRequestName('')
              }}
              className="btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="request-items">
        {visibleRequests.map((request) => (
          <li
            key={request.id}
            className={`request-item ${selectedRequestId === request.id ? 'selected' : ''}`}
            onClick={(event) => {
              const target = event.target as HTMLElement
              if (target.closest('button, input, textarea, select, a, [role="button"]')) {
                return
              }
              onSelectRequest(request.id)
            }}
          >
            {editingId === request.id ? (
              <div className="request-edit-form">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateRequestName(request.id, editingName)
                    if (e.key === 'Escape') {
                      setEditingId(null)
                      setEditingName('')
                    }
                  }}
                  autoFocus
                />
                <div className="form-actions">
                  <button
                    onClick={() => handleUpdateRequestName(request.id, editingName)}
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
                  className="request-name"
                  onClick={() => onSelectRequest(request.id)}
                >
                  <span className="method-badge">{request.method}</span>
                  <span className="request-title">{request.name}</span>
                </button>
                <div className="request-actions">
                  <button
                    className="btn-icon-sm"
                    onClick={() => {
                      setEditingId(request.id)
                      setEditingName(request.name)
                    }}
                    title="Edit name"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleDeleteRequest(request.id)}
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

      {!isCreating && visibleRequests.length === 0 && (
        <p className="empty-state">
          {normalizedFilter
            ? 'No requests match your filter.'
            : 'No requests in this collection. Create one to get started.'}
        </p>
      )}
      {/* ConfirmDialog rendered by ConfirmProvider at app root */}
    </div>
  )
}
