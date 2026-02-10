'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AvatarContextType {
  refreshAvatar: () => void
  avatarVersion: number
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarVersion, setAvatarVersion] = useState(0)

  const refreshAvatar = useCallback(() => {
    setAvatarVersion(v => v + 1)
  }, [])

  return (
    <AvatarContext.Provider value={{ refreshAvatar, avatarVersion }}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider')
  }
  return context
}
