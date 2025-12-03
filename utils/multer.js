import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, "../uploads");

// Ensure main upload directory exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// Serve uploads folder via Express
export const registerUploadFolder = (app) => {
  app.use("/uploads", express.static(UPLOAD_ROOT));
};

// Dynamic destination folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subFolder = "driver/other";

    if (file.fieldname === "profile_photo") subFolder = "driver/profile";
    if (file.fieldname === "aadhar_front") subFolder = "driver/aadhar";
    if (file.fieldname === "aadhar_back") subFolder = "driver/aadhar";
    if (file.fieldname === "pan_image") subFolder = "driver/pan";
    if (file.fieldname === "license_front") subFolder = "driver/license";
    if (file.fieldname === "license_back") subFolder = "driver/license";

    const finalFolder = path.join(UPLOAD_ROOT, subFolder);

    // Create folder if not exist
    fs.mkdirSync(finalFolder, { recursive: true });

    cb(null, finalFolder);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${file.fieldname}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    cb(null, unique + ext);
  },
});

// Export driver-specific uploader
export const uploadDriver = multer({ storage });


// ---------------------------------------------------------------
// OPTIONAL: Generic uploader (simple storage inside /uploads)
// ---------------------------------------------------------------
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    cb(null, id + ext);
  },
});

export const uploadFile = multer({ storage: generalStorage });
