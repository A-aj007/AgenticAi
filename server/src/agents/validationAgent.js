/**
 * Validation Agent
 * Verifies required output fields and schema integrity.
 */
class ValidationAgent {
  constructor() {
    this.name = 'validation';
  }

  validate(node, output) {
    if (!output) {
      return {
        isValid: false,
        errorType: 'MISSING_FIELDS',
        message: `Node ${node.id} (${node.data?.label || node.type}) yielded an empty or null output`,
      };
    }

    if (output.status === 'error' || output.error) {
      return {
        isValid: false,
        errorType: output.errorType || 'API_FAILURE',
        message: output.error || output.message || `Node ${node.id} returned an execution error`,
      };
    }

    const { type, data = {} } = node;
    const action = data.action;

    // Specific validation rules based on node action
    if (action === 'send_email') {
      if (!output.messageId && !output.recipient) {
        return {
          isValid: false,
          errorType: 'MISSING_FIELDS',
          message: 'Email action missing confirmation messageId or recipient in output',
        };
      }
    } else if (action === 'post_message' || action === 'send_message') {
      if (!output.status || output.status !== 'success') {
        return {
          isValid: false,
          errorType: 'API_FAILURE',
          message: 'Chat notification output does not confirm successful delivery',
        };
      }
    } else if (action === 'append_row') {
      if (!output.updates && !output.tableRange) {
        return {
          isValid: false,
          errorType: 'MISSING_FIELDS',
          message: 'Google Sheets append operation did not return update confirmation metadata',
        };
      }
    }

    return {
      isValid: true,
      validatedFieldsCount: Object.keys(output).length,
      message: `Node ${node.id} output successfully validated.`,
    };
  }
}

module.exports = new ValidationAgent();
