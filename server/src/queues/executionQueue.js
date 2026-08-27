const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let bullQueue = null;
let bullWorker = null;
let isRedisActive = false;

// In-Memory Async Queue Fallback
class InMemoryExecutionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(name, data) {
    const job = { id: `inmem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name, data };
    this.queue.push(job);
    console.log(`[InMemoryQueue] Queued execution job for executionId: ${data.executionId}`);
    setImmediate(() => this.processNext());
    return job;
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      console.log(`[InMemoryQueue] Processing execution job ${job.id} for executionId: ${job.data.executionId}`);
      await orchestrator.runWorkflow(job.data.executionId);
    } catch (err) {
      console.error(`[InMemoryQueue] Error executing job ${job.id}:`, err.message);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }
}

const inMemoryQueue = new InMemoryExecutionQueue();

const initQueue = () => {
  if (config.REDIS_URL) {
    try {
      console.log(`[Queue] Attempting Redis connection at ${config.REDIS_URL}...`);
      const connection = new IORedis(config.REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        retryStrategy: () => null, // Don't hang if offline
      });

      connection.on('connect', () => {
        console.log('[Queue] Connected to Redis. Initializing BullMQ execution queue...');
        isRedisActive = true;
        
        bullQueue = new Queue('workflow-executions', { connection });
        bullWorker = new Worker(
          'workflow-executions',
          async (job) => {
            console.log(`[BullMQ] Executing job ${job.id} for executionId: ${job.data.executionId}`);
            return orchestrator.runWorkflow(job.data.executionId);
          },
          { connection, concurrency: 5 }
        );

        bullWorker.on('completed', (job) => {
          console.log(`[BullMQ] Job ${job.id} completed.`);
        });

        bullWorker.on('failed', (job, err) => {
          console.error(`[BullMQ] Job ${job.id} failed:`, err.message);
        });
      });

      connection.on('error', (err) => {
        console.warn(`[Queue] Redis not available (${err.message}). Using In-Memory fallback queue.`);
        isRedisActive = false;
      });
    } catch (err) {
      console.warn('[Queue] Redis initialization skipped. Using In-Memory queue fallback.');
    }
  } else {
    console.log('[Queue] No REDIS_URL configured. Active queue: In-Memory Execution Queue.');
  }
};

const addExecutionJob = async ({ executionId, workflowId, userId }) => {
  if (isRedisActive && bullQueue) {
    return bullQueue.add(
      'run-workflow',
      { executionId, workflowId, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      }
    );
  }

  // Fallback to in-memory async execution
  return inMemoryQueue.add('run-workflow', { executionId, workflowId, userId });
};

module.exports = {
  initQueue,
  addExecutionJob,
  isRedisActive: () => isRedisActive,
};
