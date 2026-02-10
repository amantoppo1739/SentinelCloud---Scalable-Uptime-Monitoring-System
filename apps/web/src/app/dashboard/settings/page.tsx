'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useAvatar } from '@/lib/avatar-context'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { User, Bell, Shield, Upload, X, Key, Plus, Trash2, Copy, Check } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  avatarKey?: string
}

export default function SettingsPage() {
  const { logout } = useAuth()
  const { refreshAvatar } = useAvatar()
  const [user, setUser] = useState<User | null>(null)
  // Get the actual API base URL for documentation
  const apiBaseUrl = typeof window !== 'undefined' 
    ? window.location.origin // In production, use current origin (Vercel will proxy)
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile update states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  
  // CSRF token
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  
  // API Keys states
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loadingApiKeys, setLoadingApiKeys] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKey, setNewKey] = useState<{ key: string; keyId: string; name?: string } | null>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
    fetchCsrfToken()
    fetchApiKeys()
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  async function fetchCsrfToken() {
    try {
      const response = await api.get('/api/auth/csrf-token')
      setCsrfToken(response.data.csrfToken)
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err)
    }
  }

  async function fetchApiKeys() {
    setLoadingApiKeys(true)
    try {
      const response = await api.get('/api/api-keys')
      setApiKeys(response.data.apiKeys)
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err)
      toast.error('Failed to load API keys')
    } finally {
      setLoadingApiKeys(false)
    }
  }

  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault()
    setCreatingKey(true)
    try {
      const response = await api.post('/api/api-keys', { name: newKeyName || undefined }, {
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
      setNewKey(response.data)
      setNewKeyName('')
      await fetchApiKeys()
      await fetchCsrfToken()
      toast.success('API key created successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create API key')
    } finally {
      setCreatingKey(false)
    }
  }

  async function handleRevokeApiKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }
    
    try {
      await api.delete(`/api/api-keys/${keyId}`, {
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
      await fetchApiKeys()
      await fetchCsrfToken()
      toast.success('API key revoked successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to revoke API key')
    }
  }

  async function copyToClipboard(text: string, keyId: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKeyId(keyId)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedKeyId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  useEffect(() => {
    if (user?.avatarKey) {
      api.get('/api/auth/me/avatar').then((r) => setAvatarUrl(r.data.url)).catch(() => setAvatarUrl(null))
    } else {
      setAvatarUrl(null)
    }
  }, [user?.avatarKey])

  async function fetchUser() {
    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data.user)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load account')
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      if (csrfToken) {
        formData.append('csrfToken', csrfToken)
      }
      await api.post('/api/auth/me/avatar', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      })
      await fetchUser()
      refreshAvatar() // Refresh avatar in navbar
      toast.success('Avatar updated successfully')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Upload failed'
      setAvatarError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError('')
    setRemoving(true)
    try {
      await api.delete('/api/auth/me/avatar', {
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
      await fetchUser()
      await fetchCsrfToken() // Refresh CSRF token
      refreshAvatar() // Refresh avatar in navbar
      toast.success('Avatar removed successfully')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove'
      setAvatarError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setRemoving(false)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError('')
    setUpdatingProfile(true)
    
    try {
      const updateData: any = {}
      if (name !== user?.name) updateData.name = name
      if (email !== user?.email) updateData.email = email
      
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save')
        return
      }
      
      await api.patch('/api/auth/me', updateData, {
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
      await fetchUser()
      await fetchCsrfToken() // Refresh CSRF token
      toast.success('Profile updated successfully')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile'
      setProfileError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setUpdatingProfile(false)
    }
  }

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
    let score = 0
    if (password.length >= 8) score += 20
    if (password.length >= 12) score += 10
    if (/[A-Z]/.test(password)) score += 20
    if (/[a-z]/.test(password)) score += 20
    if (/[0-9]/.test(password)) score += 20
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20

    if (score >= 80) return { strength: 'strong', score }
    if (score >= 60) return { strength: 'medium', score }
    return { strength: 'weak', score }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }
    
    setChangingPassword(true)
    
    try {
      await api.post('/api/auth/me/change-password', {
        currentPassword,
        newPassword,
      }, {
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
      
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await fetchCsrfToken() // Refresh CSRF token
      toast.success('Password changed successfully. Please log in again.')
      
      // Logout after a short delay
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to change password'
      setPasswordError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-9 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                  <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload new photo'}
                  </Button>
                  {user?.avatarKey && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      disabled={removing}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      {removing ? 'Removing...' : 'Remove photo'}
                    </Button>
                  )}
                </div>
              </div>
              {avatarError && (
                <Alert variant="destructive">
                  <AlertDescription>{avatarError}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">JPEG, PNG or WebP. Max 2 MB.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileError && (
                  <Alert variant="destructive">
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" disabled={updatingProfile || (name === user?.name && email === user?.email)}>
                  {updatingProfile ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alert email and webhook URL are configured <strong>per monitor</strong>. When a monitor goes down, SentinelCloud can:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Send an email to the address you set on that monitor</li>
                <li>POST to a Discord or Slack webhook URL you set on that monitor</li>
              </ul>
              <Separator />
              <Link href="/dashboard">
                <Button variant="outline">Manage monitors</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <PasswordInput
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 flex-1 rounded ${
                            getPasswordStrength(newPassword).strength === 'weak'
                              ? 'bg-red-500'
                              : getPasswordStrength(newPassword).strength === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">
                          {getPasswordStrength(newPassword).strength}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Password must contain:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                            At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                            One uppercase letter
                          </li>
                          <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                            One lowercase letter
                          </li>
                          <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                            One number
                          </li>
                          <li
                            className={
                              /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
                                ? 'text-green-600'
                                : ''
                            }
                          >
                            One special character
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={changingPassword || newPassword !== confirmPassword || newPassword.length < 8}
                >
                  {changingPassword ? 'Changing...' : 'Change password'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign out to require a password on this device again.
              </p>
              <Button variant="destructive" onClick={logout}>
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for programmatic access to the API (scripts, integrations, CI/CD).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium">How to use your API key</p>
                <p className="text-sm text-muted-foreground">Send it in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization</code> header with every request:</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {`Authorization: Bearer YOUR_API_KEY`}
                </pre>
                <p className="text-sm text-muted-foreground">Example (list monitors):</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto break-all">
                  {`curl -H "Authorization: Bearer YOUR_API_KEY" ${apiBaseUrl}/api/monitors`}
                </pre>
                <p className="text-xs text-muted-foreground">
                  Base URL: <code className="bg-muted px-1 rounded">{apiBaseUrl}</code> — Full API reference: <Link href="/docs" className="text-primary underline">Docs</Link>
                </p>
              </div>
              {newKey && (
                <Alert>
                  <AlertDescription className="space-y-2">
                    <p className="font-semibold">API Key Created!</p>
                    <p className="text-sm">Save this key now - it will not be shown again.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                        {newKey.key}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(newKey.key, 'new')}
                      >
                        {copiedKeyId === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewKey(null)}
                      className="mt-2"
                    >
                      Close
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleCreateApiKey} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (optional)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    maxLength={255}
                  />
                  <Button type="submit" disabled={creatingKey}>
                    {creatingKey ? 'Creating...' : <><Plus className="h-4 w-4 mr-2" />Create Key</>}
                  </Button>
                </div>
              </form>
              
              <Separator />
              
              {loadingApiKeys ? (
                <div className="text-center py-4 text-muted-foreground">Loading API keys...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No API keys yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{key.name || 'Unnamed Key'}</p>
                          {key.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Revoked</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {key.keyPreview}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                      {key.isActive && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeApiKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Alert>
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-1">Security Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Never share your API keys publicly</li>
                    <li>Rotate keys regularly</li>
                    <li>Revoke keys you no longer use</li>
                    <li>Use keys only in secure environments</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
