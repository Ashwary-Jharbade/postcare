import { useState } from 'react'
import { useEnvironments } from './useEnvironments'
import './EnvironmentsListView.css'
import { useConfirm } from '../../hooks/useConfirm'

interface EnvironmentsListViewProps {
  selectedEnvironmentId: string | null
  onSelectEnvironment: (id: string) => void
  onToggleEnvironmentEditor?: (id: string) => void
  filterQuery?: string
}

export function EnvironmentsListView({
  selectedEnvironmentId,
  onSelectEnvironment,
  onToggleEnvironmentEditor,
  filterQuery = '',
}: EnvironmentsListViewProps) {
  const envs = useEnvironments()
  const [isCreating, setIsCreating] = useState(false)
  const [newEnvName, setNewEnvName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newEnvColor, setNewEnvColor] = useState('#3b82f6')
  const showConfirm = useConfirm()

  async function handleCreate() {
    if (!newEnvName.trim()) return
    try {
      const env = await envs.createEnvironment(newEnvName.trim(), newEnvColor)
      setNewEnvName('')
      setNewEnvColor('#3b82f6')
      setIsCreating(false)
      await envs.setActiveEnvironment(env.id)
      onSelectEnvironment(env.id)
    } catch (err) {
      console.error('Failed to create environment:', err)
    }
  }

  async function handleUpdate(id: string, name: string) {
    if (!name.trim()) return
    try {
      await envs.updateEnvironment(id, { name: name.trim() })
      setEditingId(null)
      setEditingName('')
    } catch (err) {
      console.error('Failed to update environment:', err)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm('Delete environment', 'Delete this environment and all its variables?')
    if (!confirmed) return

    try {
      await envs.deleteEnvironment(id)
      if (selectedEnvironmentId === id) {
        const remaining = envs.environments.find((e) => e.id !== id)
        if (remaining) {
          onSelectEnvironment(remaining.id)
          await envs.setActiveEnvironment(remaining.id)
        }
      }
    } catch (err) {
      console.error('Failed to delete environment:', err)
    }
  }

  async function handleSetActive(id: string) {
    const env = envs.environments.find((e) => e.id === id)
    if (!env) return

    // Do nothing if already active
    if (envs.activeEnvironmentId === id) {
      onSelectEnvironment(id)
      return
    }

    const confirmed = await showConfirm('Switch active environment', `Switch active environment to "${env.name}"?`)
    if (!confirmed) return

    try {
      await envs.setActiveEnvironment(id)
      onSelectEnvironment(id)
    } catch (err) {
      console.error('Failed to set active environment:', err)
    }
  }

  const normalizedFilter = filterQuery.trim().toLowerCase()
  const visibleEnvironments = normalizedFilter
    ? envs.environments.filter((env) =>
        `${env.name} ${(env.variables ?? [])
          .map((variable) => variable.key)
          .join(' ')}`.toLowerCase().includes(normalizedFilter),
      )
    : envs.environments

  if (envs.isLoading) {
    return (
      <div className="environments-list">
        <h3>Environments</h3>
        <p className="subtle">Loading environments...</p>
      </div>
    )
  }

  return (
    <div className="environments-list">
      <div className="environments-header">
        <h3>Environments</h3>
        <button
          className="btn-icon"
          onClick={() => {
            setIsCreating(!isCreating)
            setNewEnvName('')
          }}
          title="Create new environment"
        >
          +
        </button>
      </div>

      {envs.error && <div className="error-message">{envs.error}</div>}

      {isCreating && (
        <div className="environment-create-form">
          <input
            type="text"
            placeholder="Environment name"
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') {
                setIsCreating(false)
                setNewEnvName('')
              }
            }}
            autoFocus
          />
          <label className="color-picker-label">
            <span>Color</span>
            <input
              type="color"
              value={newEnvColor}
              onChange={(e) => setNewEnvColor(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button onClick={handleCreate} className="btn-sm">
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewEnvName('')
              }}
              className="btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="environment-items">
        {visibleEnvironments.map((env) => {
          const isActive = envs.activeEnvironmentId === env.id
          const isSelected = selectedEnvironmentId === env.id

          return (
            <li
              key={env.id}
              className={`environment-item ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
              onClick={(event) => {
                const target = event.target as HTMLElement
                if (target.closest('button, input, textarea, select, a, [role="button"]')) {
                  return
                }
                handleSetActive(env.id)
              }}
            >
              {editingId === env.id ? (
                <div className="environment-edit-form">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(env.id, editingName)
                      if (e.key === 'Escape') {
                        setEditingId(null)
                        setEditingName('')
                      }
                    }}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button
                      onClick={() => handleUpdate(env.id, editingName)}
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
                    className="environment-name"
                    onClick={() => handleSetActive(env.id)}
                  >
                    <span
                      className="env-color-dot"
                      style={{ backgroundColor: env.color }}
                      title="Click to set active"
                    />
                    <span className="env-name-text">{env.name}</span>
                    {isActive && <span className="active-badge">active</span>}
                    <span className="variable-count">
                      ({env.variables?.length || 0} var{env.variables?.length !== 1 ? 's' : ''})
                    </span>
                  </button>
                  <div className="environment-actions">
                    <button
                      className="btn-icon-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Toggle variables editor for this environment
                        onSelectEnvironment(env.id)
                        if (typeof (onToggleEnvironmentEditor) === 'function') {
                          onToggleEnvironmentEditor(env.id)
                        }
                      }}
                      title="Toggle variables"
                    >
                      ⚙
                    </button>
                    <button
                      className="btn-icon-sm"
                      onClick={() => {
                        setEditingId(env.id)
                        setEditingName(env.name)
                      }}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon-sm"
                      onClick={() => handleDelete(env.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {!isCreating && visibleEnvironments.length === 0 && (
        <p className="empty-state">
          {normalizedFilter
            ? 'No environments match your filter.'
            : 'No environments yet. Create one to get started.'}
        </p>
      )}
      {/* ConfirmDialog rendered by ConfirmProvider at app root */}
    </div>
  )
}
