import { google } from 'googleapis';
import { env } from '../../config/environment.js';
import logger from '../../utils/logger.js';
import type { PlatformContent } from '../../models/types/content.js';

export class GmailService {
  private gmail;
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
      throw new Error('Google OAuth credentials not configured');
    }

    const auth = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
    this.gmail = google.gmail({ version: 'v1', auth });
    this.initialized = true;
  }

  async sendApprovalEmail(
    content: PlatformContent,
    imageUrl: string,
    approvalToken: string,
    toEmail: string
  ): Promise<void> {
    this.initialize();

    const baseUrl = `http://localhost:${env.PORT}`;
    const approveUrl = `${baseUrl}/api/approve/${approvalToken}`;
    const rejectUrl = `${baseUrl}/api/reject/${approvalToken}`;

    const postText = (content as any).schema?.post || 
                     (content as any).schema?.caption || 
                     'No text content';

    const hashtags = content.common_schema?.hashtags?.join(' ') || '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">🔥 Content Approval Required</h1>
      </div>
      
      <!-- Image -->
      ${imageUrl ? `<img src="${imageUrl}" style="width:100%;height:auto;display:block" alt="Generated image" />` : ''}
      
      <!-- Content -->
      <div style="padding:30px">
        <h2 style="color:#333;margin:0 0 15px">${content.root_schema?.name || 'New Post'}</h2>
        <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px">${postText}</p>
        
        ${hashtags ? `<p style="color:#667eea;font-size:14px;margin:0 0 20px"><strong>Hashtags:</strong> ${hashtags}</p>` : ''}
        
        <!-- Buttons -->
        <div style="text-align:center;margin-top:30px">
          <a href="${approveUrl}" style="display:inline-block;background:#4CAF50;color:white;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;margin:0 10px 10px 0">✅ Approve</a>
          <a href="${rejectUrl}" style="display:inline-block;background:#f44336;color:white;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;margin:0 0 10px 10px">❌ Reject</a>
        </div>
        
        <p style="color:#999;font-size:12px;text-align:center;margin-top:30px">
          This approval request expires in ${env.APPROVAL_TIMEOUT_MINUTES} minutes.
        </p>
      </div>
      
    </div>
  </div>
</body>
</html>`;

    const message = [
      `To: ${toEmail}`,
      'Subject: =?UTF-8?B?' + Buffer.from('🔔 Social Media Content Approval').toString('base64') + '?=',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].join('\r\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await this.gmail!.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    logger.info('Approval email sent', { to: toEmail, token: approvalToken.slice(0, 8) });
  }
}

export const gmailService = new GmailService();


