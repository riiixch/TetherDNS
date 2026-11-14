import nodemailer from 'nodemailer'
import type { NotificationPayload } from './sendDiscord'

export interface EmailConfig {
    provider?: 'gmail' | 'custom'
    host?: string
    port?: number
    secure?: boolean
    user: string
    pass: string
    toAddress: string
    fromName?: string
}

export async function sendEmail(config: EmailConfig, payload: NotificationPayload) {
    if (!config.user || !config.pass || !config.toAddress) return

    const isGmail = config.provider === 'gmail' || config.user.trim().toLowerCase().endsWith('@gmail.com')
    const host = isGmail ? 'smtp.gmail.com' : (config.host || 'smtp.gmail.com')
    const port = isGmail ? 465 : (config.port || 465)
    const secure = isGmail ? true : (config.secure !== undefined ? config.secure : port === 465)

    // For Gmail, remove spaces from 16-digit Google App Password
    const sanitizedPass = isGmail ? config.pass.replace(/\s+/g, '') : config.pass.trim()

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: config.user.trim(),
            pass: sanitizedPass
        }
    })

    const accentColor = payload.color === 'error'
        ? '#ff4444'
        : (payload.color === 'warning' ? '#f59e0b' : '#12e08a')

    let fieldsHtml = ''
    if (payload.fields && payload.fields.length > 0) {
        fieldsHtml = `
            <table style="width:100%; border-collapse: collapse; margin-top: 16px; font-family: monospace; font-size: 13px;">
                ${payload.fields.map(f => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                        <td style="padding: 8px 12px; color: #94a3b8; font-weight: bold; width: 35%;">${escapeHtml(f.name)}</td>
                        <td style="padding: 8px 12px; color: #f8fafc;">${escapeHtml(f.value)}</td>
                    </tr>
                `).join('')}
            </table>
        `
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; }
            .header { padding: 24px; border-bottom: 1px solid #1f2937; display: flex; align-items: center; gap: 12px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; }
            .body { padding: 24px; line-height: 1.6; }
            .footer { padding: 16px 24px; background-color: #0c1322; border-top: 1px solid #1f2937; font-size: 12px; color: #64748b; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size: 18px; font-weight: 800; color: #12e08a; letter-spacing: -0.02em;">TetherDNS Alert</div>
            </div>
            <div class="body">
                <span class="badge" style="background: rgba(255,255,255,0.06); color: ${accentColor}; border: 1px solid ${accentColor};">
                    ${escapeHtml(payload.eventType || 'ALERT')}
                </span>
                <h2 style="margin: 12px 0 8px; font-size: 20px; color: #f8fafc;">${escapeHtml(payload.title)}</h2>
                <p style="color: #cbd5e1; margin: 0; white-space: pre-wrap;">${escapeHtml(payload.message)}</p>
                ${fieldsHtml}
            </div>
            <div class="footer">
                TetherDNS Edge Guardian • Automated Notification System • ${new Date().toUTCString()}
            </div>
        </div>
    </body>
    </html>
    `

    await transporter.sendMail({
        from: `"${config.fromName || 'TetherDNS Alerts'}" <${config.user}>`,
        to: config.toAddress,
        subject: `[TetherDNS] ${payload.title}`,
        html,
        text: `${payload.title}\n\n${payload.message}`
    })
}

function escapeHtml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}
