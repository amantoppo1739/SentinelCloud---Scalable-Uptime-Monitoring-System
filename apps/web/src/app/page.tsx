'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { ThemeToggle } from '@/components/theme-toggle'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import {
  Zap,
  Bell,
  BarChart3,
  Shield,
  Download,
  Check,
  X,
  Globe,
  Slack,
  Mail,
  Webhook,
  Activity,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const features = [
    {
      icon: Zap,
      title: '60-Second Checks',
      description: 'Automatic monitoring every minute to catch issues instantly',
      popular: true,
      bento: 'large' as const,
    },
    {
      icon: BarChart3,
      title: 'Real-Time Metrics',
      description: 'Track uptime, response times, and performance trends',
      popular: false,
      bento: 'default' as const,
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Email and webhook notifications when your services go down',
      popular: true,
      bento: 'large' as const,
    },
    {
      icon: Shield,
      title: 'Status Badges',
      description: 'Public SVG badges to display your service status',
      popular: false,
      bento: 'default' as const,
    },
    {
      icon: Download,
      title: 'CSV Export',
      description: 'Download detailed reports for analysis and compliance',
      popular: false,
      bento: 'default' as const,
    },
    {
      icon: Globe,
      title: 'Global Monitoring',
      description: 'Checks from NYC, London, and Tokyo so you get accurate global coverage.',
      popular: false,
      bento: 'large' as const,
    },
  ]

  const testimonials = [
    {
      quote: "My mom says it's the best uptime monitor ever made. She doesn't know what an API is, but she's very proud of me.",
      author: "The Developer's Mom",
      avatar: "👩",
      bg: "bg-pink-500/20",
    },
    {
      quote: "I haven't been fired yet because this app texted me before my boss noticed the site was down. 10/10 would keep my job again.",
      author: "A Developer at 3 AM",
      avatar: "😴",
      bg: "bg-violet-500/20",
    },
    {
      quote: "It's like a digital guard dog that never sleeps, never needs treats, and doesn't bark at the mailman.",
      author: "Our Internal Testing Script",
      avatar: "🐕",
      bg: "bg-amber-500/20",
    },
    {
      quote: "Your face here?",
      author: "Be the first to tell us how much you love SentinelCloud. Sign up today and send us a tweet!",
      avatar: "✨",
      bg: "bg-primary/20",
      cta: true,
    },
  ]

  const integrations = [
    { name: 'Slack', icon: Slack, brandColor: '#4A154B' },
    { name: 'Discord', icon: Webhook, brandColor: '#5865F2' },
    { name: 'Email', icon: Mail, brandColor: 'hsl(var(--primary))' },
    { name: 'Webhook', icon: Activity, brandColor: '#22c55e' },
  ]

  const faqs = [
    {
      question: 'How often do you check my websites?',
      answer: 'We check your monitors every 60 seconds (1 minute). This is included in our free tier, while most competitors only offer 5-minute checks for free.',
    },
    {
      question: 'What are the limits of the free plan?',
      answer: 'Free forever with up to 5 monitors, 60-second checks, unlimited alerts via email and webhook, and full access to all features including CSV exports and status badges.',
    },
    {
      question: 'Do you support custom webhooks?',
      answer: 'Yes! You can configure custom webhook URLs for each monitor. We send a POST request with detailed information when your service goes down or comes back up.',
    },
    {
      question: 'Where are your monitoring servers located?',
      answer: 'Checks run from multiple regions including NYC, London, and Tokyo so you get accurate global coverage—not just a single data center.',
    },
    {
      question: 'Can I export my monitoring data?',
      answer: 'Yes, you can export detailed CSV reports of all ping logs and performance metrics for any time range. Perfect for compliance and analysis.',
    },
  ]

  const previewChartData = [
    { time: '12:00', responseTime: 320 },
    { time: '01:00', responseTime: 380 },
    { time: '02:00', responseTime: 290 },
    { time: '03:00', responseTime: 410 },
    { time: '04:00', responseTime: 350 },
    { time: '05:00', responseTime: 280 },
    { time: '06:00', responseTime: 360 },
    { time: '07:00', responseTime: 340 },
    { time: '08:00', responseTime: 310 },
    { time: '09:00', responseTime: 390 },
    { time: '10:00', responseTime: 330 },
    { time: '11:00', responseTime: 370 },
  ]

  const previewChartConfig = {
    responseTime: {
      label: 'Response Time',
      color: 'hsl(var(--primary))',
    },
  }

  const comparison = [
    { feature: 'Check Frequency', us: '60 seconds', others: '5 minutes', highlight: true },
    { feature: 'Free Monitors', us: '5 monitors', others: '1-3 monitors', highlight: false },
    { feature: 'Email Alerts', us: 'Unlimited', others: 'Limited', highlight: false },
    { feature: 'Webhook Support', us: 'Included', others: 'Paid only', highlight: false },
    { feature: 'Status Badges', us: 'Included', others: 'Paid only', highlight: false },
    { feature: 'CSV Exports', us: 'Unlimited', others: 'Limited', highlight: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">SentinelCloud</span>
            </Link>
            <Link href="/status" className="hidden sm:inline-flex">
              <Badge variant="success" className="cursor-pointer hover:opacity-90 transition-opacity">
                <Activity className="mr-1 h-3 w-3" />
                100% Uptime
              </Badge>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
            <a href="#comparison" className="hover:text-foreground transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/login">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center animate-in fade-in duration-500">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            Free Forever • 60-Second Checks
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Sleep better knowing we're{' '}
            <span className="text-primary">watching your servers</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Get notified on Slack or Email before your customers even notice. 
            60-second checks, unlimited alerts, zero hassle.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 transition-all hover:scale-[1.02]">
                Start monitoring free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="text-lg px-8 transition-all hover:bg-accent/50">
                Log in
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Up to 5 monitors • 1-minute checks • Unlimited alerts • $0/month
          </p>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container py-12">
        <Card className="mx-auto max-w-5xl overflow-hidden border-2 shadow-2xl shadow-primary/10 dark:shadow-primary/5 [box-shadow:0_25px_60px_-15px_rgba(59,130,246,0.18),0_12px_25px_-8px_rgba(0,0,0,0.08)] dark:[box-shadow:0_25px_60px_-15px_rgba(59,130,246,0.12),0_12px_25px_-8px_rgba(0,0,0,0.3)]">
          <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Response Time Trend</h3>
                <Badge variant="success">All Systems Operational</Badge>
              </div>
              <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm overflow-hidden">
                <ChartContainer
                  config={previewChartConfig}
                  className="h-[280px] w-full [&_.recharts-cartesian-grid_line]:stroke-border/60"
                >
                  <AreaChart data={previewChartData}>
                    <defs>
                      <linearGradient id="fillResponseTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `${v}ms`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="responseTime"
                      stroke="hsl(var(--primary))"
                      fill="url(#fillResponseTime)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">324ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Total Checks</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Real dashboard preview — Beautiful charts, instant insights
        </p>
      </section>

      {/* Social Proof - Fun testimonials carousel */}
      <section className="container py-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm text-muted-foreground mb-8">
            What people are saying (mostly ourselves, but we're people too)
          </p>
          <Carousel
            opts={{ align: 'center', loop: true }}
            orientation="horizontal"
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((t) => (
                <CarouselItem key={t.author} className="pl-4 basis-full sm:basis-[85%] md:basis-[70%] lg:basis-[45%]">
                  <Card className="border-primary/20 bg-primary/5 flex flex-col h-full">
                    <CardContent className="pt-6 flex flex-col flex-1 flex-grow">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`rounded-xl p-2.5 shrink-0 ${t.bg} text-2xl leading-none`} aria-hidden>
                          {t.avatar}
                        </div>
                        <div className="flex flex-col min-h-[100px]">
                          <p className="text-sm italic text-muted-foreground mb-2 flex-1">
                            &ldquo;{t.quote}&rdquo;
                          </p>
                          <p className={`text-xs font-semibold mt-auto pt-2 ${t.cta ? 'text-primary' : ''}`}>
                            {t.cta ? (
                              <Link href="/login" className="hover:underline">
                                {t.author}
                              </Link>
                            ) : (
                              <>— {t.author}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 sm:left-4 border-border bg-background/80 hover:bg-background shadow-md" />
            <CarouselNext className="right-2 sm:right-4 border-border bg-background/80 hover:bg-background shadow-md" />
          </Carousel>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" className="container py-24 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything you need to keep your services online
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Professional monitoring features, no credit card required
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {features.map((feature) => {
              const Icon = feature.icon
              const isLarge = feature.bento === 'large'
              return (
                <Card
                  key={feature.title}
                  className={`h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:bg-accent/30 flex flex-col ${
                    isLarge ? 'md:col-span-2' : ''
                  }`}
                >
                  <CardHeader className={isLarge ? 'pb-2' : ''}>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {feature.title}
                      {feature.popular && (
                        <Badge variant="secondary" className="text-[10px]">Popular</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={isLarge ? 'pt-0' : ''}>
                    <CardDescription className={isLarge ? 'text-sm max-w-xl' : ''}>
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="container py-12 scroll-mt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">Integrates with your workflow</h2>
          <p className="text-muted-foreground mb-8">
            Get alerts where you already work
          </p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <div
                  key={integration.name}
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl"
                  style={{ ['--integration-color' as string]: integration.brandColor }}
                >
                  <div className="rounded-full p-4 bg-muted">
                    <Icon className="h-8 w-8 text-muted-foreground transition-colors duration-200 group-hover:text-[var(--integration-color)]" />
                  </div>
                  <span className="text-sm font-medium">{integration.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      {/* Comparison Table */}
      <section id="comparison" className="container py-24 scroll-mt-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Why SentinelCloud?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Premium features in the free tier that others charge for
          </p>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold text-primary">SentinelCloud</th>
                      <th className="text-center p-4 font-semibold text-muted-foreground">Typical Free Tiers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item, index) => (
                      <tr 
                        key={item.feature} 
                        className={`border-b last:border-0 ${item.highlight ? 'bg-primary/5' : ''}`}
                      >
                        <td className="p-4 font-medium">{item.feature}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-primary">{item.us}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <X className="h-4 w-4 text-destructive" />
                            <span>{item.others}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-24 scroll-mt-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need to know about SentinelCloud
          </p>
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Card className="border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/10">
            <CardHeader>
              <CardTitle className="text-3xl">
                Ready to get started?
              </CardTitle>
              <CardDescription className="text-lg">
                Start monitoring your services in minutes. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  Start monitoring free
                </Button>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                5 monitors • 60-second checks • Unlimited alerts • Free forever
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-16">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">SentinelCloud</span>
              <Link href="/status">
                <Badge variant="success" className="ml-2 cursor-pointer hover:opacity-90 transition-opacity">
                  <Activity className="mr-1 h-3 w-3" />
                  Monitoring itself
                </Badge>
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">
                Log in
              </Link>
              <Link href="/docs" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <span className="text-muted-foreground/80">© 2026 SentinelCloud. Created by Aman Toppo</span>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
