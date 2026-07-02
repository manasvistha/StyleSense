import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';
import { BadRequest } from '../utils/http-error';

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!existsSync(uploadRoot)) mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(BadRequest('Only JPEG, PNG, WEBP or AVIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});
