
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROOT upload folder
const UPLOAD_ROOT = path.join(__dirname, "../uploads");

// Ensure root folder exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

/* ---------------------------------------------------------
   🔥 1) REGISTER STATIC UPLOAD FOLDER
----------------------------------------------------------- */
export const registerUploadFolder = (app) => {
  // Serve uploads folder → http://localhost:5000/uploads/... works
  app.use("/uploads", express.static(UPLOAD_ROOT));
};

/* ---------------------------------------------------------
   🔥 2) DRIVER IMAGE UPLOADER (Dynamic Folders)
----------------------------------------------------------- */
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // default folder
    let subFolder = "driver/other";

    // categorised folders
    if (file.fieldname === "profile") subFolder = "driver/profile";
    if (file.fieldname === "pan") subFolder = "driver/pan";
    if (file.fieldname === "signature") subFolder = "driver/signature";
    if (file.fieldname === "aadhar") subFolder = "driver/aadhar";
    if (file.fieldname === "driving_license") subFolder = "driver/license";
    if (file.fieldname === "health_insurance") subFolder = "driver/license";
    if (file.fieldname === "term_insurance") subFolder = "driver/license";

    const finalPath = path.join(UPLOAD_ROOT, subFolder);

    // create folder if not exist
    fs.mkdirSync(finalPath, { recursive: true });

    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${file.fieldname}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    cb(null, unique + ext);
  },
});

export const uploadDriver = multer({ storage: driverStorage });


/* ---------------------------------------------------------
   🔥 3) GENERAL UPLOADER (Everything into /uploads)
----------------------------------------------------------- */
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    cb(null, id + ext);
  },
});

export const uploadFile = multer({ storage: generalStorage });
