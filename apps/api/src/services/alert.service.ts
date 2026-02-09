import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import got from 'got';
import env from '../config/env.js';

const sesClient = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
  ? new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

export interface AlertOptions {
  monitorName: string;
  url: string;
  statusCode: number;
  responseTimeMs: number;
  email?: string;
  webhookUrl?: string;
}

export interface RecoveryAlertOptions {
  monitorName: string;
  url: string;
  email?: string;
  webhookUrl?: string;
  recoveredAt: Date;
  downSince: Date;
}

export async function sendEmailAlert(options: AlertOptions): Promise<void> {
  if (!sesClient || !env.SES_FROM_EMAIL || !options.email) {
    console.warn('SES not configured or no email provided, skipping email alert');
    return;
  }

  try {
    const subject = `🚨 Alert: ${options.monitorName} is down`;
    const body = `
Monitor Alert

Monitor Name: ${options.monitorName}
URL: ${options.url}
Status Code: ${options.statusCode}
Response Time: ${options.responseTimeMs}ms
Timestamp: ${new Date().toISOString()}

The monitor detected that the service is not responding correctly.
    `.trim();

    const command = new SendEmailCommand({
      Source: env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [options.email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Email alert sent to ${options.email}`);
  } catch (error) {
    console.error('Failed to send email alert:', error);
    throw error;
  }
}

export async function sendWebhookAlert(options: AlertOptions): Promise<void> {
  if (!options.webhookUrl) {
    return;
  }

  try {
    const payload = {
      text: `🚨 Alert: ${options.monitorName} is down`,
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Monitor Name', value: options.monitorName, short: true },
            { title: 'URL', value: options.url, short: true },
            { title: 'Status Code', value: String(options.statusCode), short: true },
            { title: 'Response Time', value: `${options.responseTimeMs}ms`, short: true },
            { title: 'Timestamp', value: new Date().toISOString(), short: false },
          ],
        },
      ],
    };

    await got.post(options.webhookUrl, {
      json: payload,
      timeout: {
        request: 5000,
      },
    });

    console.log(`✅ Webhook alert sent to ${options.webhookUrl}`);
  } catch (error) {
    console.error('Failed to send webhook alert:', error);
    // Don't throw - webhook failures shouldn't break the ping process
  }
}

export async function sendAlerts(options: AlertOptions): Promise<void> {
  const promises: Promise<void>[] = [];

  if (options.email) {
    promises.push(sendEmailAlert(options).catch((err) => {
      console.error('Email alert failed:', err);
    }));
  }

  if (options.webhookUrl) {
    promises.push(sendWebhookAlert(options).catch((err) => {
      console.error('Webhook alert failed:', err);
    }));
  }

  await Promise.allSettled(promises);
}

export async function sendRecoveryEmailAlert(options: RecoveryAlertOptions): Promise<void> {
  if (!sesClient || !env.SES_FROM_EMAIL || !options.email) {
    console.warn('SES not configured or no email provided, skipping recovery email alert');
    return;
  }

  try {
    const downtimeMs = options.recoveredAt.getTime() - options.downSince.getTime();
    const downtimeMinutes = Math.floor(downtimeMs / (1000 * 60));
    const downtimeHours = Math.floor(downtimeMinutes / 60);
    const downtimeDisplay = downtimeHours > 0 
      ? `${downtimeHours}h ${downtimeMinutes % 60}m`
      : `${downtimeMinutes}m`;

    const subject = `✅ Recovery: ${options.monitorName} is back online`;
    const body = `
Monitor Recovery Alert

Monitor Name: ${options.monitorName}
URL: ${options.url}
Status: Back online
Downtime Duration: ${downtimeDisplay}
Recovered At: ${options.recoveredAt.toISOString()}

The monitor detected that the service has recovered and is now responding correctly.
    `.trim();

    const command = new SendEmailCommand({
      Source: env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [options.email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Recovery email alert sent to ${options.email}`);
  } catch (error) {
    console.error('Failed to send recovery email alert:', error);
    throw error;
  }
}

export async function sendRecoveryWebhookAlert(options: RecoveryAlertOptions): Promise<void> {
  if (!options.webhookUrl) {
    return;
  }

  try {
    const downtimeMs = options.recoveredAt.getTime() - options.downSince.getTime();
    const downtimeMinutes = Math.floor(downtimeMs / (1000 * 60));
    const downtimeHours = Math.floor(downtimeMinutes / 60);
    const downtimeDisplay = downtimeHours > 0 
      ? `${downtimeHours}h ${downtimeMinutes % 60}m`
      : `${downtimeMinutes}m`;

    const payload = {
      text: `✅ Recovery: ${options.monitorName} is back online`,
      attachments: [
        {
          color: 'good',
          fields: [
            { title: 'Monitor Name', value: options.monitorName, short: true },
            { title: 'URL', value: options.url, short: true },
            { title: 'Status', value: 'Back online', short: true },
            { title: 'Downtime Duration', value: downtimeDisplay, short: true },
            { title: 'Recovered At', value: options.recoveredAt.toISOString(), short: false },
          ],
        },
      ],
    };

    await got.post(options.webhookUrl, {
      json: payload,
      timeout: {
        request: 5000,
      },
    });

    console.log(`✅ Recovery webhook alert sent to ${options.webhookUrl}`);
  } catch (error) {
    console.error('Failed to send recovery webhook alert:', error);
    // Don't throw - webhook failures shouldn't break the ping process
  }
}

export async function sendRecoveryAlerts(options: RecoveryAlertOptions): Promise<void> {
  const promises: Promise<void>[] = [];

  if (options.email) {
    promises.push(sendRecoveryEmailAlert(options).catch((err) => {
      console.error('Recovery email alert failed:', err);
    }));
  }

  if (options.webhookUrl) {
    promises.push(sendRecoveryWebhookAlert(options).catch((err) => {
      console.error('Recovery webhook alert failed:', err);
    }));
  }

  await Promise.allSettled(promises);
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name?: string
): Promise<{ sent: boolean }> {
  if (!sesClient || !env.SES_FROM_EMAIL) {
    console.warn('SES not configured, skipping password reset email');
    return { sent: false };
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const subject = 'Reset Your SentinelCloud Password';
    const body = `
Hello${name ? ` ${name}` : ''},

You requested to reset your password for your SentinelCloud account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The SentinelCloud Team
    `.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background-color: #2563eb; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Hello${name ? ` ${name}` : ''},</p>
    <p>You requested to reset your password for your SentinelCloud account.</p>
    <p><a href="${resetUrl}" class="button">Reset Password</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    <div class="footer">
      <p>Best regards,<br>The SentinelCloud Team</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const command = new SendEmailCommand({
      Source: env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: body,
            Charset: 'UTF-8',
          },
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Password reset email sent to ${email}`);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}
