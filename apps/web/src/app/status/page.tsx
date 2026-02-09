'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, ArrowLeft, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  description: string
  lastCheck?: string | null
}

interface SystemStatus {
  services: ServiceStatus[]
  overall: 'operational' | 'degraded' | 'down'
  timestamp: string
}

function getStatusErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { status?: number; data?: { error?: string } } }
    const status = ax.response?.status
    const serverMessage = ax.response?.data?.error
    if (status === 404) {
      return 'Status endpoint was not found. Ensure the API server is running and has been restarted after the latest changes (e.g. run "npm run dev" in apps/api).'
    }
    if (status === 500) {
      return serverMessage || 'The server encountered an error. Please try again later.'
    }
    if (status === 503) {
      return 'Service temporarily unavailable. Please try again in a moment.'
    }
    if (status && status >= 400) {
      return serverMessage || `Request failed (${status}). Please try again later.`
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: string }).message
    if (typeof msg === 'string' && (msg.includes('Network') || msg.includes('fetch'))) {
      return `Cannot reach the API at ${API_URL}. Check that the API server is running.`
    }
  }
  return 'Unable to load status. Please check that the API is running and try again.'
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/public/status`, { credentials: 'include' })
        if (!response.ok) {
          const text = await response.text()
          let msg: string
          try {
            const data = JSON.parse(text)
            msg = data?.error || `Request failed (${response.status}).`
          } catch {
            if (response.status === 404) {
              msg = 'Status endpoint was not found. Ensure the API server is running and has been restarted after the latest changes (e.g. run "npm run dev" in apps/api).'
            } else if (response.status >= 500) {
              msg = 'The server encountered an error. Please try again later.'
            } else {
              msg = `Request failed (${response.status}). Please try again later.`
            }
          }
          throw new Error(msg)
        }
        const data = await response.json()
        setStatus(data)
        setErrorMessage(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : getStatusErrorMessage(err)
        setErrorMessage(message)
        setStatus(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-4 w-4" />Operational</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-4 w-4" />Degraded</Badge>
      case 'down':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-4 w-4" />Down</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getOverallBadge = () => {
    if (!status) return null
    
    switch (status.overall) {
      case 'operational':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-4 w-4" />All Systems Operational</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-4 w-4" />Some Issues</Badge>
      case 'down':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-4 w-4" />Systems Down</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SentinelCloud</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">System Status</h1>
          {getOverallBadge()}
        </div>
        <p className="text-muted-foreground mb-10">
          Real-time status of SentinelCloud services. This page is updated automatically.
        </p>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">Loading status...</div>
            </CardContent>
          </Card>
        ) : errorMessage || !status ? (
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive" className="border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Could not load status</AlertTitle>
                <AlertDescription className="mt-2">
                  {errorMessage || 'An unexpected error occurred. Please try again later.'}
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Current status of our core systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status.services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    {service.lastCheck && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last check: {new Date(service.lastCheck).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {status && (
          <p className="mt-8 text-sm text-muted-foreground">
            Last updated: {new Date(status.timestamp).toLocaleString()}
          </p>
        )}
      </main>
    </div>
  )
}
