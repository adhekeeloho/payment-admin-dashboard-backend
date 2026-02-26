import nodemailer from 'nodemailer';
import { env } from './env';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export const sendOtpEmail = async (to: string, code: string, expiresMinutes: number) => {
  if (!env.smtpHost || !env.smtpUser) {
    console.warn(`[mailer] SMTP not configured. OTP for ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}\n\nThis code expires in ${expiresMinutes} minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin:0 0 16px">Your verification code</h2>
        <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;margin:24px 0">${code}</p>
        <p style="color:#6b7280;font-size:14px">This code expires in <strong>${expiresMinutes} minutes</strong>.</p>
        <p style="color:#6b7280;font-size:14px">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};
