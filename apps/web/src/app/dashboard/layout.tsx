'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DashboardNav } from '@/components/dashboard-nav'
import { AvatarProvider, useAvatar } from '@/lib/avatar-context'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, logout } = useAuth()
  const { avatarVersion } = useAvatar()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userInitial, setUserInitial] = useState<string>('')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api.get('/api/auth/csrf-token').then((res) => {
      if (res.data?.csrfToken) {
        try {
          localStorage.setItem('csrfToken', res.data.csrfToken)
        } catch (_) {}
      }
    }).catch(() => {})
    api.get('/api/auth/me').then((res) => {
      const u = res.data.user
      setUserInitial(u?.name?.charAt(0)?.toUpperCase() || u?.email?.charAt(0)?.toUpperCase() || '')
      if (u?.avatarKey) {
        api.get('/api/auth/me/avatar').then((r) => setAvatarUrl(r.data.url)).catch(() => setAvatarUrl(null))
      } else {
        setAvatarUrl(null)
      }
    }).catch(() => {})
  }, [isAuthenticated, avatarVersion]) // Re-fetch when avatarVersion changes

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        avatarUrl={avatarUrl}
        userInitial={userInitial}
        onLogout={logout}
        onAvatarClick={() => router.push('/dashboard/settings')}
      />
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AvatarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AvatarProvider>
  )
}
