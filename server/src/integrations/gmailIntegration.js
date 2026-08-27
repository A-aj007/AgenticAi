const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  getAuthUrl(state = '') {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: config.GMAIL.REDIRECT_URI,
      client_id: config.GMAIL.CLIENT_ID || 'dummy-gmail-client-id',
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!config.GMAIL.CLIENT_ID || !config.GMAIL.CLIENT_SECRET) {
      // Demo / Simulated OAuth exchange for sandbox testing without credentials
      return {
        accessToken: `simulated_gmail_access_token_${Date.now()}`,
        refreshToken: `simulated_gmail_refresh_token_${Date.now()}`,
        expiresIn: 3600,
        email: 'operator@agentflow.ai',
        name: 'Agentflow Operator',
      };
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.GMAIL.CLIENT_ID,
      client_secret: config.GMAIL.CLIENT_SECRET,
      redirect_uri: config.GMAIL.REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Fetch user info
    let email = 'operator@agentflow.ai';
    let name = 'Gmail User';
    try {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      email = userRes.data.email;
      name = userRes.data.name;
    } catch (e) {
      console.warn('[GmailIntegration] User info fetch error:', e.message);
    }

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      email,
      name,
    };
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { connected: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    // If it's a simulated token, return healthy
    if (credentials.accessToken.startsWith('simulated_')) {
      return { connected: true, email: credentials.accountEmail || 'operator@agentflow.ai' };
    }
    try {
      const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
        timeout: 5000,
      });
      return { connected: true, email: res.data.emailAddress };
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        return { connected: false, error: 'AUTH_EXPIRED' };
      }
      return { connected: false, error: err.message };
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    const { to, subject, body, query, maxResults } = params;

    if (!credentials || !credentials.accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED: Gmail credentials missing or disconnected');
    }

    if (actionName === 'send_email') {
      if (!to || !subject) {
        throw new Error('MISSING_FIELDS: "to" and "subject" are required to send an email');
      }

      // Check if simulated
      if (credentials.accessToken.startsWith('simulated_')) {
        return {
          status: 'success',
          action: 'send_email',
          messageId: `sim_msg_${Date.now()}`,
          recipient: to,
          subject,
          snippet: (body || '').substring(0, 100),
          sentAt: new Date().toISOString(),
          provider: 'gmail (simulated)',
        };
      }

      // Real Gmail API send
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body || '',
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: encodedMessage },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        status: 'success',
        action: 'send_email',
        messageId: res.data.id,
        threadId: res.data.threadId,
        recipient: to,
        subject,
        sentAt: new Date().toISOString(),
      };
    } else if (actionName === 'read_emails') {
      if (credentials.accessToken.startsWith('simulated_')) {
        return {
          status: 'success',
          action: 'read_emails',
          messages: [
            {
              id: 'sim_email_1',
              subject: 'Invoice #1042 ready for processing',
              from: 'billing@partner.com',
              snippet: 'Please find attached the latest invoice details.',
              date: new Date().toISOString(),
            },
          ],
        };
      }

      const listRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
        params: { q: query || '', maxResults: maxResults || 5 },
      });

      return {
        status: 'success',
        action: 'read_emails',
        messages: listRes.data.messages || [],
        resultSizeEstimate: listRes.data.resultSizeEstimate || 0,
      };
    }

    throw new Error(`Unsupported Gmail action: ${actionName}`);
  }
}

module.exports = new GmailIntegration();
