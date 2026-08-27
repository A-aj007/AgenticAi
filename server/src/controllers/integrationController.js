const integrationService = require('../services/integrationService');
const config = require('../config/env');

class IntegrationController {
  async list(req, res, next) {
    try {
      const integrations = await integrationService.getUserIntegrations(req.user.id);
      res.status(200).json({
        success: true,
        data: integrations,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req, res, next) {
    try {
      const status = await integrationService.getHealthStatus(req.user.id);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const url = await integrationService.getOAuthStartUrl(provider, req.user.id);
      res.status(200).json({
        success: true,
        data: { authUrl: url },
      });
    } catch (err) {
      next(err);
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${config.CLIENT_URL}/integrations?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        return res.redirect(`${config.CLIENT_URL}/integrations?error=No+authorization+code+received`);
      }

      await integrationService.handleOAuthCallback(provider, code, state);
      res.redirect(`${config.CLIENT_URL}/integrations?success=${encodeURIComponent(provider)}`);
    } catch (err) {
      res.redirect(`${config.CLIENT_URL}/integrations?error=${encodeURIComponent(err.message)}`);
    }
  }

  async manualConfigure(req, res, next) {
    try {
      const result = await integrationService.manualConfigure(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: `${req.body.provider} integration configured successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await integrationService.disconnect(req.user.id, provider);
      res.status(200).json({
        success: true,
        message: `${provider} disconnected successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async oauthError(req, res) {
    res.status(400).json({
      success: false,
      error: req.query.message || 'OAuth authorization failed',
    });
  }
}

module.exports = new IntegrationController();
