import React, { createContext, useContext, useState, ReactNode } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

type ConfirmContextType = {
  showConfirm: (title: string, message?: string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    title?: string
    message?: string
    resolve?: (value: boolean) => void
  } | null>(null)

  function showConfirm(title: string, message?: string) {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, title, message, resolve })
    })
  }

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmDialog
        open={!!state?.open}
        title={state?.title}
        message={state?.message}
        onConfirm={() => {
          state?.resolve?.(true)
          setState(null)
        }}
        onCancel={() => {
          state?.resolve?.(false)
          setState(null)
        }}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx.showConfirm
}

export default useConfirm
