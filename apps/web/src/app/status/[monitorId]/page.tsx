import { notFound } from 'next/navigation'

// Server-side: use API_URL env var (set in Vercel) or localhost for dev
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function generateMetadata({ params }: { params: Promise<{ monitorId: string }> }) {
  const { monitorId } = await params
  return {
    title: `Status - Monitor ${monitorId}`,
  }
}

async function getMonitorStatus(monitorId: string) {
  try {
    const response = await fetch(`${API_URL}/api/public/monitors/${monitorId}/status`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      cache: 'no-store', // Disable cache for server-side calls
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch monitor status:', error)
    return null
  }
}

export default async function StatusPage({ params }: { params: Promise<{ monitorId: string }> }) {
  const { monitorId } = await params
  const status = await getMonitorStatus(monitorId)
  
  // Determine badge color and text based on status
  let badgeColor = '#6c757d' // gray for unknown
  let badgeText = 'Unknown'
  
  if (status) {
    switch (status.status) {
      case 'up':
        badgeColor = '#28a745' // green
        badgeText = `Up (${status.uptime.toFixed(1)}%)`
        break
      case 'degraded':
        badgeColor = '#ffc107' // yellow
        badgeText = `Degraded (${status.uptime.toFixed(1)}%)`
        break
      case 'down':
        badgeColor = '#dc3545' // red
        badgeText = `Down (${status.uptime.toFixed(1)}%)`
        break
      default:
        badgeColor = '#6c757d'
        badgeText = 'Unknown'
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <svg width="140" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="20" fill={badgeColor} rx="3"/>
        <text 
          x="70" 
          y="14" 
          fontFamily="Arial, sans-serif" 
          fontSize="11" 
          fill="white" 
          textAnchor="middle" 
          fontWeight="bold"
        >
          {badgeText}
        </text>
      </svg>
    </div>
  )
}
