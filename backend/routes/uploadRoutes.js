import path from 'path';
import express from 'express';
import multer from 'multer';

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

const upload = multer({
  storage,
});

router.post('/', (req, res) => {
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
