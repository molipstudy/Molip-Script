import { createContext, useContext } from 'react'

export const InstallAppContext = createContext({ installed: false, openGuide: () => {} })

export function useInstallApp() {
  return useContext(InstallAppContext)
}
