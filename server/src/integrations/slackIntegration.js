const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  getAuthUrl(state = '') {
    const rootUrl = 'https://slack.com/oauth/v2/authorize';
    const options = {
      client_id: config.SLACK.CLIENT_ID || 'dummy-slack-client-id',
      scope: 'chat:write,channels:read,channels:history,incoming-webhook',
      redirect_uri: config.SLACK.REDIRECT_URI,
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!config.SLACK.CLIENT_ID || !config.SLACK.CLIENT_SECRET) {
      return {
        accessToken: `simulated_slack_bot_token_${Date.now()}`,
        refreshToken: null,
        expiresIn: null,
        email: 'slack_bot@agentflow.ai',
        name: 'Agentflow Workspace',
        metadata: { teamName: 'Agentflow Dev', teamId: 'T12345678' },
      };
    }

    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        code,
        client_id: config.SLACK.CLIENT_ID,
        client_secret: config.SLACK.CLIENT_SECRET,
        redirect_uri: config.SLACK.REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${response.data.error}`);
    }

    const { access_token, team, incoming_webhook } = response.data;
    return {
      accessToken: access_token,
      refreshToken: null,
      expiresIn: null,
      email: `${team?.name || 'slack'}@workspace.com`,
      name: team?.name || 'Slack Team',
      metadata: { team, incoming_webhook },
    };
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { connected: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.accessToken.startsWith('simulated_')) {
      return { connected: true, teamName: 'Agentflow Sandbox Workspace' };
    }
    try {
      const res = await axios.post(
        'https://slack.com/api/auth.test',
        {},
        { headers: { Authorization: `Bearer ${credentials.accessToken}` }, timeout: 5000 }
      );
      if (res.data.ok) {
        return { connected: true, team: res.data.team, user: res.data.user };
      }
      return { connected: false, error: res.data.error || 'AUTH_EXPIRED' };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    const { channel = '#general', message, text, blocks } = params;
    const content = message || text;

    if (!credentials || !credentials.accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED: Slack credentials missing or disconnected');
    }

    if (actionName === 'post_message' || actionName === 'send_notification') {
      if (!content && !blocks) {
        throw new Error('MISSING_FIELDS: "message" or "text" is required for Slack notification');
      }

      if (credentials.accessToken.startsWith('simulated_')) {
        return {
          status: 'success',
          action: 'post_message',
          channel,
          message: content,
          timestamp: (Date.now() / 1000).toFixed(6),
          provider: 'slack (simulated)',
        };
      }

      const res = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text: content, blocks },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      if (!res.data.ok) {
        throw new Error(`Slack API error: ${res.data.error}`);
      }

      return {
        status: 'success',
        action: 'post_message',
        channel: res.data.channel,
        ts: res.data.ts,
        message: content,
      };
    }

    throw new Error(`Unsupported Slack action: ${actionName}`);
  }
}

module.exports = new SlackIntegration();
