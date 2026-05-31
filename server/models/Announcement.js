/**
 * server/models/Announcement.js
 *
 * Shared ecosystem announcements — visible to ALL students + faculty.
 *
 * Demo Mode: `college` field is optional (no multi-college enforcement).
 * Phase 2: re-introduce college scoping.
 */

const mongoose = require('mongoose');

const CATEGORIES = ['Academic', 'Internship', 'Event', 'Hackathon', 'Workshop', 'General'];

const announcementSchema = new mongoose.Schema({
  title: {
    type: String, required: true, trim: true, maxlength: 180,
  },
  description: {
    type: String, required: true, trim: true, maxlength: 2500,
  },
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'General',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Optional — kept for future multi-college scoping (Phase 2)
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false,
    default: null,
  },
  isPublished: {
    type: Boolean, default: true,
  },
}, { timestamps: true });

// Index: newest-first fetch used by both faculty + student routes
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
