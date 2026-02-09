import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-xl font-bold">Terms of Service</span>
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
            <CardTitle className="text-3xl mb-2">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 7, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using SentinelCloud ("the Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms 
                apply to all users of the Service, including without limitation users who are browsers, vendors, customers, 
                merchants, and contributors of content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                SentinelCloud is an uptime monitoring service that checks the availability and performance of websites 
                and APIs. We provide monitoring, alerting, status pages, and related services. The Service is provided 
                "as is" and may be modified, suspended, or discontinued at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">3. Account Registration</h2>
              <p className="text-muted-foreground mb-2">
                To use the Service, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information to keep it accurate</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Be at least 18 years old or have parental consent</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-2">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Monitor websites or services you do not own or have authorization to monitor</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code, viruses, or harmful data</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Create excessive load on our infrastructure</li>
                <li>Use automated systems to abuse or exploit the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">5. Service Plans and Pricing</h2>
              <p className="text-muted-foreground mb-2">
                SentinelCloud offers both free and paid service plans:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Free Plan:</strong> Includes up to 5 monitors, 60-second check intervals, and unlimited alerts</li>
                <li><strong>Paid Plans:</strong> Additional features, more monitors, and faster check intervals</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We reserve the right to modify pricing at any time. Paid plans are billed in advance on a recurring basis. 
                Refunds are provided at our discretion and in accordance with our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">6. Service Availability</h2>
              <p className="text-muted-foreground">
                While we strive to maintain high availability, we do not guarantee that the Service will be uninterrupted, 
                error-free, or available at all times. We may perform maintenance, updates, or modifications that temporarily 
                affect service availability. We are not liable for any downtime or service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">7. Data and Content</h2>
              <h3 className="text-lg font-semibold mt-4 mb-2">7.1 Your Data</h3>
              <p className="text-muted-foreground">
                You retain ownership of all data you submit to the Service. You grant us a license to use, store, and 
                process your data solely for the purpose of providing the Service. You are responsible for backing up 
                your data.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">7.2 Our Data</h3>
              <p className="text-muted-foreground">
                All rights, title, and interest in the Service, including all intellectual property rights, remain with 
                SentinelCloud and its licensors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">8. Termination</h2>
              <p className="text-muted-foreground mb-2">
                Either party may terminate this agreement at any time:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>You may cancel your account at any time through your account settings</li>
                <li>We may suspend or terminate your account if you violate these Terms</li>
                <li>We may terminate free accounts that have been inactive for an extended period</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Upon termination, your right to use the Service will immediately cease. We may delete your account and 
                data after a reasonable retention period, though some data may be retained as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SENTINELCLOUD SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY 
                OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF 
                THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRIOR TO THE 
                EVENT GIVING RISE TO THE LIABILITY.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">10. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
                IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR BE AVAILABLE ON AN 
                UNINTERRUPTED, SECURE, OR ERROR-FREE BASIS.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">11. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless SentinelCloud, its officers, directors, employees, and 
                agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' 
                fees, arising out of or in any way connected with your use of the Service, violation of these Terms, or 
                infringement of any rights of another.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">12. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                SentinelCloud operates, without regard to its conflict of law provisions. Any disputes arising from these 
                Terms or the Service shall be resolved in the appropriate courts of that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">13. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by posting 
                the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after 
                such changes constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop 
                using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">14. Severability</h2>
              <p className="text-muted-foreground">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or 
                eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">15. Entire Agreement</h2>
              <p className="text-muted-foreground">
                These Terms constitute the entire agreement between you and SentinelCloud regarding the Service and supersede 
                all prior agreements and understandings, whether written or oral.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-6 mb-3">16. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> legal@sentinelcloud.com<br />
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
