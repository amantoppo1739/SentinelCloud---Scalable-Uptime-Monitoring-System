'use client'

import { useEffect, useState } from 'react'
import { api, type Monitor } from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { decodeUrlForDisplay } from '@/lib/utils'
import { MoreVertical, Trash2, Edit, Eye } from 'lucide-react'

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [monitorToDelete, setMonitorToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchMonitors()
  }, [])

  async function fetchMonitors() {
    try {
      const response = await api.get('/api/monitors')
      setMonitors(response.data.monitors)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load monitors')
      toast.error('Failed to load monitors')
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteClick(id: string) {
    setMonitorToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!monitorToDelete) return

    try {
      await api.delete(`/api/monitors/${monitorToDelete}`)
      setMonitors(monitors.filter((m) => m.id !== monitorToDelete))
      toast.success('Monitor deleted successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete monitor')
    } finally {
      setDeleteDialogOpen(false)
      setMonitorToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitors</h1>
        <Link href="/dashboard/monitors/new">
          <Button>Add Monitor</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {monitors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No monitors yet. Create your first monitor to get started!
              </p>
              <Link href="/dashboard/monitors/new">
                <Button size="lg">Create Monitor</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {monitors.map((monitor) => (
            <Card key={monitor.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg flex-1">{monitor.name}</CardTitle>
                  <Badge variant={monitor.isActive ? 'success' : 'secondary'}>
                    {monitor.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="break-all mt-2">{decodeUrlForDisplay(monitor.url)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                <div className="grid grid-cols-3 gap-2 items-stretch mt-auto">
                  <Link href={`/dashboard/monitors/${monitor.id}`} className="min-w-0">
                    <Button variant="outline" size="sm" className="w-full min-w-[72px] gap-2">
                      <Eye className="h-4 w-4 shrink-0" />
                      <span className="truncate">View</span>
                    </Button>
                  </Link>
                  <Link href={`/dashboard/monitors/${monitor.id}/edit`} className="min-w-0">
                    <Button variant="outline" size="sm" className="w-full min-w-[72px] gap-2">
                      <Edit className="h-4 w-4 shrink-0" />
                      <span className="truncate">Edit</span>
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full min-w-[72px] gap-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(monitor.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the monitor and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
