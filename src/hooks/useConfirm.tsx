import { createContext, useContext } from 'react'

type ConfirmContextType = {
  showConfirm: (title: string, message?: string) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx.showConfirm
}

export default useConfirm
