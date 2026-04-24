import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the product heading and error state when IndexedDB is unavailable', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Postcare' })).toBeInTheDocument()
    // When IndexedDB is unavailable in test environment, show error message
    expect(
      screen.getByText(/IndexedDB is unavailable|Storage bootstrap failed/i),
    ).toBeInTheDocument()
  })

  it('opens help center from the global help button', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: /open help center/i })[0]!)

    expect(screen.getByRole('dialog', { name: /postcare help center/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Request Composer' })).toBeInTheDocument()
  })
})
