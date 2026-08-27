const BaseIntegration = require('./baseIntegration');
const axios = require('axios');
const config = require('../config/env');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  getAuthUrl(state = '') {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: config.GOOGLE_SHEETS.REDIRECT_URI,
      client_id: config.GOOGLE_SHEETS.CLIENT_ID || 'dummy-sheets-client-id',
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      state,
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async exchangeCodeForTokens(code) {
    if (!config.GOOGLE_SHEETS.CLIENT_ID || !config.GOOGLE_SHEETS.CLIENT_SECRET) {
      return {
        accessToken: `simulated_sheets_access_token_${Date.now()}`,
        refreshToken: `simulated_sheets_refresh_token_${Date.now()}`,
        expiresIn: 3600,
        email: 'sheets_operator@agentflow.ai',
        name: 'Google Sheets Account',
      };
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.GOOGLE_SHEETS.CLIENT_ID,
      client_secret: config.GOOGLE_SHEETS.CLIENT_SECRET,
      redirect_uri: config.GOOGLE_SHEETS.REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;
    let email = 'operator@agentflow.ai';
    try {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      email = userRes.data.email;
    } catch (e) {
      console.warn('[GoogleSheetsIntegration] User info fetch error:', e.message);
    }

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      email,
      name: 'Google Sheets User',
    };
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { connected: false, error: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.accessToken.startsWith('simulated_')) {
      return { connected: true, email: credentials.accountEmail || 'sheets_operator@agentflow.ai' };
    }
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
        timeout: 5000,
      });
      return { connected: true, email: res.data.email };
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        return { connected: false, error: 'AUTH_EXPIRED' };
      }
      return { connected: false, error: err.message };
    }
  }

  async executeAction(actionName, params = {}, credentials = {}) {
    const { spreadsheetId, range = 'Sheet1!A1', values = [], rowData } = params;

    if (!credentials || !credentials.accessToken) {
      throw new Error('INTEGRATION_NOT_CONNECTED: Google Sheets credentials missing or disconnected');
    }

    if (actionName === 'append_row' || actionName === 'append_data') {
      if (!spreadsheetId) {
        throw new Error('MISSING_FIELDS: "spreadsheetId" is required to append row to Google Sheets');
      }

      const rowsToAppend = values.length > 0 ? values : rowData ? [Object.values(rowData)] : [['Executed at ' + new Date().toISOString()]];

      if (credentials.accessToken.startsWith('simulated_')) {
        return {
          status: 'success',
          action: 'append_row',
          spreadsheetId,
          tableRange: range,
          updates: {
            updatedRows: rowsToAppend.length,
            updatedColumns: rowsToAppend[0]?.length || 1,
            updatedCells: rowsToAppend.length * (rowsToAppend[0]?.length || 1),
          },
          provider: 'google-sheets (simulated)',
        };
      }

      const res = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        { values: rowsToAppend },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        status: 'success',
        action: 'append_row',
        spreadsheetId,
        updates: res.data.updates,
      };
    } else if (actionName === 'read_range') {
      if (!spreadsheetId) {
        throw new Error('MISSING_FIELDS: "spreadsheetId" is required to read Google Sheets');
      }

      if (credentials.accessToken.startsWith('simulated_')) {
        return {
          status: 'success',
          action: 'read_range',
          range,
          values: [
            ['Timestamp', 'User', 'Status', 'Amount'],
            [new Date().toISOString(), 'customer@example.com', 'Paid', '$450.00'],
          ],
        };
      }

      const res = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        status: 'success',
        action: 'read_range',
        range: res.data.range,
        values: res.data.values || [],
      };
    }

    throw new Error(`Unsupported Google Sheets action: ${actionName}`);
  }
}

module.exports = new GoogleSheetsIntegration();
