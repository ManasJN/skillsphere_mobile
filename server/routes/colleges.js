const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const College = require('../models/College');
const User = require('../models/User');
const StudentVerificationRequest = require('../models/StudentVerificationRequest');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const { Notification } = require('../models/Achievement');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const verificationDir = path.join(process.cwd(), 'uploads', 'verification');
fs.mkdirSync(verificationDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: verificationDir,
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype) || ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext));
  },
});

const getCollegeForUser = async (user) => {
  if (user.collegeId) return College.findById(user.collegeId);
  return College.findOne({ user: user._id });
};

router.get('/', async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    const query = { verificationStatus: 'approved' };
    if (q) {
      query.$or = [
        { collegeName: { $regex: q, $options: 'i' } },
        { officialEmail: { $regex: q, $options: 'i' } },
      ];
    }
    const colleges = await College.find(query)
      .select('collegeName officialEmail website logo verificationStatus')
      .sort('collegeName')
      .limit(25);
    res.json({ success: true, data: colleges });
  } catch (err) {
    next(err);
  }
});

router.use(protect);

router.get('/me', authorize('faculty'), async (req, res, next) => {
  try {
    const college = await getCollegeForUser(req.user);
    res.json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/me/documents',
  authorize('faculty'),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]),
  async (req, res, next) => {
    try {
      const college = await getCollegeForUser(req.user);
      if (!college) return res.status(404).json({ success: false, message: 'College account not found' });

      if (req.files?.logo?.[0]) {
        college.logo = `/uploads/verification/${req.files.logo[0].filename}`;
      }
      if (req.files?.documents?.length) {
        college.documents = req.files.documents.map((file) => `/uploads/verification/${file.filename}`);
      }
      await college.save();

      res.json({ success: true, data: college });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/student-updates', authorize('student'), async (req, res, next) => {
  try {
    if (req.user.verificationStatus !== 'verified' || !req.user.collegeId) {
      return res.json({ success: true, announcements: [], events: [] });
    }
    const [announcements, events] = await Promise.all([
      Announcement.find({ college: req.user.collegeId, isPublished: true })
        .sort('-createdAt')
        .limit(8)
        .populate('postedBy', 'name'),
      Event.find({ college: req.user.collegeId, startsAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        .sort('startsAt')
        .limit(8),
    ]);
    res.json({ success: true, announcements, events });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/student-verification',
  authorize('student'),
  upload.fields([{ name: 'idProof', maxCount: 1 }, { name: 'admissionProof', maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const { collegeId, department, semester, rollNumber, batch, phone } = req.body;
      if (!collegeId || !req.files?.idProof?.[0]) {
        return res.status(400).json({ success: false, message: 'College and college ID proof are required' });
      }

      const college = await College.findOne({ _id: collegeId, verificationStatus: 'approved' });
      if (!college) return res.status(404).json({ success: false, message: 'Approved college not found' });

      await StudentVerificationRequest.updateMany(
        { student: req.user._id, status: 'pending' },
        { status: 'rejected', decisionNote: 'Replaced by a newer request' }
      );

      const idProofUrl = `/uploads/verification/${req.files.idProof[0].filename}`;
      const admissionProofUrl = req.files?.admissionProof?.[0]
        ? `/uploads/verification/${req.files.admissionProof[0].filename}`
        : '';

      const request = await StudentVerificationRequest.create({
        student: req.user._id,
        college: college._id,
        idProofUrl,
        admissionProofUrl,
        submittedProfile: { department, semester: Number(semester), rollNumber, batch, phone },
      });

      const user = await User.findById(req.user._id);
      Object.assign(user, {
        department,
        semester: Number(semester),
        rollNumber,
        batch,
        phone,
        collegeId: college._id,
        college: college.collegeName,
        idProofUrl,
        admissionProofUrl,
        verificationStatus: 'pending',
      });
      await user.save();

      res.status(201).json({ success: true, data: request, user: user.toPublicJSON() });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/student-verification/my', authorize('student'), async (req, res, next) => {
  try {
    const request = await StudentVerificationRequest.findOne({ student: req.user._id })
      .populate('college', 'collegeName officialEmail')
      .sort('-createdAt');
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

router.get('/student-requests', authorize('faculty'), async (req, res, next) => {
  try {
    const college = await getCollegeForUser(req.user);
    if (!college || college.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'College account is not approved yet' });
    }
    const requests = await StudentVerificationRequest.find({ college: college._id, status: 'pending' })
      .populate('student', 'name email department semester rollNumber batch phone')
      .sort('-createdAt');
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

router.put('/student-requests/:id/decision', authorize('faculty'), async (req, res, next) => {
  try {
    const { decision, note = '' } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be approved or rejected' });
    }
    const college = await getCollegeForUser(req.user);
    if (!college || college.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'College account is not approved yet' });
    }

    const request = await StudentVerificationRequest.findOne({ _id: req.params.id, college: college._id })
      .populate('student', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Verification request not found' });

    request.status = decision;
    request.decisionNote = note;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const userUpdates = decision === 'approved'
      ? { verificationStatus: 'verified', approvedBy: req.user._id, verifiedAt: new Date(), verificationNotes: note }
      : { verificationStatus: 'rejected', verificationNotes: note, approvedBy: req.user._id };
    const student = await User.findByIdAndUpdate(request.student._id, userUpdates, { new: true });

    await Notification.create({
      recipient: student._id,
      sender: req.user._id,
      type: 'verification',
      title: decision === 'approved' ? 'College verification approved' : 'College verification rejected',
      message: decision === 'approved'
        ? `You are now verified with ${college.collegeName}.`
        : note || `${college.collegeName} rejected your verification request.`,
      icon: 'ID',
      color: decision === 'approved' ? '#10b981' : '#ef4444',
    });

    res.json({ success: true, data: request, student });
  } catch (err) {
    next(err);
  }
});

router.post('/announcements', authorize('faculty'), async (req, res, next) => {
  try {
    const college = await getCollegeForUser(req.user);
    if (!college || college.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'College account is not approved yet' });
    }
    const { title, body, audience = 'verified-students', department = '' } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body are required' });

    const announcement = await Announcement.create({
      college: college._id,
      title,
      body,
      audience,
      department,
      postedBy: req.user._id,
    });

    const studentQuery = { role: 'student', collegeId: college._id, verificationStatus: 'verified', isActive: true };
    if (audience === 'department' && department) studentQuery.department = department;
    const students = await User.find(studentQuery).select('_id');
    if (students.length) {
      await Notification.insertMany(students.map((student) => ({
        recipient: student._id,
        sender: req.user._id,
        type: 'announcement',
        title,
        message: body.slice(0, 240),
        icon: 'Notice',
        color: '#4f46e5',
      })));
    }

    res.status(201).json({ success: true, data: announcement, notified: students.length });
  } catch (err) {
    next(err);
  }
});

router.post('/events', authorize('faculty'), async (req, res, next) => {
  try {
    const college = await getCollegeForUser(req.user);
    if (!college || college.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'College account is not approved yet' });
    }
    const { title, description, type, startsAt, endsAt, location, link } = req.body;
    if (!title || !startsAt) return res.status(400).json({ success: false, message: 'Title and start date are required' });
    const event = await Event.create({
      college: college._id,
      title,
      description,
      type,
      startsAt,
      endsAt,
      location,
      link,
      postedBy: req.user._id,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/pending', authorize('admin'), async (req, res, next) => {
  try {
    const colleges = await College.find({ verificationStatus: 'pending' })
      .populate('user', 'name email isVerified')
      .sort('-createdAt');
    res.json({ success: true, data: colleges });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/:id/decision', authorize('admin'), async (req, res, next) => {
  try {
    const { decision, reason = '' } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be approved or rejected' });
    }

    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });

    college.verificationStatus = decision;
    college.approvedBy = req.user._id;
    college.verifiedAt = decision === 'approved' ? new Date() : null;
    college.rejectionReason = decision === 'rejected' ? reason : '';
    await college.save();

    await User.findByIdAndUpdate(college.user, {
      verificationStatus: decision === 'approved' ? 'verified' : 'rejected',
      approvedBy: req.user._id,
      verifiedAt: decision === 'approved' ? new Date() : null,
      verificationNotes: reason,
    });

    res.json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
