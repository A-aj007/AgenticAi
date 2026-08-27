/**
 * Recovery Agent
 * Classifies runtime failures into standard taxonomy and chooses recovery strategy (retry_with_backoff vs escalate).
 */
class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
  }

  classifyError(error) {
    const msg = (error?.message || error?.toString() || '').toUpperCase();

    if (msg.includes('AUTH_EXPIRED') || msg.includes('UNAUTHORIZED') || msg.includes('TOKEN') || msg.includes('401')) {
      return 'AUTH_EXPIRED';
    }
    if (msg.includes('RATE_LIMIT') || msg.includes('429') || msg.includes('QUOTA')) {
      return 'RATE_LIMIT';
    }
    if (msg.includes('MISSING_FIELDS') || msg.includes('REQUIRED') || msg.includes('VALIDATION')) {
      return 'MISSING_FIELDS';
    }
    if (msg.includes('TIMEOUT') || msg.includes('ECONNRESET') || msg.includes('NETWORK') || msg.includes('503')) {
      return 'TRANSIENT';
    }
    if (msg.includes('INTEGRATION_NOT_CONNECTED')) {
      return 'AUTH_EXPIRED';
    }

    return 'API_FAILURE';
  }

  decideRecovery(classification, currentRetryCount, maxRetries = 3) {
    // Non-retryable errors
    if (classification === 'AUTH_EXPIRED' || classification === 'MISSING_FIELDS') {
      return {
        strategy: 'escalate',
        reason: `Failure classification ${classification} requires operator intervention or credential renewal.`,
        retryable: false,
        backoffDelayMs: 0,
      };
    }

    // Check if retry limit reached
    if (currentRetryCount >= maxRetries) {
      return {
        strategy: 'escalate',
        reason: `Maximum retry attempts (${maxRetries}) exhausted for error ${classification}.`,
        retryable: false,
        backoffDelayMs: 0,
      };
    }

    // Calculate exponential backoff (e.g. 1000ms, 2000ms, 4000ms...)
    const baseDelay = classification === 'RATE_LIMIT' ? 3000 : 1000;
    const backoffDelayMs = baseDelay * Math.pow(2, currentRetryCount);

    return {
      strategy: 'retry_with_backoff',
      retryCount: currentRetryCount + 1,
      backoffDelayMs,
      retryable: true,
      reason: `Temporary ${classification} error detected. Retrying attempt ${currentRetryCount + 1}/${maxRetries} after ${backoffDelayMs}ms delay.`,
    };
  }
}

module.exports = new RecoveryAgent();
