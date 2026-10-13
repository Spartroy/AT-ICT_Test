const mongoose = require('mongoose');

// An in-app notification (also the record behind each push). `dedupeKey` makes timed reminders fire once per user.
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, default: '', maxlength: 500 },
  url: { type: String, default: '' },
  read: { type: Boolean, default: false },
  pushed: { type: Boolean, default: false }, // false while waiting for quiet hours to end
  dedupeKey: { type: String }
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
notificationSchema.index({ pushed: 1, createdAt: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // keep 90 days

module.exports = mongoose.model('Notification', notificationSchema);
