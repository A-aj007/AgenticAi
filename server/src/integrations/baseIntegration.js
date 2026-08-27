const crypto = require('crypto');
const config = require('../config/env');

class BaseIntegration {
  constructor(name) {
    this.name = name;
  }

  /**
   * Standard encryption using AES-256-CBC with CREDENTIAL_ENCRYPTION_KEY
   */
  static encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    // Ensure key is 32 bytes (256 bits)
    const key = crypto.createHash('sha256').update(String(config.CREDENTIAL_ENCRYPTION_KEY)).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Standard decryption using AES-256-CBC
   */
  static decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.createHash('sha256').update(String(config.CREDENTIAL_ENCRYPTION_KEY)).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error(`[BaseIntegration] Decryption error for ${this.name || 'integration'}:`, err.message);
      return null;
    }
  }

  /**
   * Test if the provided credentials or tokens are valid
   */
  async testConnection(credentials) {
    throw new Error(`testConnection() not implemented for ${this.name}`);
  }

  /**
   * Execute an integration action (e.g., 'send_email', 'post_message')
   */
  async executeAction(actionName, params, credentials) {
    throw new Error(`executeAction() not implemented for ${this.name}`);
  }

  /**
   * Refresh OAuth token if expired
   */
  async refreshAuth(refreshToken) {
    throw new Error(`refreshAuth() not implemented for ${this.name}`);
  }
}

module.exports = BaseIntegration;
