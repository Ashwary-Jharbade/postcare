import { type RequestRecord, type ResponseRecord, type EnvironmentRecord } from '../../domain/models'
import { type ExecuteRequestOptions } from './requestExecution'

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export interface ExecutionLogEntry {
  id: string
  traceId: string
  timestamp: string
  stage: 'start' | 'prepared' | 'response' | 'history' | 'error'
  message: string
}

export interface ExecutionDiagnostic {
  traceId: string
  timestamp: string
  method: string
  requestUrl: string
  environmentName: string
  simulationMode: string
  responseStatus?: number
  durationMs?: number
  responseBytes?: number
  bodyFormat?: 'json' | 'text'
  jsonParseOk?: boolean
  errorCategory?: 'network' | 'timeout' | 'request' | 'unknown'
  errorMessage?: string
  severity: DiagnosticSeverity
}

function estimateBytes(content: string): number {
  return new TextEncoder().encode(content).length
}

export function createTraceId(): string {
  return `trace_${crypto.randomUUID()}`
}

export function categorizeExecutionError(errorMessage: string): 'network' | 'timeout' | 'request' | 'unknown' {
  const normalized = errorMessage.toLowerCase()

  if (normalized.includes('timeout')) {
    return 'timeout'
  }

  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'network'
  }

  if (normalized.trim().length > 0) {
    return 'request'
  }

  return 'unknown'
}

export function buildSuccessDiagnostic(
  traceId: string,
  request: RequestRecord,
  response: ResponseRecord,
  environment?: EnvironmentRecord,
  options?: ExecuteRequestOptions,
): ExecutionDiagnostic {
  const simulationMode = options?.simulation?.mode ?? 'off'
  const jsonParseOk =
    response.bodyFormat === 'json'
      ? (() => {
          try {
            JSON.parse(response.body)
            return true
          } catch {
            return false
          }
        })()
      : undefined

  return {
    traceId,
    timestamp: new Date().toISOString(),
    method: request.method,
    requestUrl: request.url,
    environmentName: environment?.name ?? 'Unscoped',
    simulationMode,
    responseStatus: response.status,
    durationMs: response.durationMs,
    responseBytes: estimateBytes(response.body),
    bodyFormat: response.bodyFormat,
    jsonParseOk,
    severity: response.status >= 500 ? 'error' : response.status >= 400 ? 'warning' : 'info',
  }
}

export function buildErrorDiagnostic(
  traceId: string,
  request: RequestRecord,
  errorMessage: string,
  environment?: EnvironmentRecord,
  options?: ExecuteRequestOptions,
): ExecutionDiagnostic {
  return {
    traceId,
    timestamp: new Date().toISOString(),
    method: request.method,
    requestUrl: request.url,
    environmentName: environment?.name ?? 'Unscoped',
    simulationMode: options?.simulation?.mode ?? 'off',
    errorCategory: categorizeExecutionError(errorMessage),
    errorMessage,
    severity: 'error',
  }
}
