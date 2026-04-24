import { useEffect, useState } from 'react'
import {
  type AuthType,
  type HttpMethod,
  type KeyValueEntry,
  type RequestBodyMode,
  type RequestBodyState,
  type RequestRecord,
  createTimestamp,
} from '../../domain/models'
import { database, isIndexedDbAvailable } from '../../lib/storage/db'
import { normalizeRequestBodyState } from '../../lib/body/requestBodyState'

type ComposerState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      request: RequestRecord
      saveState: 'idle' | 'saving' | 'saved' | 'error'
      saveMessage?: string
    }

export function useRequestComposer(requestId: string | null) {
  const [state, setState] = useState<ComposerState>({ status: 'loading' })

  useEffect(() => {
    if (!requestId) {
      setState({ status: 'error', message: 'No request selected' })
      return
    }

    let active = true

    async function load() {
      if (!isIndexedDbAvailable()) {
        if (active) {
          setState({ status: 'unavailable' })
        }
        return
      }

      try {
        const request = await database.requests.get(requestId!)

        if (!active) {
          return
        }

        if (!request) {
          setState({ status: 'error', message: `Request ${requestId} not found` })
          return
        }

        const normalizedBody = normalizeRequestBodyState(request.body)
        const normalizedRequest: RequestRecord = {
          ...request,
          body: normalizedBody,
        }

        setState({ status: 'ready', request: normalizedRequest, saveState: 'idle' })

        if (JSON.stringify(normalizedBody) !== JSON.stringify(request.body)) {
          await database.requests.put({
            ...request,
            body: normalizedBody,
            updatedAt: createTimestamp(),
          })
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown request load failure',
          })
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [requestId])

  async function save(changes: Partial<RequestRecord>) {
    const currentRequestId = state.status === 'ready' ? state.request.id : undefined

    if (!currentRequestId) {
      setState((current) =>
        current.status === 'ready'
          ? { ...current, saveState: 'error', saveMessage: 'Request composer is not ready.' }
          : current,
      )
      return
    }

    setState((current) =>
      current.status === 'ready'
        ? { ...current, saveState: 'saving', saveMessage: undefined }
        : current,
    )

    try {
      setState((current) => {
        if (current.status !== 'ready') {
          return current
        }

        return {
          ...current,
          request: {
            ...current.request,
            ...changes,
          },
        }
      })

      const existing = await database.requests.get(currentRequestId)
      if (!existing) {
        throw new Error(`Request ${currentRequestId} was not found`)
      }

      const updated: RequestRecord = {
        ...existing,
        ...changes,
        updatedAt: createTimestamp(),
      }

      await database.requests.put(updated)
      setState({ status: 'ready', request: updated, saveState: 'saved', saveMessage: 'Saved' })
    } catch (error) {
      setState((current) =>
        current.status === 'ready'
          ? {
              ...current,
              saveState: 'error',
              saveMessage:
                error instanceof Error ? error.message : 'Unknown request save failure',
            }
          : current,
      )
    }
  }

  return {
    state,
    setMethod(method: HttpMethod) {
      void save({ method })
    },
    setName(name: string) {
      void save({ name })
    },
    setUrl(url: string) {
      void save({ url })
    },
    setBodyMode(mode: RequestBodyMode) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          mode,
        },
      })
    },
    setBodyContentType(contentType: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          contentType,
        },
      })
    },
    setBodyContent(content: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          content,
        },
      })
    },
    setFormData(formData: KeyValueEntry[]) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          formData,
        },
      })
    },
    setBody(body: RequestBodyState) {
      if (state.status !== 'ready') {
        return
      }

      void save({ body })
    },
    setHeaders(headers: KeyValueEntry[]) {
      void save({ headers })
    },
    setQueryParams(queryParams: KeyValueEntry[]) {
      void save({ queryParams })
    },
    setAuth(type: AuthType) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        auth: {
          type,
          referenceId: state.request.auth.referenceId,
          config: {},
        },
      })
    },
    setAuthConfig(key: string, value: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        auth: {
          ...state.request.auth,
          config: {
            ...state.request.auth.config,
            [key]: value,
          },
        },
      })
    },
    addHeaderRow() {
      if (state.status !== 'ready') {
        return
      }

      const emptyRow: KeyValueEntry = {
        id: `kv_${crypto.randomUUID()}`,
        key: '',
        value: '',
        enabled: true,
      }

      void save({ headers: [...state.request.headers, emptyRow] })
    },
    addQueryParamRow() {
      if (state.status !== 'ready') {
        return
      }

      const emptyRow: KeyValueEntry = {
        id: `kv_${crypto.randomUUID()}`,
        key: '',
        value: '',
        enabled: true,
      }

      void save({ queryParams: [...state.request.queryParams, emptyRow] })
    },
    updateHeader(id: string, key: string, value: string, enabled: boolean) {
      if (state.status !== 'ready') {
        return
      }

      const headers = state.request.headers.map((h) =>
        h.id === id ? { ...h, key, value, enabled } : h,
      )
      void save({ headers })
    },
    removeHeader(id: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({ headers: state.request.headers.filter((h) => h.id !== id) })
    },
    updateQueryParam(id: string, key: string, value: string, enabled: boolean) {
      if (state.status !== 'ready') {
        return
      }

      const queryParams = state.request.queryParams.map((p) =>
        p.id === id ? { ...p, key, value, enabled } : p,
      )
      void save({ queryParams })
    },
    removeQueryParam(id: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({ queryParams: state.request.queryParams.filter((p) => p.id !== id) })
    },
  }
}
