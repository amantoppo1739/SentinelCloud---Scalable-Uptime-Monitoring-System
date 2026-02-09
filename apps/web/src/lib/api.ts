import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
          withCredentials: true,
          baseURL: API_URL,
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
