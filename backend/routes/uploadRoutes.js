import path from 'path';
import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Ensure we use an absolute path so it works regardless of CWD
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Allow images, videos, and documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm|pdf|doc|docx|ppt|pptx|txt|xlsx|xls|csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/|video\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.|text\/plain|application\/vnd\.ms-excel/.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image, video, and document files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
});

// Protected: only authenticated users (instructors) can upload
router.post('/', protect, (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).send({ message: err.message || 'File upload error' });
    }
    if (!req.file) {
      return res.status(400).send({ message: 'Please upload a file' });
    }
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    res.send({
      message: 'File Uploaded Successfully',
      fileUrl: `${backendUrl}/uploads/${req.file.filename}`,
    });
  });
});

export default router;
