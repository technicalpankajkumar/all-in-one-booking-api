
import multer from 'multer'
import path from 'path';
import fs from 'fs';
import express from 'express';

// static uploads folder for serving images
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer setup (store files in uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2,6)}${ext}`);
  }
});
export const uploadFile = multer({ storage });