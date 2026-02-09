'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, type Monitor } from '@/lib/api'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function EditMonitorPage() {
  const params = useParams()
  const router = useRouter()
  const monitorId = params.id as string

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [alertEmail, setAlertEmail] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMonitor()
  }, [monitorId])

  async function fetchMonitor() {
    try {
      const response = await api.get(`/api/monitors/${monitorId}`)
      const m = response.data.monitor
      setMonitor(m)
      setName(m.name)
      setUrl(m.url)
      setAlertEmail(m.alertEmail || '')
      setWebhookUrl(m.webhookUrl || '')
      setIsActive(m.isActive ?? true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load monitor')
      toast.error('Failed to load monitor')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.patch(`/api/monitors/${monitorId}`, {
        name,
        url,
        alertEmail: alertEmail || undefined,
        webhookUrl: webhookUrl || undefined,
        isActive,
      })
      toast.success('Monitor updated successfully')
      router.push(`/dashboard/monitors/${monitorId}`)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update monitor'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-destructive">{error || 'Monitor not found'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Monitors', href: '/dashboard' },
          { label: monitor.name, href: `/dashboard/monitors/${monitorId}` },
          { label: 'Edit' },
        ]}
      />
      <h1 className="text-3xl font-bold">Edit Monitor</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit Monitor</CardTitle>
          <CardDescription>Update monitor settings and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                type="url"
                id="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <div className="text-sm text-muted-foreground">
                  Enable monitoring for this endpoint
                </div>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertEmail">Alert Email (optional)</Label>
              <Input
                type="email"
                id="alertEmail"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="alerts@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
              <Textarea
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Receive notifications via webhook when monitor status changes
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save changes'}
              </Button>
              <Link href={`/dashboard/monitors/${monitorId}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
