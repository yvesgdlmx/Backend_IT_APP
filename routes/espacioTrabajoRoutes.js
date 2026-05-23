import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  actualizarItemTrabajo,
  completarActividad,
  crearItemTrabajo,
  eliminarItemTrabajo,
  obtenerItemsTrabajo,
} from "../controllers/espacioTrabajoController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads", "trabajo");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    cb(null, `${Date.now()}-${base || "archivo"}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Solo se permiten imagenes o videos."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 50 * 1024 * 1024,
  },
});

const router = express.Router();

router.get("/", obtenerItemsTrabajo);
router.post("/", upload.array("archivos", 5), crearItemTrabajo);
router.put("/:id", upload.array("archivos", 5), actualizarItemTrabajo);
router.patch("/:id/completar", completarActividad);
router.delete("/:id", eliminarItemTrabajo);

export default router;
