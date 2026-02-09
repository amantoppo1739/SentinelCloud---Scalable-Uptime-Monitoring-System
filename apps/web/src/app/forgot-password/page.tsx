'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { Shield, ArrowLeft, Mail } from 'lucide-react'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSuccessMessage('')
    setResetLink(null)
    setLoading(true)

    try {
      const res = await api.post('/api/auth/forgot-password', { email })
      setSuccess(true)
      setSuccessMessage(res.data?.message || 'If an account with that email exists, a password reset link has been sent.')
      if (res.data?.resetLink) {
        setResetLink(res.data.resetLink)
      }
    } catch (err: any) {
      setSuccess(true)
      setSuccessMessage('If an account with that email exists, a password reset link has been sent.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SentinelCloud</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              Reset your password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    {successMessage}
                    {resetLink && (
                      <span className="block mt-3">
                        Use this link to reset your password (email is not configured in development):
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
                {resetLink && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Reset link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={resetLink} className="font-mono text-xs" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(resetLink)
                        }}
                        title="Copy link"
                      >
                        Copy
                      </Button>
                    </div>
                    <Link href={resetLink}>
                      <Button className="w-full">Open reset page</Button>
                    </Link>
                  </div>
                )}
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Didn&apos;t receive the email?</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Check your spam folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>If email (SES) is not configured, use the link above in development</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>
                <Link href="/login">
                  <Button className="w-full" variant="outline">
                    Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>

                <div className="text-center">
                  <Link href="/login">
                    <Button type="button" variant="link">
                      Back to login
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
