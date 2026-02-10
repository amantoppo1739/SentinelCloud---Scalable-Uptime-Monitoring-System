import axios from 'axios'

// Use relative URLs in production (proxied through Vercel)
// Use absolute URL in development (direct to localhost API)
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '' // Empty string = relative URLs (will use Vercel proxy at /api/*)
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Request interceptor to add access token and CSRF token
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  
  // Add CSRF token for state-changing requests (POST, PATCH, DELETE)
  if (['post', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const csrfToken = localStorage.getItem('csrfToken')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
  }
  
  return config
})

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshUrl = API_URL ? `${API_URL}/api/auth/refresh` : '/api/auth/refresh'
        const response = await axios.post(refreshUrl, {}, {
          withCredentials: true,
        })

        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export interface Monitor {
  id: string
  userId: string
  name: string
  url: string
  alertEmail?: string
  webhookUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PingLog {
  _id: string
  monitorId: string
  timestamp: string
  statusCode: number
  responseTimeMs: number
  success: boolean
}

export interface MonitorStats {
  uptime: number
  avgResponseTime: number
  totalPings: number
  successfulPings: number
  failedPings: number
}
