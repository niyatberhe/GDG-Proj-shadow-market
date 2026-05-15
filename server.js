require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Item = require('./models/Item');
const AuthCode = require('./models/AuthCode');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('REQ', req.method, req.path);
  next();
});

const { connect } = require('./lib/db');
app.use(async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set in environment; using insecure fallback for development. Set JWT_SECRET in production.');
}

async function userFromAuthHeader(req) {
  const auth = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!auth) return null;
  try {

    const decoded = jwt.verify(auth, JWT_SECRET);
    if (decoded && decoded.id) {
      const user = await User.findById(decoded.id);
      return user || null;
    }
    const legacy = await User.findOne({ token: auth });
    return legacy || null;
  } catch (e) {
    return null;
  }
}

app.get('/', (req, res) => {
  res.redirect('/intro.html');
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const payload = req.body;
    const user = await userFromAuthHeader(req);
    if (user) payload.owner = user._id;
    const newItem = new Item(payload);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/my-items', async (req, res) => {
  try {
    const user = await userFromAuthHeader(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const items = await Item.find({ owner: user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const user = await userFromAuthHeader(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (!item.owner || item.owner.toString() !== user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    const allowed = ['name', 'price', 'category', 'condition', 'description', 'offererPhone', 'offererTelegram'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) item[key] = req.body[key];
    });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const user = await userFromAuthHeader(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (!item.owner || item.owner.toString() !== user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    await item.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static files will be served after API routes are registered (moved below)

// AI endpoints removed

// Debug: list registered routes
app.get('/api/_routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach(mw => {
      if (mw.route && mw.route.path) {
        const methods = Object.keys(mw.route.methods).join(',')
        routes.push({ path: mw.route.path, methods })
      }
    })
    res.json(routes)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
});

// AI route removed

app.post('/api/auth/request-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const authCode = new AuthCode({ phone, code, expiresAt });
    await authCode.save();
    console.log('Verification code for', phone, ':', code);
    res.json({ ok: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
    const record = await AuthCode.findOne({ phone, code, used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ error: 'Invalid or expired code' });
    record.used = true;
    await record.save();
    let user = await User.findOne({ phone });
    if (!user) user = new User({ phone });
    // Issue a JWT for authentication (persist token for backward compatibility)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    user.token = token;
    await user.save();
    res.json({ token, user: { id: user._id, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static after APIs
app.use(express.static('public'));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Shadow-Market Oracle listening at http://localhost:${port}`);
  });
}

module.exports = app;
