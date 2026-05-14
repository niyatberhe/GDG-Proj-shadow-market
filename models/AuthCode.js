const mongoose = require('mongoose');

const authCodeSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
});

module.exports = mongoose.model('AuthCode', authCodeSchema);
