'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from './api'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        await api.get('/api/auth/me')
        setIsAuthenticated(true)
      }
    } catch {
      setIsAuthenticated(false)
      localStorage.removeItem('accessToken')
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('accessToken', response.data.accessToken)
    
    // Fetch new CSRF token after login (tied to the new access token)
    try {
      const csrfResponse = await api.get('/api/auth/csrf-token')
      if (csrfResponse.data?.csrfToken) {
        localStorage.setItem('csrfToken', csrfResponse.data.csrfToken)
      }
    } catch (e) {
      console.error('Failed to fetch CSRF token:', e)
    }
    
    setIsAuthenticated(true)
    router.push('/dashboard')
  }

  async function register(email: string, password: string, name?: string) {
    await api.post('/api/auth/register', { email, password, name })
    await login(email, password)
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore errors
    }
    localStorage.removeItem('accessToken')
    setIsAuthenticated(false)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
