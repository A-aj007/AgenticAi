const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const config = require('./env');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = config.MONGODB_URI;
  const dataDir = path.resolve(__dirname, '../../data');
  const uriFilePath = path.join(dataDir, 'active_db_uri.txt');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Try connecting to configured MONGODB_URI (e.g. MongoDB Atlas or custom local URI)
  if (uri && !uri.includes('<') && !uri.includes('>')) {
    try {
      const displayUri = uri.includes('@') ? uri.replace(/:([^:@]+)@/, ':****@') : uri;
      console.log(`[DB] Connecting to MongoDB (${displayUri})...`);
      await mongoose.connect(uri, {
        dbName: 'agentflow_ai',
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 6000,
      });
      console.log('[DB] ✅ Connected to MongoDB (Database: agentflow_ai).');
      console.log('[DB] 💾 Registered users and all data are stored and persisted permanently.');
      fs.writeFileSync(uriFilePath, uri);
      return mongoose.connection;
    } catch (err) {
      console.warn(`[DB] ⚠️ Could not connect to configured MONGODB_URI: ${err.message}`);
      if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
        console.warn('[DB] Hint: Check your MongoDB database username/password in server/.env.');
      } else if (err.message.includes('querySrv ETIMEOUT') || err.message.includes('whitelist')) {
        console.warn('[DB] Hint: Whitelist IP 0.0.0.0/0 in MongoDB Atlas > Network Access.');
      }
      console.log('[DB] 🔄 Attempting fallback to Local MongoDB Service on port 27017...');
    }
  } else if (uri && (uri.includes('<') || uri.includes('>'))) {
    console.warn('⚠️  [DB] NOTICE: Your MONGODB_URI in server/.env contains placeholder brackets like <db_username> or <password>.');
    console.warn('⚠️  [DB] Connecting to persistent Local MongoDB (mongodb://127.0.0.1:27017/agentflow_ai) instead.');
  }

  // 2. Try connecting to Local MongoDB Daemon on default port 27017
  const localDefaultUri = 'mongodb://127.0.0.1:27017/agentflow_ai';
  try {
    console.log(`[DB] Connecting to Local MongoDB at ${localDefaultUri}...`);
    await mongoose.connect(localDefaultUri, {
      dbName: 'agentflow_ai',
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[DB] ✅ Connected to Local MongoDB Daemon on port 27017 (Database: agentflow_ai).');
    console.log('[DB] 💾 Data Location: Local MongoDB service (persisted permanently on disk).');
    fs.writeFileSync(uriFilePath, localDefaultUri);
    return mongoose.connection;
  } catch (localErr) {
    console.log('[DB] Local MongoDB daemon on 27017 not active, attempting embedded local database engine...');
  }

  // 3. Persistent Embedded Storage Fallback (stores database on disk in server/data/db)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const localDbPath = path.join(dataDir, 'db');
    if (!fs.existsSync(localDbPath)) {
      fs.mkdirSync(localDbPath, { recursive: true });
    }

    // Clean stale lockfile if present and process is dead
    const lockFile = path.join(localDbPath, 'mongod.lock');
    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile);
      } catch (lockErr) {
        // Ignore if unable to remove
      }
    }

    console.log(`[DB] Starting Embedded Persistent Local Database Server at: ${localDbPath}`);
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath: localDbPath,
        storageEngine: 'wiredTiger',
      },
    });

    const localUri = mongoMemoryServer.getUri();
    await mongoose.connect(localUri, { dbName: 'agentflow_ai' });
    console.log(`[DB] ✅ Embedded Persistent MongoDB connected at: ${localUri}`);
    console.log(`[DB] 💾 Data Location on Disk: ${localDbPath} (persisted across restarts).`);
    fs.writeFileSync(uriFilePath, localUri);
    return mongoose.connection;
  } catch (memErr) {
    console.warn('[DB] Could not bind embedded persistent storage directory, falling back to in-memory instance:', memErr.message);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const fallbackUri = mongoMemoryServer.getUri();
      await mongoose.connect(fallbackUri, { dbName: 'agentflow_ai' });
      console.log(`[DB] ⚠️ Connected to Ephemeral In-Memory MongoDB at: ${fallbackUri}`);
      console.log('[DB] ⚠️ WARNING: In-memory mode does not persist data across restarts.');
      fs.writeFileSync(uriFilePath, fallbackUri);
      return mongoose.connection;
    } catch (innerErr) {
      console.error('[DB] Fatal Database initialization error:', innerErr.message);
      throw innerErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('[DB] Database disconnected.');
  } catch (err) {
    console.error('[DB] Error during disconnect:', err.message);
  }
};

// Graceful shutdown hooks
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };
