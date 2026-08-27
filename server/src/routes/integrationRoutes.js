const express = require('express');
const { body, validationResult } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// OAuth callback does not have authorization header because the browser redirects there directly
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback);
router.get('/oauth/error', integrationController.oauthError);

// Protected routes
router.use(authMiddleware);

router.get('/', integrationController.list);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);

router.post(
  '/',
  [
    body('provider').isIn(['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini']).withMessage('Valid provider required'),
    body('accessToken').notEmpty().withMessage('Access token or credential is required'),
  ],
  validateRequest,
  integrationController.manualConfigure
);

router.delete('/:provider', integrationController.disconnect);

module.exports = router;
