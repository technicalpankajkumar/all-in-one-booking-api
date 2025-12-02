import multer from 'multer';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';

// Fix __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload folder
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Express static folder (images accessible)
export const registerUploadFolder = (app) => {
  app.use('/uploads', express.static(UPLOAD_DIR));
};

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    cb(null, unique + ext);
  }
});

export const uploadFile = multer({ storage });
