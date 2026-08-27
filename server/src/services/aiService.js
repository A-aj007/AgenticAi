const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

class AIService {
  /**
   * Main entry point for prompt-to-workflow generation
   */
  async generateWorkflowFromPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required for workflow generation');
    }

    const cleanPrompt = prompt.trim();

    // 1. Try OpenRouter if key is present
    if (config.OPENROUTER_API_KEY) {
      try {
        console.log('[AIService] Generating workflow via OpenRouter API...');
        const result = await this.generateViaOpenRouter(cleanPrompt);
        if (result && result.nodes && result.edges) {
          result.generatedBy = 'openrouter';
          return result;
        }
      } catch (err) {
        console.warn('[AIService] OpenRouter generation failed, falling back to Gemini:', err.message);
      }
    }

    // 2. Try Google Gemini if key is present
    if (config.GEMINI_API_KEY) {
      try {
        console.log('[AIService] Generating workflow via Google Gemini...');
        const result = await this.generateViaGemini(cleanPrompt);
        if (result && result.nodes && result.edges) {
          result.generatedBy = 'gemini';
          return result;
        }
      } catch (err) {
        console.warn('[AIService] Gemini generation failed, falling back to Deterministic Builder:', err.message);
      }
    }

    // 3. Fallback to Deterministic Rule-Based Builder
    console.log('[AIService] Generating workflow via Deterministic Rule Engine...');
    const result = this.generateDeterministicWorkflow(cleanPrompt);
    result.generatedBy = 'deterministic-engine';
    return result;
  }

  getSystemPrompt() {
    return `You are an expert AI workflow architect for the Agentflow_AI platform.
Your job is to convert natural language automation requests into a structured JSON workflow graph compatible with React Flow.

Node Schema:
- id: unique string (e.g. "node-1", "node-2")
- type: 'trigger' | 'ai_action' | 'integration' | 'condition' | 'logic'
- position: { x: number, y: number } (layout horizontally from left to right, spacing x by 280, y around 100-300)
- data:
  - label: string (e.g. "Inbound Webhook", "Extract Invoice Data", "Send Slack Alert")
  - category: 'trigger' | 'ai' | 'integration' | 'logic'
  - provider: 'webhook' | 'schedule' | 'manual' | 'gmail' | 'slack' | 'discord' | 'google-sheets' | 'ai-model' | 'condition'
  - action: string (e.g. 'send_email', 'post_message', 'send_message', 'append_row', 'classify', 'summarize')
  - config: key-value parameters needed for execution (e.g. { channel: "#ops-alerts", message: "New invoice received", to: "finance@company.com", subject: "Invoice alert" })

Edge Schema:
- id: string (e.g. "e1-2")
- source: string (source node id)
- target: string (target node id)
- animated: boolean (true)
- label: optional string

You MUST output ONLY a valid JSON object without markdown fences, in this exact format:
{
  "name": "Workflow Name",
  "description": "Brief description of the workflow",
  "triggerType": "webhook" | "manual" | "schedule" | "email_inbound",
  "tags": ["Finance", "Notifications"],
  "nodes": [...],
  "edges": [...]
}`;
  }

  async generateViaOpenRouter(prompt) {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: config.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: `Generate an automation workflow for this prompt: "${prompt}"` },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://agentflow.ai',
          'X-Title': 'Agentflow AI',
        },
        timeout: 20000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || '';
    return this.parseJSONResponse(content);
  }

  async generateViaGemini(prompt) {
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || 'gemini-1.5-pro' });
    
    const result = await model.generateContent([
      this.getSystemPrompt(),
      `Generate an automation workflow for this prompt: "${prompt}"`,
    ]);

    const content = result.response.text();
    return this.parseJSONResponse(content);
  }

  parseJSONResponse(rawText) {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(clean);
  }

  /**
   * Deterministic Rule-Based Builder for high quality offline/zero-config graph generation
   */
  generateDeterministicWorkflow(prompt) {
    const p = prompt.toLowerCase();
    
    // Pattern 1: Invoice / Receipt / Finance Routing
    if (p.includes('invoice') || p.includes('receipt') || p.includes('billing') || p.includes('finance')) {
      return {
        name: 'Automated Invoice Processing & Notification',
        description: 'Extracts invoice metadata, logs row to Google Sheets, and sends Slack & Email alerts to finance team.',
        triggerType: 'webhook',
        tags: ['Finance', 'Invoice', 'AI Automation'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 50, y: 180 },
            data: {
              label: 'Inbound Invoice Webhook',
              category: 'trigger',
              provider: 'webhook',
              action: 'receive_payload',
              config: { endpoint: '/api/v1/invoices', method: 'POST' },
            },
          },
          {
            id: 'node-2',
            type: 'ai_action',
            position: { x: 330, y: 180 },
            data: {
              label: 'Extract & Validate Invoice Data',
              category: 'ai',
              provider: 'ai-model',
              action: 'extract_entities',
              config: { model: 'claude-3.5-sonnet', fields: 'vendor, amount, tax, dueDate, items' },
            },
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 610, y: 100 },
            data: {
              label: 'Append to Finance Ledger',
              category: 'integration',
              provider: 'google-sheets',
              action: 'append_row',
              config: { spreadsheetId: 'finance_ledger_2026', range: 'Invoices!A1' },
            },
          },
          {
            id: 'node-4',
            type: 'integration',
            position: { x: 610, y: 270 },
            data: {
              label: 'Alert Finance Slack Channel',
              category: 'integration',
              provider: 'slack',
              action: 'post_message',
              config: { channel: '#finance-ops', message: 'New invoice processed: ${{nodes.node-2.amount}} from {{nodes.node-2.vendor}}' },
            },
          },
          {
            id: 'node-5',
            type: 'integration',
            position: { x: 890, y: 180 },
            data: {
              label: 'Send Confirmation Email',
              category: 'integration',
              provider: 'gmail',
              action: 'send_email',
              config: { to: 'approvals@company.com', subject: 'Invoice Payment Authorization Required' },
            },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e2-4', source: 'node-2', target: 'node-4', animated: true },
          { id: 'e3-5', source: 'node-3', target: 'node-5', animated: true },
          { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true },
        ],
      };
    }

    // Pattern 2: Support Ticket / Customer Feedback / Sentiment Analysis
    if (p.includes('support') || p.includes('ticket') || p.includes('sentiment') || p.includes('feedback') || p.includes('customer')) {
      return {
        name: 'Customer Feedback AI Sentiment & Escalation',
        description: 'Analyzes inbound customer inquiries, classifies urgency, and notifies Discord/Slack teams.',
        triggerType: 'webhook',
        tags: ['Support', 'Sentiment', 'AI'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 50, y: 180 },
            data: {
              label: 'New Customer Ticket',
              category: 'trigger',
              provider: 'webhook',
              action: 'receive_payload',
              config: { event: 'ticket.created' },
            },
          },
          {
            id: 'node-2',
            type: 'ai_action',
            position: { x: 330, y: 180 },
            data: {
              label: 'AI Sentiment & Urgency Analysis',
              category: 'ai',
              provider: 'ai-model',
              action: 'classify',
              config: { categories: 'urgent_bug, feature_request, general_inquiry, billing' },
            },
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 610, y: 180 },
            data: {
              label: 'Post to Discord Ops',
              category: 'integration',
              provider: 'discord',
              action: 'send_message',
              config: { channelId: 'support-alerts', message: '⚠️ Urgency Ticket: {{nodes.node-2.summary}}' },
            },
          },
          {
            id: 'node-4',
            type: 'integration',
            position: { x: 890, y: 180 },
            data: {
              label: 'Log Ticket to Google Sheets',
              category: 'integration',
              provider: 'google-sheets',
              action: 'append_row',
              config: { spreadsheetId: 'support_log_2026', range: 'Tickets!A1' },
            },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
        ],
      };
    }

    // Pattern 3: Email / Lead Generation / Outreach
    if (p.includes('email') || p.includes('lead') || p.includes('outreach') || p.includes('marketing') || p.includes('gmail')) {
      return {
        name: 'AI Lead Qualification & Email Outreach Pipeline',
        description: 'Qualifies new inbound leads with LLM, drafts customized response, and sends via Gmail.',
        triggerType: 'schedule',
        tags: ['Marketing', 'Leads', 'Gmail'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 50, y: 180 },
            data: {
              label: 'Lead Capture Schedule',
              category: 'trigger',
              provider: 'schedule',
              action: 'run_cron',
              config: { cron: '0 9 * * 1-5' },
            },
          },
          {
            id: 'node-2',
            type: 'ai_action',
            position: { x: 330, y: 180 },
            data: {
              label: 'AI Lead Enrichment & Persona Match',
              category: 'ai',
              provider: 'ai-model',
              action: 'summarize',
              config: { prompt: 'Score lead propensity and craft personalized introductory message' },
            },
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 610, y: 180 },
            data: {
              label: 'Send Personalized Gmail',
              category: 'integration',
              provider: 'gmail',
              action: 'send_email',
              config: { to: '{{nodes.node-2.leadEmail}}', subject: 'Welcome to Agentflow - Let us scale your workflows' },
            },
          },
          {
            id: 'node-4',
            type: 'integration',
            position: { x: 890, y: 180 },
            data: {
              label: 'Notify Slack Growth Team',
              category: 'integration',
              provider: 'slack',
              action: 'post_message',
              config: { channel: '#growth-deals', message: 'New qualified lead emailed: {{nodes.node-2.leadName}}' },
            },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
        ],
      };
    }

    // Default Generalized Multi-Agent Workflow
    return {
      name: 'Agentic Operations Automation: ' + (prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt),
      description: `Automated agentic workflow generated for: "${prompt}"`,
      triggerType: 'manual',
      tags: ['Operations', 'Agentic', 'Multi-Agent'],
      nodes: [
        {
          id: 'node-1',
          type: 'trigger',
          position: { x: 50, y: 180 },
          data: {
            label: 'Manual / API Trigger',
            category: 'trigger',
            provider: 'manual',
            action: 'start_run',
            config: { initialPayload: { prompt } },
          },
        },
        {
          id: 'node-2',
          type: 'ai_action',
          position: { x: 330, y: 180 },
          data: {
            label: 'AI Reasoning & Data Transformation',
            category: 'ai',
            provider: 'ai-model',
            action: 'summarize',
            config: { instruction: `Process and extract relevant facts for: ${prompt}` },
          },
        },
        {
          id: 'node-3',
          type: 'integration',
          position: { x: 610, y: 100 },
          data: {
            label: 'Slack Notification Broadcast',
            category: 'integration',
            provider: 'slack',
            action: 'post_message',
            config: { channel: '#ops-stream', message: `Workflow step completed: ${prompt}` },
          },
        },
        {
          id: 'node-4',
          type: 'integration',
          position: { x: 610, y: 270 },
          data: {
            label: 'Log Results to Google Sheets',
            category: 'integration',
            provider: 'google-sheets',
            action: 'append_row',
            config: { spreadsheetId: 'agentflow_audit_log', range: 'Logs!A1' },
          },
        },
        {
          id: 'node-5',
          type: 'integration',
          position: { x: 890, y: 180 },
          data: {
            label: 'Email Summary to Operator',
            category: 'integration',
            provider: 'gmail',
            action: 'send_email',
            config: { to: 'operator@agentflow.ai', subject: 'Agentflow Execution Summary' },
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
        { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
        { id: 'e2-4', source: 'node-2', target: 'node-4', animated: true },
        { id: 'e3-5', source: 'node-3', target: 'node-5', animated: true },
        { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true },
      ],
    };
  }
}

module.exports = new AIService();
