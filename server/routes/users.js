const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateCodingStats,
  importLeetCodeStats,
  importGitHubStats,
  addCertification,
  deleteCertification,
  addShowcaseItem,
  deleteShowcaseItem,
  deleteUser,
  searchBySkill,
} = require('../controllers/userController');
const { protect, authorize, ownerOrAdmin } = require('../middleware/auth');

const certificationDir = path.join(process.cwd(), 'uploads', 'certifications');
const showcaseDir = path.join(process.cwd(), 'uploads', 'showcase');
fs.mkdirSync(certificationDir, { recursive: true });
fs.mkdirSync(showcaseDir, { recursive: true });

const createUpload = (destination) => multer({
  storage: multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.dwg', '.dxf', '.step', '.stp', '.iges', '.igs'];
    cb(null, allowedTypes.includes(file.mimetype) || allowedExts.includes(ext));
  },
});

const certificationUpload = createUpload(certificationDir);
const showcaseUpload = createUpload(showcaseDir);

// All routes require login
router.use(protect);

router.get ('/',                       authorize('faculty', 'admin'), getAllUsers);
router.get ('/search/skills',          authorize('faculty', 'admin'), searchBySkill);
router.put ('/:id/import/leetcode',    ownerOrAdmin('id'), importLeetCodeStats);
router.put ('/:id/import/github',      ownerOrAdmin('id'), importGitHubStats);
router.post('/:id/certifications',     ownerOrAdmin('id'), certificationUpload.single('certificate'), addCertification);
router.delete('/:id/certifications/:certificationId', ownerOrAdmin('id'), deleteCertification);
router.post('/:id/showcase',           ownerOrAdmin('id'), showcaseUpload.single('file'), addShowcaseItem);
router.delete('/:id/showcase/:showcaseId', ownerOrAdmin('id'), deleteShowcaseItem);
router.get ('/:id',                    getUserById);
router.put ('/:id',                    ownerOrAdmin('id'), updateUser);
router.put ('/:id/coding-stats',       ownerOrAdmin('id'), updateCodingStats);
router.delete('/:id',                  authorize('admin'), deleteUser);

module.exports = router;
