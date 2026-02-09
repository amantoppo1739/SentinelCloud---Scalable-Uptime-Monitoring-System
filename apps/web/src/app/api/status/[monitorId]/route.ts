import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ monitorId: string }> }
) {
  const { monitorId } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  try {
    // Fetch monitor status from public API
    const response = await fetch(`${apiUrl}/api/public/monitors/${monitorId}/status`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error('Failed to fetch status')
    }

    const status = await response.json()
    
    // Determine badge color and text
    let badgeColor = '#6c757d' // gray for unknown
    let badgeText = 'Unknown'
    
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

    // Return SVG badge
    const svg = `
      <svg width="140" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="20" fill="${badgeColor}" rx="3"/>
        <text x="70" y="14" font-family="Arial, sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">
          ${badgeText}
        </text>
      </svg>
    `.trim()

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60', // Cache for 60 seconds
      },
    })
  } catch (error) {
    // Return error badge
    const svg = `
      <svg width="140" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="20" fill="#6c757d" rx="3"/>
        <text x="70" y="14" font-family="Arial, sans-serif" font-size="11" fill="white" text-anchor="middle" font-weight="bold">
          Status: Unknown
        </text>
      </svg>
    `.trim()

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}
