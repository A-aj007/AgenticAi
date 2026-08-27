const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');

async function inspect() {
  console.log('====================================================');
  console.log(' 🔍 Agentflow_AI Database Inspector');
  console.log('====================================================');

  const uriFilePath = path.resolve(__dirname, '../../data/active_db_uri.txt');
  let targetUri = config.MONGODB_URI;

  if (!targetUri || targetUri.includes('<')) {
    if (fs.existsSync(uriFilePath)) {
      targetUri = fs.readFileSync(uriFilePath, 'utf8').trim();
    } else {
      targetUri = 'mongodb://127.0.0.1:27017/agentflow_ai';
    }
  }

  const displayUri = targetUri.includes('@') ? targetUri.replace(/:([^:@]+)@/, ':****@') : targetUri;
  console.log(`[Target] Connecting to database: ${displayUri}`);
  
  try {
    await mongoose.connect(targetUri, { dbName: 'agentflow_ai', serverSelectionTimeoutMS: 4000 });
  } catch (connErr) {
    console.warn(`[Warning] Could not connect to ${displayUri}: ${connErr.message}`);
    // Try local 27017
    try {
      console.log('[Target] Trying local MongoDB at mongodb://127.0.0.1:27017/agentflow_ai ...');
      await mongoose.connect('mongodb://127.0.0.1:27017/agentflow_ai', { dbName: 'agentflow_ai', serverSelectionTimeoutMS: 3000 });
    } catch (localErr) {
      console.error('❌ Could not connect to database:', localErr.message);
      process.exit(1);
    }
  }

  const users = await User.find().lean();
  console.log(`\n👤 REGISTERED USERS (${users.length}):`);
  if (users.length > 0) {
    console.table(
      users.map((u) => ({
        ID: u._id.toString(),
        Name: u.name,
        Email: u.email,
        Role: u.role,
        LastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
        RegisteredAt: new Date(u.createdAt).toLocaleString(),
      }))
    );
  } else {
    console.log('  No users registered yet.');
  }

  const workflows = await Workflow.find().lean();
  console.log(`\n⚡ WORKFLOWS (${workflows.length}):`);
  if (workflows.length > 0) {
    console.table(
      workflows.map((w) => ({
        ID: w._id.toString(),
        Name: w.name,
        Nodes: w.nodes?.length || 0,
        Status: w.status,
        Version: `v${w.version || 1}.0`,
      }))
    );
  } else {
    console.log('  No workflows saved yet.');
  }

  const executions = await Execution.find().lean();
  console.log(`\n🚀 EXECUTIONS AUDIT TRAIL (${executions.length}):`);
  if (executions.length > 0) {
    console.table(
      executions.map((e) => ({
        ID: e._id.toString(),
        Status: e.status,
        Duration: e.duration ? `${(e.duration / 1000).toFixed(2)}s` : 'active',
        Retries: e.retryCount || 0,
        Date: new Date(e.createdAt).toLocaleString(),
      }))
    );
  } else {
    console.log('  No executions recorded yet.');
  }

  await mongoose.disconnect();
  console.log('\n✅ Database inspection completed.');
  process.exit(0);
}

inspect().catch((err) => {
  console.error('Inspection error:', err.message);
  process.exit(1);
});
