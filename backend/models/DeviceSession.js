const mongoose = require('mongoose');

/**
 * Device Session Schema
 * Tracks active user sessions across different devices
 */
const deviceSessionSchema = new mongoose.Schema({
  /**
   * User ID this session belongs to
   */
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  /**
   * JWT token for this session
   */
  token: {
    type: String,
    required: true,
    unique: true
  },

  /**
   * Device identifier (browser fingerprint, device ID, etc.)
   */
  deviceId: {
    type: String,
    required: true
  },

  /**
   * Device name/description
   */
  deviceName: {
    type: String,
    required: true,
    default: 'Unknown Device'
  },

  /**
   * User agent string
   */
  userAgent: {
    type: String,
    required: true
  },

  /**
   * IP address of the device
   */
  ipAddress: {
    type: String,
    required: true
  },

  /**
   * Location information (if available)
   */
  location: {
    type: String,
    default: 'Unknown'
  },

  /**
   * Session creation timestamp
   */
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Auto-delete after 30 days
  },

  /**
   * Last activity timestamp
   */
  lastActivity: {
    type: Date,
    default: Date.now
  },

  /**
   * Whether this session is currently active
   */
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
deviceSessionSchema.index({ userId: 1, isActive: 1 });
deviceSessionSchema.index({ token: 1 });
deviceSessionSchema.index({ deviceId: 1, userId: 1 });

// Static method to get active sessions count for a user
deviceSessionSchema.statics.getActiveSessionCount = async function(userId) {
  return await this.countDocuments({ userId, isActive: true });
};

// Static method to get all active sessions for a user
deviceSessionSchema.statics.getActiveSessions = async function(userId) {
  return await this.find({ userId, isActive: true }).sort({ lastActivity: -1 });
};

// Static method to deactivate all sessions for a user
deviceSessionSchema.statics.deactivateAllSessions = async function(userId) {
  return await this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
};

// Static method to deactivate oldest sessions if limit exceeded
deviceSessionSchema.statics.enforceSessionLimit = async function(userId, maxSessions = 3) {
  const activeSessions = await this.find({ userId, isActive: true })
    .sort({ lastActivity: 1 }); // Oldest first

  if (activeSessions.length >= maxSessions) {
    // Deactivate oldest sessions to make room
    const sessionsToDeactivate = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
    const sessionIds = sessionsToDeactivate.map(session => session._id);
    
    await this.updateMany(
      { _id: { $in: sessionIds } },
      { isActive: false }
    );

    return sessionsToDeactivate;
  }

  return [];
};

// Instance method to update last activity
deviceSessionSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  return await this.save();
};

// Instance method to deactivate session
deviceSessionSchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

module.exports = mongoose.model('DeviceSession', deviceSessionSchema); 