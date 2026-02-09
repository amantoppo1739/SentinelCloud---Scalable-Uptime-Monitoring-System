'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, type Monitor, type PingLog, type MonitorStats } from '@/lib/api'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Info, Download, Edit } from 'lucide-react'
import { decodeUrlForDisplay } from '@/lib/utils'

export default function MonitorDetailPage() {
  const params = useParams()
  const monitorId = params.id as string

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [stats, setStats] = useState<MonitorStats | null>(null)
  const [logs, setLogs] = useState<PingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [togglingStatus, setTogglingStatus] = useState(false)

  useEffect(() => {
    fetchMonitor()
    fetchStats()
    fetchLogs()
  }, [monitorId, timeRange])

  async function fetchMonitor() {
    try {
      const response = await api.get(`/api/monitors/${monitorId}`)
      setMonitor(response.data.monitor)
    } catch (err: any) {
      console.error('Failed to fetch monitor:', err)
    }
  }

  async function handleStatusToggle(checked: boolean) {
    if (!monitorId || togglingStatus) return
    setTogglingStatus(true)
    try {
      await api.patch(`/api/monitors/${monitorId}`, { isActive: checked })
      await fetchMonitor()
      toast.success(checked ? 'Monitor enabled' : 'Monitor paused')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status')
    } finally {
      setTogglingStatus(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get(`/api/metrics/${monitorId}/stats`, {
        params: { hours: timeRange },
      })
      setStats(response.data)
    } catch (err: any) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLogs() {
    try {
      const hours = parseInt(timeRange, 10) || 24
      const endDate = new Date()
      const startDate = new Date()
      startDate.setHours(startDate.getHours() - hours)
      const response = await api.get(`/api/metrics/${monitorId}`, {
        params: { limit: '200', startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      })
      setLogs(response.data.logs)
    } catch (err: any) {
      console.error('Failed to fetch logs:', err)
    }
  }

  async function handleExportCsv() {
    setExportError('')
    setExporting(true)
    try {
      const response = await api.post(`/api/export/csv/${monitorId}`, null, {
        responseType: 'blob',
      })
      const contentType = response.headers['content-type'] || ''
      if (contentType.includes('application/json')) {
        const text = await (response.data as Blob).text()
        const data = JSON.parse(text)
        const url = data.downloadUrl || (data.s3Key ? await getPresignedUrl(data.s3Key) : null)
        if (url) {
          window.open(url, '_blank')
          toast.success('Export started')
        } else {
          setExportError('No download URL in response')
          toast.error('Export failed: No download URL')
        }
      } else {
        const blob = response.data as Blob
        const disposition = response.headers['content-disposition']
        const match = disposition && /filename="?([^";]+)"?/.exec(disposition)
        const filename = match ? match[1] : `monitor-${monitorId}-${Date.now()}.csv`
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = filename
        a.click()
        URL.revokeObjectURL(objectUrl)
        toast.success('Export downloaded')
      }
    } catch (err: any) {
      let msg = 'Export failed'
      if (err.response?.data instanceof Blob) {
        try {
          const data = JSON.parse(await err.response.data.text())
          msg = data.error || msg
        } catch {
          // keep default
        }
      } else if (err.response?.data?.error) {
        msg = typeof err.response.data.error === 'string' ? err.response.data.error : msg
      }
      setExportError(msg)
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  async function getPresignedUrl(s3Key: string): Promise<string> {
    const res = await api.get(`/api/export/presigned-url/${encodeURIComponent(s3Key)}`)
    return res.data.url
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!monitor || !stats) {
    return <div className="text-center py-12">Monitor not found</div>
  }

  const chartData = logs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    responseTime: log.responseTimeMs,
    timestamp: log.timestamp,
  }))

  const chartConfig = {
    responseTime: {
      label: 'Response Time',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Monitors', href: '/dashboard' },
          { label: monitor.name },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{monitor.name}</h1>
          <p className="text-muted-foreground mt-1">{decodeUrlForDisplay(monitor.url)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="monitor-status"
              checked={monitor.isActive}
              disabled={togglingStatus}
              onCheckedChange={handleStatusToggle}
            />
            <Label htmlFor="monitor-status" className="text-sm font-medium cursor-pointer">
              {monitor.isActive ? 'Active' : 'Paused'}
            </Label>
          </div>
          <Link href={`/dashboard/monitors/${monitorId}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>
      {exportError && (
        <Alert variant="destructive">
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-muted-foreground">Uptime</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage of successful pings in the selected time range</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-2 text-3xl font-bold">{stats.uptime.toFixed(2)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-muted-foreground">Avg Response Time</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average response time in milliseconds</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-2 text-3xl font-bold">{stats.avgResponseTime.toFixed(0)}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Total Pings</div>
            <div className="mt-2 text-3xl font-bold">{stats.totalPings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Failed Pings</div>
            <div className="mt-2 text-3xl font-bold text-destructive">{stats.failedPings}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Response Time Trend</CardTitle>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last Hour</SelectItem>
                    <SelectItem value="24">Last 24 Hours</SelectItem>
                    <SelectItem value="168">Last 7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="[&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-area]:stroke-primary [&_.recharts-area]:fill-primary [&_.recharts-area]:opacity-30"
              >
                <AreaChart data={chartData}>
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    tick={(props: { x: number; y: number; payload?: { value?: string } }) => (
                      <text
                        x={props.x}
                        y={props.y}
                        dy={8}
                        fill="hsl(var(--muted-foreground))"
                        fontSize={10}
                        textAnchor="end"
                        transform={`rotate(-35 ${props.x} ${props.y})`}
                      >
                        {props.payload?.value}
                      </text>
                    )}
                    height={56}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                  <div className="text-2xl font-bold">{stats.uptime.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Pings</div>
                  <div className="text-2xl font-bold">{stats.totalPings}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Failed Pings</div>
                  <div className="text-2xl font-bold text-destructive">{stats.failedPings}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 20).map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.statusCode}</TableCell>
                      <TableCell>{log.responseTimeMs}ms</TableCell>
                      <TableCell>
                        <Badge variant={log.success ? 'success' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
