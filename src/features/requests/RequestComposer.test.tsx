import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createDefaultRequest } from '../../domain/models'
import { RequestComposer } from './RequestComposer'

const importCurlRequest = vi.fn()

vi.mock('./useRequestComposer', () => ({
  useRequestComposer: () => ({
    state: {
      status: 'ready',
      request: createDefaultRequest(),
      saveState: 'idle',
      saveMessage: 'Ready',
    },
    setHeaders: vi.fn(),
    setQueryParams: vi.fn(),
    setAuth: vi.fn(),
    setAuthConfig: vi.fn(),
    setName: vi.fn(),
    setMethod: vi.fn(),
    setUrl: vi.fn(),
    setBodyMode: vi.fn(),
    setBodyContentType: vi.fn(),
    setBodyContent: vi.fn(),
    setFormData: vi.fn(),
    setBody: vi.fn(),
    importCurlRequest,
    addHeaderRow: vi.fn(),
    addQueryParamRow: vi.fn(),
  }),
}))

vi.mock('./useRequestExecution', () => ({
  useRequestExecution: () => ({
    state: { status: 'idle' },
    run: vi.fn(),
    clearDiagnostics: vi.fn(),
    logs: [],
    latestDiagnostic: null,
  }),
}))

vi.mock('./useResponseComparison', () => ({
  useResponseComparison: () => ({
    results: [],
    isExecuting: false,
    error: null,
    clear: vi.fn(),
  }),
}))

vi.mock('./ResponseViewerTabs', () => ({
  ResponseViewerTabs: () => <div>response viewer</div>,
}))

vi.mock('./VariableInfo', () => ({
  VariableInfo: () => <div>variable info</div>,
}))

vi.mock('./CodeGeneratorPanel', () => ({
  CodeGeneratorPanel: () => <div>code generator</div>,
}))

vi.mock('./ResponseComparisonPanel', () => ({
  ResponseComparisonPanel: () => <div>response comparison</div>,
}))

vi.mock('./AiAssistPanel', () => ({
  AiAssistPanel: () => <div>ai assist</div>,
}))

describe('RequestComposer cURL import', () => {
  beforeEach(() => {
    importCurlRequest.mockReset()
  })

  it('opens the import dialog and applies parsed cURL fields to the composer', async () => {
    const user = userEvent.setup()

    render(<RequestComposer requestId="req_1" />)

    await user.click(screen.getAllByRole('button', { name: 'Import cURL' })[0]!)

    expect(screen.getByRole('dialog', { name: 'Import cURL' })).toBeInTheDocument()

    await user.click(screen.getByLabelText('cURL command'))
    await user.paste(
      'curl "https://api.example.com/users?active=true" -H "Content-Type: application/json" --data \'{"name":"Ada"}\'',
    )
    await user.click(screen.getByRole('button', { name: 'Apply to composer' }))

    expect(importCurlRequest).toHaveBeenCalledTimes(1)
    expect(importCurlRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.example.com/users?active=true',
        body: expect.objectContaining({
          mode: 'json',
          content: '{"name":"Ada"}',
        }),
        headers: expect.arrayContaining([
          expect.objectContaining({
            key: 'Content-Type',
            value: 'application/json',
          }),
        ]),
        queryParams: expect.arrayContaining([
          expect.objectContaining({
            key: 'active',
            value: 'true',
          }),
        ]),
      }),
    )
  })

  it('shows non-blocking warnings when the imported curl command contains unsupported flags', async () => {
    const user = userEvent.setup()

    render(<RequestComposer requestId="req_1" />)

    await user.click(screen.getAllByRole('button', { name: 'Import cURL' })[0]!)
    await user.click(screen.getByLabelText('cURL command'))
    await user.paste('curl https://api.example.com/items --compressed --data "a=1"')
    await user.click(screen.getByRole('button', { name: 'Apply to composer' }))

    expect(importCurlRequest).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Imported with warnings.')).toBeInTheDocument()
    expect(
      screen.getByText('Ignored unsupported cURL flag "--compressed".'),
    ).toBeInTheDocument()
  })
})
