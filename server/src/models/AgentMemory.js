const mongoose = require('mongoose');

const AgentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  { timestamps: true }
);

AgentMemorySchema.index({ executionId: 1, key: 1 });

module.exports = mongoose.model('AgentMemory', AgentMemorySchema);
