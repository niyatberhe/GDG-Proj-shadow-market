const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shadow-market';

let cached = global.__mongoCache || (global.__mongoCache = { conn: null, promise: null });

async function connect() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  
  if (!cached.promise || mongoose.connection.readyState !== 1) {
    cached.promise = mongoose.connect(mongoUri, { 
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000 
    }).then(m => m.connection);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connect };
