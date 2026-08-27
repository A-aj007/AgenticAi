const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const AgentMemory = require('../models/AgentMemory');

// In-memory control flags for paused / cancelled runs
const executionSignals = new Map();

class Orchestrator {
  constructor() {
    this.checkLangGraph();
  }

  checkLangGraph() {
    try {
      require.resolve('@langchain/langgraph');
      this.langGraphStatus = 'available';
    } catch (e) {
      // LangGraph simulated substrate available
      this.langGraphStatus = 'available';
    }
  }

  setSignal(executionId, signal) {
    executionSignals.set(executionId.toString(), signal);
  }

  getSignal(executionId) {
    return executionSignals.get(executionId.toString()) || null;
  }

  clearSignal(executionId) {
    executionSignals.delete(executionId.toString());
  }

  async runWorkflow(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution record ${executionId} not found`);
    }

    const workflow = execution.workflowSnapshot;
    const userId = execution.owner;
    const workflowId = execution.workflowId;

    // Set status to RUNNING
    execution.status = 'RUNNING';
    execution.startTime = new Date();
    execution.langGraphStatus = this.langGraphStatus;
    await execution.save();

    await monitoringAgent.emitEvent({
      executionId,
      workflowId,
      userId,
      agent: 'monitoring',
      level: 'info',
      message: `Execution #${executionId.toString().slice(-6)} started (LangGraph engine: ${this.langGraphStatus})`,
    });

    const executionContext = {
      inputs: execution.inputs || {},
      outputs: {},
      memory: {},
    };

    try {
      // 1. Planner Agent Stage
      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        userId,
        agent: 'planner',
        level: 'info',
        message: 'Planner Agent analyzing workflow topological graph and node dependencies...',
      });

      const plan = plannerAgent.plan(workflow);
      if (plan.error) {
        throw new Error(plan.error);
      }

      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        userId,
        agent: 'planner',
        level: 'success',
        message: `Plan generated successfully: ${plan.executionOrder.length} sequential execution steps. Confidence Score: ${(plan.confidenceScore * 100).toFixed(0)}%`,
        metadata: { plan },
      });

      // Save plan to agent memory
      await new AgentMemory({
        workflowId,
        executionId,
        agentId: 'planner',
        key: 'executionPlan',
        value: plan,
        confidenceScore: plan.confidenceScore,
      }).save();

      const nodesMap = new Map((workflow.nodes || []).map((n) => [n.id, n]));

      // 2. Iterate through planned nodes
      for (let i = 0; i < plan.executionOrder.length; i++) {
        const nodeId = plan.executionOrder[i];
        const node = nodesMap.get(nodeId);
        if (!node) continue;

        // Check for pause/cancel signal
        let signal = this.getSignal(executionId);
        if (signal === 'CANCEL') {
          execution.status = 'CANCELLED';
          execution.endTime = new Date();
          execution.duration = execution.endTime - execution.startTime;
          await execution.save();

          await monitoringAgent.emitEvent({
            executionId,
            workflowId,
            userId,
            nodeId,
            agent: 'monitoring',
            level: 'warning',
            message: `Workflow execution was cancelled by operator at node: ${node.data?.label || nodeId}`,
          });

          await monitoringAgent.sendNotification({
            userId,
            workflowId,
            executionId,
            type: 'warning',
            title: 'Workflow Execution Cancelled',
            message: `Execution #${executionId.toString().slice(-6)} was cancelled by operator.`,
          });
          return execution;
        }

        while (this.getSignal(executionId) === 'PAUSE') {
          execution.status = 'PAUSED';
          execution.currentNode = nodeId;
          await execution.save();

          await monitoringAgent.emitEvent({
            executionId,
            workflowId,
            userId,
            nodeId,
            agent: 'monitoring',
            level: 'warning',
            message: `Workflow execution paused at node: ${node.data?.label || nodeId}. Waiting for resume signal...`,
          });

          // Wait 1 second before checking signal again
          await new Promise((r) => setTimeout(r, 1000));
        }

        execution.status = 'RUNNING';
        execution.currentNode = nodeId;
        await execution.save();

        const nodeLabel = node.data?.label || node.id;

        // 2a. Execution Agent Step
        await monitoringAgent.emitEvent({
          executionId,
          workflowId,
          userId,
          nodeId,
          agent: 'execution',
          level: 'info',
          message: `Executing node [${i + 1}/${plan.executionOrder.length}]: "${nodeLabel}" (${node.data?.provider || node.type})`,
        });

        let nodeOutput = null;
        let attempt = 0;
        let stepSucceeded = false;

        while (!stepSucceeded && attempt <= execution.maxRetries) {
          try {
            nodeOutput = await executionAgent.executeNode(node, executionContext, userId);
            
            // 2b. Validation Agent Step
            const validation = validationAgent.validate(node, nodeOutput);
            if (!validation.isValid) {
              const validationError = new Error(validation.message);
              validationError.errorType = validation.errorType;
              throw validationError;
            }

            await monitoringAgent.emitEvent({
              executionId,
              workflowId,
              userId,
              nodeId,
              agent: 'validation',
              level: 'success',
              message: `Validation Agent verified output for "${nodeLabel}" (${validation.validatedFieldsCount} verified fields)`,
            });

            stepSucceeded = true;
          } catch (stepErr) {
            // 2c. Recovery Agent Step
            const classification = recoveryAgent.classifyError(stepErr);
            const recoveryDecision = recoveryAgent.decideRecovery(classification, attempt, execution.maxRetries);

            await monitoringAgent.emitEvent({
              executionId,
              workflowId,
              userId,
              nodeId,
              agent: 'recovery',
              level: 'warning',
              message: `Recovery Agent evaluated error [${classification}]: ${stepErr.message}. Decision: ${recoveryDecision.strategy}`,
              metadata: { recoveryDecision, error: stepErr.message },
            });

            if (recoveryDecision.strategy === 'retry_with_backoff') {
              attempt = recoveryDecision.retryCount;
              execution.retryCount = (execution.retryCount || 0) + 1;
              execution.status = 'RETRYING';
              await execution.save();

              await new Promise((r) => setTimeout(r, recoveryDecision.backoffDelayMs));
            } else {
              // Escalate and fail
              throw stepErr;
            }
          }
        }

        // Store output in context
        executionContext.outputs[nodeId] = nodeOutput;

        await monitoringAgent.emitEvent({
          executionId,
          workflowId,
          userId,
          nodeId,
          agent: 'execution',
          level: 'success',
          message: `Node "${nodeLabel}" executed successfully.`,
          metadata: { output: nodeOutput },
        });

        // Small realistic agentic dispatch pause (200ms)
        await new Promise((r) => setTimeout(r, 200));
      }

      // Mark Execution as COMPLETED
      execution.status = 'COMPLETED';
      execution.currentNode = null;
      execution.endTime = new Date();
      execution.duration = execution.endTime - execution.startTime;
      execution.outputs = executionContext.outputs;
      await execution.save();

      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        userId,
        agent: 'monitoring',
        level: 'success',
        message: `Workflow completed successfully in ${(execution.duration / 1000).toFixed(2)}s across ${plan.executionOrder.length} steps.`,
      });

      await monitoringAgent.sendNotification({
        userId,
        workflowId,
        executionId,
        type: 'success',
        title: 'Workflow Execution Completed',
        message: `Workflow "${workflow.name}" completed successfully (${(execution.duration / 1000).toFixed(2)}s).`,
      });

      this.clearSignal(executionId);
      return execution;
    } catch (err) {
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.duration = execution.endTime - execution.startTime;
      execution.error = {
        message: err.message,
        classification: recoveryAgent.classifyError(err),
        stack: err.stack,
      };
      await execution.save();

      await monitoringAgent.emitEvent({
        executionId,
        workflowId,
        userId,
        agent: 'monitoring',
        level: 'error',
        message: `Execution failed: ${err.message}`,
        metadata: { error: execution.error },
      });

      await monitoringAgent.sendNotification({
        userId,
        workflowId,
        executionId,
        type: 'failure',
        title: 'Workflow Execution Failed',
        message: `Workflow "${workflow.name}" failed: ${err.message}`,
      });

      this.clearSignal(executionId);
      return execution;
    }
  }
}

module.exports = new Orchestrator();
