const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedAccessToken: {
      type: String,
      default: null,
      select: false, // Don't return encrypted token by default in API
    },
    encryptedRefreshToken: {
      type: String,
      default: null,
      select: false,
    },
    accountEmail: {
      type: String,
      default: null,
    },
    accountName: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for user + provider
IntegrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
