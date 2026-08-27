const Integration = require('../models/Integration');
const BaseIntegration = require('../integrations/baseIntegration');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

class IntegrationService {
  constructor() {
    this.handlers = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
  }

  getHandler(provider) {
    const handler = this.handlers[provider];
    if (!handler) {
      throw new Error(`No integration handler registered for provider: ${provider}`);
    }
    return handler;
  }

  async getUserIntegrations(userId) {
    const docs = await Integration.find({ owner: userId }).lean();
    const providers = ['gmail', 'slack', 'discord', 'google-sheets'];

    return providers.map((provider) => {
      const existing = docs.find((d) => d.provider === provider);
      return {
        provider,
        isConnected: existing ? existing.isConnected : false,
        accountEmail: existing?.accountEmail || null,
        accountName: existing?.accountName || null,
        metadata: existing?.metadata || {},
        updatedAt: existing?.updatedAt || null,
        expiresAt: existing?.expiresAt || null,
      };
    });
  }

  async getHealthStatus(userId) {
    const integrations = await Integration.find({ owner: userId }).select('+encryptedAccessToken +encryptedRefreshToken');
    const results = {};

    for (const [provider, handler] of Object.entries(this.handlers)) {
      const record = integrations.find((i) => i.provider === provider);
      if (!record || !record.isConnected || !record.encryptedAccessToken) {
        results[provider] = {
          connected: false,
          status: 'DISCONNECTED',
          message: 'Integration not configured',
        };
        continue;
      }

      const accessToken = BaseIntegration.decrypt(record.encryptedAccessToken);
      try {
        const testRes = await handler.testConnection({
          accessToken,
          accountEmail: record.accountEmail,
        });

        results[provider] = {
          connected: testRes.connected,
          status: testRes.connected ? 'HEALTHY' : (testRes.error || 'ERROR'),
          account: record.accountEmail || record.accountName,
          details: testRes,
        };
      } catch (err) {
        results[provider] = {
          connected: false,
          status: 'ERROR',
          message: err.message,
        };
      }
    }

    return results;
  }

  async getOAuthStartUrl(provider, userId) {
    const handler = this.getHandler(provider);
    const state = JSON.stringify({ userId, provider, timestamp: Date.now() });
    const encodedState = Buffer.from(state).toString('base64');
    return handler.getAuthUrl(encodedState);
  }

  async handleOAuthCallback(provider, code, rawState) {
    const handler = this.getHandler(provider);
    let userId;
    try {
      const parsedState = JSON.parse(Buffer.from(rawState, 'base64').toString('utf8'));
      userId = parsedState.userId;
    } catch (e) {
      throw new Error('Invalid OAuth state parameter');
    }

    const tokens = await handler.exchangeCodeForTokens(code);
    const encryptedAccess = BaseIntegration.encrypt(tokens.accessToken);
    const encryptedRefresh = BaseIntegration.encrypt(tokens.refreshToken);

    const expiresAt = tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null;

    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: true,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        accountEmail: tokens.email || null,
        accountName: tokens.name || null,
        metadata: tokens.metadata || {},
        expiresAt,
      },
      { upsert: true, new: true }
    );

    return {
      provider,
      isConnected: true,
      accountEmail: integration.accountEmail,
      accountName: integration.accountName,
    };
  }

  async manualConfigure(userId, { provider, accessToken, refreshToken, accountEmail, accountName, metadata = {} }) {
    this.getHandler(provider); // validate provider exists

    const encryptedAccess = BaseIntegration.encrypt(accessToken);
    const encryptedRefresh = BaseIntegration.encrypt(refreshToken);

    const integration = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: true,
        encryptedAccessToken: encryptedAccess,
        encryptedRefreshToken: encryptedRefresh,
        accountEmail: accountEmail || 'manual_configured@agentflow.ai',
        accountName: accountName || `${provider} Account`,
        metadata,
      },
      { upsert: true, new: true }
    );

    return {
      provider,
      isConnected: true,
      accountEmail: integration.accountEmail,
      accountName: integration.accountName,
    };
  }

  async disconnect(userId, provider) {
    await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        isConnected: false,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
      }
    );
    return { provider, isConnected: false };
  }

  async executeActionForUser(userId, provider, actionName, params = {}) {
    const record = await Integration.findOne({ owner: userId, provider }).select('+encryptedAccessToken +encryptedRefreshToken');
    
    // Auto-create simulated credentials if not connected so local executions succeed seamlessly
    let accessToken = null;
    let refreshToken = null;
    let accountEmail = 'operator@agentflow.ai';

    if (record && record.isConnected && record.encryptedAccessToken) {
      accessToken = BaseIntegration.decrypt(record.encryptedAccessToken);
      refreshToken = BaseIntegration.decrypt(record.encryptedRefreshToken);
      accountEmail = record.accountEmail;
    } else {
      // Create a simulated fallback token for zero-config offline execution
      accessToken = `simulated_${provider}_access_token_${Date.now()}`;
    }

    const handler = this.getHandler(provider);
    return handler.executeAction(actionName, params, {
      accessToken,
      refreshToken,
      accountEmail,
    });
  }
}

module.exports = new IntegrationService();
