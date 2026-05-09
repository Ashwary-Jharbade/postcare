import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { RequestComposer } from './RequestComposer'

const importCurlRequest = vi.fn()

const { mockSetName } = vi.hoisted(() => ({
  mockSetName: vi.fn(),
}))

vi.mock('./useRequestComposer', async () => {
  const { createDefaultRequest } = await import('../../domain/models')
  const request = { ...createDefaultRequest(), id: 'req_1', name: 'Untitled Request' }

  return {
    useRequestComposer: () => ({
      state: {
        status: 'ready',
        request,
        saveState: 'idle',
        saveMessage: 'Ready',
      },
      setHeaders: vi.fn(),
      setQueryParams: vi.fn(),
      setAuth: vi.fn(),
      setAuthConfig: vi.fn(),
      setName: mockSetName,
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
  }
})

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
    mockSetName.mockReset()
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

describe('RequestComposer request name', () => {
  beforeEach(() => {
    mockSetName.mockReset()
  })

  function getNameInput() {
    const region = screen.getByRole('region', { name: 'request composer' })
    return within(region).getByLabelText('Request name')
  }

  it('reverts an empty name on blur and does not call setName', async () => {
    const user = userEvent.setup()
    render(<RequestComposer requestId="req_1" />)

    const nameInput = getNameInput()
    await user.clear(nameInput)
    await user.tab()

    expect(nameInput).toHaveValue('Untitled Request')
    expect(mockSetName).not.toHaveBeenCalled()
    const region = screen.getByRole('region', { name: 'request composer' })
    expect(within(region).getByRole('alert')).toHaveTextContent('Name cannot be empty.')
  })

  it('trims and saves a non-empty name on blur', async () => {
    const user = userEvent.setup()
    render(<RequestComposer requestId="req_1" />)

    const nameInput = getNameInput()
    await user.clear(nameInput)
    await user.type(nameInput, '  My API  ')
    await user.tab()

    expect(mockSetName).toHaveBeenCalledWith('My API')
  })
})
