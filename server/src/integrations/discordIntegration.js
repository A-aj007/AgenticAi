const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  getAuthUrl(state = '') {
    const rootUrl = 'https://discord.com/api/oauth2/authorize';
    const options = {
      client_id: config.DISCORD.CLIENT_ID || 'dummy-discord-client-id',
      permissions: '2048', // SEND_MESSAGES
      scope: 'bot identify applications.commands',
      redirect_uri: config.DISCORD.REDIRECT_URI,
      response_type: 'code',
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!config.DISCORD.CLIENT_ID || !config.DISCORD.CLIENT_SECRET) {
      return {
        accessToken: `simulated_discord_token_${Date.now()}`,
        refreshToken: null,
        expiresIn: null,
        email: 'discord_bot@agentflow.ai',
        name: 'Agentflow Discord Bot',
        metadata: { guildId: '123456789012345678', channelId: '987654321098765432' },
      };
    }

    const response = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      new URLSearchParams({
        client_id: config.DISCORD.CLIENT_ID,
        client_secret: config.DISCORD.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.DISCORD.REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in, guild } = response.data;
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      email: `${guild?.name || 'discord'}@discord.com`,
      name: guild?.name || 'Discord Server',
      metadata: { guild },
    };
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { connected: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.accessToken.startsWith('simulated_')) {
      return { connected: true, guildName: 'Agentflow Community Discord' };
    }
    try {
      const res = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
        timeout: 5000,
      });
      return { connected: true, username: res.data.username };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    const { channelId, webhookUrl, message, content, embeds } = params;
    const text = message || content;

    if (!credentials || (!credentials.accessToken && !webhookUrl)) {
      throw new Error('INTEGRATION_NOT_CONNECTED: Discord credentials missing or disconnected');
    }

    if (actionName === 'send_message' || actionName === 'post_alert') {
      if (!text && !embeds) {
        throw new Error('MISSING_FIELDS: "message" or "embeds" is required for Discord message');
      }

      if ((credentials.accessToken && credentials.accessToken.startsWith('simulated_')) || (!credentials.accessToken && !webhookUrl)) {
        return {
          status: 'success',
          action: 'send_message',
          channelId: channelId || 'default-channel',
          message: text,
          id: `sim_discord_${Date.now()}`,
          provider: 'discord (simulated)',
        };
      }

      if (webhookUrl) {
        const res = await axios.post(webhookUrl, { content: text, embeds });
        return {
          status: 'success',
          action: 'send_message',
          webhook: true,
          statusText: res.statusText,
        };
      }

      const res = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { content: text, embeds },
        { headers: { Authorization: `Bot ${credentials.accessToken}` } }
      );

      return {
        status: 'success',
        action: 'send_message',
        id: res.data.id,
        channelId: res.data.channel_id,
        content: res.data.content,
      };
    }

    throw new Error(`Unsupported Discord action: ${actionName}`);
  }
}

module.exports = new DiscordIntegration();
