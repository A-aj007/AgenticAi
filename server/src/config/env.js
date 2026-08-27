const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Try loading server/.env first, then fallback to root .env
const serverEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const config = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'agentflow_default_jwt_secret_dev_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  
  // Database & Cache
  MONGODB_URI: (process.env.MONGODB_URI || '').trim(),
  REDIS_URL: (process.env.REDIS_URL || '').trim(),
  
  // AI Keys
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  
  // OAuth Integrations
  GMAIL: {
    CLIENT_ID: process.env.GMAIL_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5001/api/integrations/oauth/gmail/callback',
  },
  SLACK: {
    CLIENT_ID: process.env.SLACK_CLIENT_ID || '',
    CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.SLACK_REDIRECT_URI || 'http://localhost:5001/api/integrations/oauth/slack/callback',
  },
  DISCORD: {
    CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
    CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5001/api/integrations/oauth/discord/callback',
  },
  GOOGLE_SHEETS: {
    CLIENT_ID: process.env.GOOGLE_SHEETS_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_SHEETS_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.GOOGLE_SHEETS_REDIRECT_URI || 'http://localhost:5001/api/integrations/oauth/google-sheets/callback',
  },
};

module.exports = config;
