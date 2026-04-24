import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResponseComparisonPanel } from './ResponseComparisonPanel'

describe('ResponseComparisonPanel accessibility', () => {
  it('renders mode controls with accessible names', () => {
    render(
      <ResponseComparisonPanel
        isExecuting={false}
        error={null}
        results={[
          {
            environmentId: 'env-1',
            environmentName: 'Local',
            environmentColor: '#22c55e',
            error: null,
            status: 'success',
            response: {
              status: 200,
              ok: true,
              statusText: 'OK',
              durationMs: 20,
              url: 'https://example.com',
              headers: [{ key: 'content-type', value: 'application/json' }],
              body: '{"ok":true}',
              bodyFormat: 'json',
            },
          },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Side by Side' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unified' })).toBeInTheDocument()
    expect(screen.getByText('Payload Diff')).toBeInTheDocument()
  })
})
