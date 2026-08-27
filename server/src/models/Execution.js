const mongoose = require('mongoose');

const ExecutionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    workflowSnapshot: {
      type: Object,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in milliseconds
      default: 0,
    },
    inputs: {
      type: Object,
      default: {},
    },
    outputs: {
      type: Object,
      default: {},
    },
    error: {
      type: Object,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    langGraphStatus: {
      type: String,
      enum: ['available', 'not-installed'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Execution', ExecutionSchema);
