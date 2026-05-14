const { connect } = require('../../lib/db');
const AuthCode = require('../../models/AuthCode');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await connect();
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const authCode = new AuthCode({ phone, code, expiresAt });
    await authCode.save();
    console.log('Verification code for', phone, ':', code);
    res.json({ ok: true, code });
  } catch (err) {
    console.error('request-code error', err);
    res.status(500).json({ error: err.message });
  }
};
