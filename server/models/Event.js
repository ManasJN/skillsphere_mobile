const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  type: {
    type: String,
    enum: ['event', 'opportunity', 'workshop', 'placement', 'club'],
    default: 'event',
  },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date },
  location: { type: String, default: '', trim: true },
  link: { type: String, default: '', trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

eventSchema.index({ college: 1, startsAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
