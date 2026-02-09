import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-xl font-bold">Privacy Policy</span>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>
      </header>
      <main className="container py-16 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 7, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to SentinelCloud ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you use our uptime monitoring service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
              <p className="text-muted-foreground mb-2">
                When you create an account or use our service, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Email address and account credentials</li>
                <li>Monitor URLs and configuration settings</li>
                <li>Alert preferences and notification channels</li>
                <li>Billing information (if you upgrade to a paid plan)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-2">
                We automatically collect certain information when you use our service:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Monitor check results and response times</li>
                <li>Uptime statistics and incident logs</li>
                <li>IP addresses and browser information</li>
                <li>Usage patterns and service interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>To provide and maintain our monitoring service</li>
                <li>To send alerts and notifications as configured</li>
                <li>To process transactions and manage your account</li>
                <li>To improve our service and develop new features</li>
                <li>To communicate with you about your account and service updates</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-2">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist us in operating our service (e.g., hosting, payment processing, email delivery)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale, your information may be transferred</li>
                <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your information, including encryption, 
                secure authentication, and regular security audits. However, no method of transmission over the internet 
                is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground mb-2">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise these rights, please contact us through your account settings or email us directly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, 
                and maintain your session. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">8. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide our 
                service. We may retain certain information for longer periods as required by law or for legitimate business 
                purposes, such as resolving disputes or enforcing agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If you believe we have collected information from a child, please contact us 
                immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">10. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new policy on this page and updating the "Last updated" date. Your continued use of our 
                service after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> privacy@sentinelcloud.com<br />
                <strong>Owner:</strong> Aman Toppo
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
