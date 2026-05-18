const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  body: { type: String, required: true, trim: true, maxlength: 2500 },
  audience: {
    type: String,
    enum: ['all', 'department', 'verified-students'],
    default: 'verified-students',
  },
  department: { type: String, default: '' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

announcementSchema.index({ college: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
