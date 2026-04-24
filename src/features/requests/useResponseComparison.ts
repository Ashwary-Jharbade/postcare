import { useState, useCallback } from 'react'
import { type RequestRecord, type EnvironmentRecord } from '../../domain/models'
import { type ComparisonResult } from '../../lib/comparison/models'
import { executeRequest } from '../../features/requests/requestExecution'

export interface ComparisonState {
  results: ComparisonResult[]
  isExecuting: boolean
  error: string | null
}

export function useResponseComparison() {
  const [comparison, setComparison] = useState<ComparisonState>({
    results: [],
    isExecuting: false,
    error: null,
  })

  /**
   * Execute request across multiple environments and store results
   */
  const executeComparison = useCallback(
    async (
      request: RequestRecord,
      environments: EnvironmentRecord[],
    ) => {
      if (environments.length === 0) {
        setComparison({
          results: [],
          isExecuting: false,
          error: 'No environments selected',
        })
        return
      }

      setComparison({
        results: environments.map((env) => ({
          environmentId: env.id,
          environmentName: env.name,
          environmentColor: env.color,
          response: null,
          error: null,
          status: 'pending',
        })),
        isExecuting: true,
        error: null,
      })

      try {
        const resultsPromises = environments.map(async (env) => {
          try {
            const response = await executeRequest(request, env)
            return {
              environmentId: env.id,
              environmentName: env.name,
              environmentColor: env.color,
              response,
              error: null,
              status: 'success' as const,
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Request failed'
            return {
              environmentId: env.id,
              environmentName: env.name,
              environmentColor: env.color,
              response: null,
              error: errorMsg,
              status: 'error' as const,
            }
          }
        })

        const results = await Promise.all(resultsPromises)

        setComparison({
          results,
          isExecuting: false,
          error: null,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Comparison failed'
        setComparison({
          results: [],
          isExecuting: false,
          error: errorMsg,
        })
      }
    },
    [],
  )

  /**
   * Clear comparison results
   */
  const clear = useCallback(() => {
    setComparison({
      results: [],
      isExecuting: false,
      error: null,
    })
  }, [])

  return {
    ...comparison,
    executeComparison,
    clear,
  }
}
