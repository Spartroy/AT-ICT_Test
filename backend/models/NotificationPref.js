const mongoose = require('mongoose');

// A person's own on/off choices, e.g. { hw_due: false }. Types that are not listed stay on.
const notificationPrefSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
  overrides: { type: Map, of: Boolean, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPref', notificationPrefSchema);
