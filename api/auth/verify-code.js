const { connect } = require('../../lib/db');
const AuthCode = require('../../models/AuthCode');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await connect();
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
    const record = await AuthCode.findOne({ phone, code, used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ error: 'Invalid or expired code' });
    record.used = true;
    await record.save();
    let user = await User.findOne({ phone });
    if (!user) user = new User({ phone });
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    user.token = token;
    await user.save();
    res.json({ token, user: { id: user._id, phone: user.phone } });
  } catch (err) {
    console.error('verify-code error', err);
    res.status(500).json({ error: err.message });
  }
};
