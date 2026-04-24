import { useEffect, useCallback, useState } from 'react'
import { database } from '../../lib/storage/db'
import { type EnvironmentRecord, type EnvironmentVariable, createId, createTimestamp } from '../../domain/models'

// Custom event for cross-hook synchronization
const ENVIRONMENTS_CHANGED_EVENT = 'postcare:environments-changed'

function emitEnvironmentsChanged() {
  window.dispatchEvent(new CustomEvent(ENVIRONMENTS_CHANGED_EVENT))
}

export interface EnvironmentsState {
  environments: EnvironmentRecord[]
  activeEnvironmentId: string | null
  isLoading: boolean
  error: string | null
}

export function useEnvironments() {
  const [state, setState] = useState<EnvironmentsState>({
    environments: [],
    activeEnvironmentId: null,
    isLoading: true,
    error: null,
  })

  const loadEnvironments = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const environments = await database.environments.toArray()
      const activeEnvSetting = await database.settings.get('activeEnvironmentId')
      const activeEnvironmentId = activeEnvSetting?.value || (environments[0]?.id ?? null)

      setState({
        environments,
        activeEnvironmentId,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load environments'
      setState({ environments: [], activeEnvironmentId: null, isLoading: false, error: message })
    }
  }, [])

  // Load on mount and listen for cross-hook sync events
  useEffect(() => {
    loadEnvironments()

    function onEnvironmentsChanged() {
      loadEnvironments()
    }

    window.addEventListener(ENVIRONMENTS_CHANGED_EVENT, onEnvironmentsChanged)
    return () => {
      window.removeEventListener(ENVIRONMENTS_CHANGED_EVENT, onEnvironmentsChanged)
    }
  }, [loadEnvironments])

  async function createEnvironment(name: string, color = '#3b82f6') {
    try {
      const newEnv: EnvironmentRecord = {
        id: createId('env'),
        name,
        color,
        variables: [],
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
      }
      await database.environments.add(newEnv)
      await loadEnvironments()
      emitEnvironmentsChanged()
      return newEnv
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create environment'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function updateEnvironment(
    id: string,
    updates: Partial<Pick<EnvironmentRecord, 'name' | 'color'>>,
  ) {
    try {
      await database.environments.update(id, {
        ...updates,
        updatedAt: createTimestamp(),
      })
      await loadEnvironments()
      emitEnvironmentsChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update environment'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function deleteEnvironment(id: string) {
    try {
      await database.environments.delete(id)
      // If we deleted the active environment, clear it
      if (state.activeEnvironmentId === id) {
        await database.settings.put({
          key: 'activeEnvironmentId',
          value: '',
          updatedAt: createTimestamp(),
        })
      }
      await loadEnvironments()
      emitEnvironmentsChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete environment'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function setActiveEnvironment(id: string | null) {
    try {
      await database.settings.put({
        key: 'activeEnvironmentId',
        value: id || '',
        updatedAt: createTimestamp(),
      })
      setState((prev) => ({ ...prev, activeEnvironmentId: id }))
      emitEnvironmentsChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set active environment'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function addVariable(
    environmentId: string,
    key: string,
    value: string,
    isSecret = false,
  ) {
    try {
      const env = await database.environments.get(environmentId)
      if (!env) throw new Error(`Environment ${environmentId} not found`)

      const newVariable: EnvironmentVariable = {
        id: createId('var'),
        key,
        value,
        enabled: true,
        secret: isSecret,
        scope: isSecret ? 'secret' : 'shared',
      }

      const variables = [...(env.variables || []), newVariable]
      await database.environments.update(environmentId, {
        variables,
        updatedAt: createTimestamp(),
      })
      await loadEnvironments()
      emitEnvironmentsChanged()
      return newVariable
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add variable'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function updateVariable(
    environmentId: string,
    variableId: string,
    key: string,
    value: string,
    enabled: boolean,
    isSecret = false,
  ) {
    try {
      const env = await database.environments.get(environmentId)
      if (!env) throw new Error(`Environment ${environmentId} not found`)

      const variables = (env.variables || []).map((v) => {
        if (v.id === variableId) {
          const updatedScope: 'secret' | 'shared' = isSecret ? 'secret' : 'shared'
          return {
            ...v,
            key,
            value,
            enabled,
            secret: isSecret,
            scope: updatedScope,
          }
        }
        return v
      }) as EnvironmentVariable[]
      await database.environments.update(environmentId, {
        variables,
        updatedAt: createTimestamp(),
      })
      await loadEnvironments()
      emitEnvironmentsChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update variable'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function removeVariable(environmentId: string, variableId: string) {
    try {
      const env = await database.environments.get(environmentId)
      if (!env) throw new Error(`Environment ${environmentId} not found`)

      const variables = (env.variables || []).filter((v) => v.id !== variableId)
      await database.environments.update(environmentId, {
        variables,
        updatedAt: createTimestamp(),
      })
      await loadEnvironments()
      emitEnvironmentsChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove variable'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  return {
    ...state,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    addVariable,
    updateVariable,
    removeVariable,
    reload: loadEnvironments,
  }
}
