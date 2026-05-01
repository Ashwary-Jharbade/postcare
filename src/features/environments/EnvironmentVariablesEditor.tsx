import { useState } from 'react'
import { useEnvironments } from './useEnvironments'
import './EnvironmentVariablesEditor.css'
import { useConfirm } from '../../hooks/useConfirm'

interface EnvironmentVariablesEditorProps {
  environmentId: string | null
}

export function EnvironmentVariablesEditor({ environmentId }: EnvironmentVariablesEditorProps) {
  const envs = useEnvironments()
  const [isAddingVariable, setIsAddingVariable] = useState(false)
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarValue, setNewVarValue] = useState('')
  const [newVarIsSecret, setNewVarIsSecret] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const showConfirm = useConfirm()

  // Read environment from the hook's own state so it always reflects the latest data
  const environment = environmentId
    ? envs.environments.find((e) => e.id === environmentId) ?? null
    : null

  function showStatus(type: 'success' | 'error', text: string) {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  async function handleAddVariable() {
    if (!newVarKey.trim() || !environment) return
    try {
      await envs.addVariable(environment.id, newVarKey.trim(), newVarValue, newVarIsSecret)
      showStatus('success', `Variable "${newVarKey.trim()}" added`)
      setNewVarKey('')
      setNewVarValue('')
      setNewVarIsSecret(false)
      setIsAddingVariable(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showStatus('error', `Failed to add variable: ${msg}`)
    }
  }

  async function handleUpdateVariable(
    variableId: string,
    key: string,
    value: string,
    enabled: boolean,
    isSecret: boolean,
  ) {
    if (!environment) return
    try {
      await envs.updateVariable(environment.id, variableId, key, value, enabled, isSecret)
    } catch (err) {
      console.error('Failed to update variable:', err)
    }
  }

  async function handleRemoveVariable(variableId: string) {
    if (!environment) return
    const confirmed = await showConfirm('Delete variable', 'Delete this variable?')
    if (!confirmed) return
    try {
      await envs.removeVariable(environment.id, variableId)
      showStatus('success', 'Variable removed')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showStatus('error', `Failed to remove variable: ${msg}`)
    }
  }

  if (!environment) {
    return (
      <div className="environment-variables-editor">
        <div className="variables-header">
          <h4>Environment Variables</h4>
        </div>
        <p className="empty-state">Select an environment from the Environments tab to view and edit its variables.</p>
      </div>
    )
  }

  const variables = environment.variables || []

  return (
    <div className="environment-variables-editor">
      <div className="variables-header">
        <h4>
          <span className="env-editor-dot" style={{ backgroundColor: environment.color }} />
          {environment.name} Variables
        </h4>
        <button
          className="btn-icon"
          onClick={() => setIsAddingVariable(!isAddingVariable)}
          title="Add new variable"
        >
          +
        </button>
      </div>

      {statusMessage && (
        <div className={`env-status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <p className="env-usage-hint">
        Use <code>{'{{variableName}}'}</code> in URLs, headers, params, or body to substitute these values at runtime.
      </p>

      {isAddingVariable && (
        <div className="variable-create-form">
          <input
            type="text"
            placeholder="Variable name (e.g., API_KEY)"
            value={newVarKey}
            onChange={(e) => setNewVarKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddVariable()
              if (e.key === 'Escape') {
                setIsAddingVariable(false)
                setNewVarKey('')
                setNewVarValue('')
              }
            }}
            autoFocus
          />
          <input
            type={newVarIsSecret ? 'password' : 'text'}
            placeholder="Value"
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddVariable()
            }}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newVarIsSecret}
              onChange={(e) => setNewVarIsSecret(e.target.checked)}
            />
            <span>Secret</span>
          </label>
          <div className="form-actions">
            <button onClick={handleAddVariable} className="btn-sm">
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingVariable(false)
                setNewVarKey('')
                setNewVarValue('')
              }}
              className="btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {variables.length === 0 && !isAddingVariable ? (
        <p className="empty-state">No variables in this environment. Click + to add one.</p>
      ) : null}

      <div className="variables-list-section">
        {variables.length > 0 && (
          <div className="variables-list-header" aria-hidden="true">
            <span className="variables-list-header-key">Key</span>
            <span className="variables-list-header-value">Value</span>
          </div>
        )}

        <ul className="variables-list">
          {variables.map((variable) => (
            <li key={variable.id} className="variable-item">
              <div className="variable-row">
                <input
                  type="checkbox"
                  checked={variable.enabled}
                  onChange={(e) =>
                    handleUpdateVariable(
                      variable.id,
                      variable.key,
                      variable.value,
                      e.target.checked,
                      variable.secret ?? false,
                    )
                  }
                  title="Enable/disable variable"
                />
                <input
                  type="text"
                  className="variable-key"
                  value={variable.key}
                  onChange={(e) =>
                    handleUpdateVariable(
                      variable.id,
                      e.target.value,
                      variable.value,
                      variable.enabled,
                      variable.secret ?? false,
                    )
                  }
                  placeholder="Key"
                />
                <div className="variable-value-group">
                  {variable.secret && <span className="secret-badge">🔒</span>}
                  <input
                    type={variable.secret ? 'password' : 'text'}
                    className="variable-value"
                    value={variable.value}
                    onChange={(e) =>
                      handleUpdateVariable(
                        variable.id,
                        variable.key,
                        e.target.value,
                        variable.enabled,
                        variable.secret ?? false,
                      )
                    }
                    placeholder="Value"
                  />
                </div>
                <button
                  className="btn-icon-sm btn-danger"
                  onClick={() => handleRemoveVariable(variable.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* ConfirmDialog rendered by ConfirmProvider at app root */}
    </div>
  )
}
