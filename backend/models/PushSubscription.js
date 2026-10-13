const mongoose = require('mongoose');

// One browser/device that agreed to receive Web Push for a user.
const pushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  userAgent: { type: String, default: '', maxlength: 300 },
  lastUsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
