import { useState } from 'react'
import { type RequestRecord, type ResponseRecord, type EnvironmentRecord } from '../../domain/models'
import { addHistoryEntry } from '../../lib/storage/db'
import { executeRequest, type ExecuteRequestOptions } from './requestExecution'
import {
  buildErrorDiagnostic,
  buildSuccessDiagnostic,
  createTraceId,
  type ExecutionDiagnostic,
  type ExecutionLogEntry,
} from './diagnostics'

type ExecutionState =
  | { status: 'idle'; response: null; message?: string }
  | { status: 'running'; response: null; message?: string }
  | { status: 'success'; response: ResponseRecord; message?: string }
  | { status: 'error'; response: null; message: string }

export function useRequestExecution() {
  const [state, setState] = useState<ExecutionState>({ status: 'idle', response: null })
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [latestDiagnostic, setLatestDiagnostic] = useState<ExecutionDiagnostic | null>(null)

  function appendLog(entry: Omit<ExecutionLogEntry, 'id' | 'timestamp'>) {
    setLogs((current) => [
      {
        ...entry,
        id: `log_${crypto.randomUUID()}`,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 100))
  }

  async function run(
    request: RequestRecord,
    environment?: EnvironmentRecord,
    options?: ExecuteRequestOptions,
  ) {
    setState({ status: 'running', response: null, message: 'Sending request' })
    const traceId = createTraceId()
    appendLog({
      traceId,
      stage: 'start',
      message: `Trace started for ${request.method} ${request.url}`,
    })
    appendLog({
      traceId,
      stage: 'prepared',
      message: `Prepared request with simulation mode: ${options?.simulation?.mode ?? 'off'}`,
    })

    try {
      const response = await executeRequest(request, environment, options)
      appendLog({
        traceId,
        stage: 'response',
        message: `Received ${response.status} in ${response.durationMs}ms`,
      })

      await addHistoryEntry({
        requestId: request.id,
        environmentId: environment?.id || request.environmentId,
        status: response.ok ? 'success' : 'error',
        responseCode: response.status,
        durationMs: response.durationMs,
        requestSnapshot: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          queryParams: request.queryParams,
          body: request.body,
        },
      })
      appendLog({
        traceId,
        stage: 'history',
        message: 'Persisted request result to local history',
      })

      setLatestDiagnostic(buildSuccessDiagnostic(traceId, request, response, environment, options))

      setState({
        status: 'success',
        response,
        message: `${response.status} ${response.statusText || 'Response received'}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request execution failure'
      appendLog({
        traceId,
        stage: 'error',
        message,
      })

      await addHistoryEntry({
        requestId: request.id,
        environmentId: environment?.id || request.environmentId,
        status: 'error',
        durationMs: 0,
        requestSnapshot: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          queryParams: request.queryParams,
          body: request.body,
        },
      })
      setLatestDiagnostic(buildErrorDiagnostic(traceId, request, message, environment, options))

      setState({ status: 'error', response: null, message })
    }
  }

  function clearDiagnostics() {
    setLogs([])
    setLatestDiagnostic(null)
  }

  return { state, run, logs, latestDiagnostic, clearDiagnostics }
}
