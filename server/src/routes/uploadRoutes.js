import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { adminOnly, protect } from "../middleware/auth.js";
import env from "../config/env.js";

const router = express.Router();

// Cloudinary config
if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

// Local Storage Setup
fs.mkdirSync(uploadsDir, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `wishly-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

// Cloudinary Storage Setup
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wishly_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"]
  }
});

// Determine storage based on environment
const storage = (env.nodeEnv === "production" && env.cloudinaryCloudName) 
  ? cloudStorage 
  : localStorage;

const fileFilter = (req, file, cb) => {
  if (file?.mimetype?.startsWith("image/")) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post("/upload-image", protect, adminOnly, upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Image file is required");
  }

  // Handle Cloudinary upload response vs Local upload response
  const imageUrl = req.file.path 
    ? req.file.path 
    : `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.status(201).json({
    filename: req.file.filename || req.file.public_id,
    url: imageUrl
  });
});

export default router;
