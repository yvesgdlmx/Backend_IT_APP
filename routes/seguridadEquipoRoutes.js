import express from "express";
import {
  actualizarRevisionSeguridad,
  guardarCierreSeguridad,
  obtenerCierresSeguridad,
  obtenerRevisionSeguridad,
} from "../controllers/seguridadEquipoController.js";

const router = express.Router();

router.get("/revision", obtenerRevisionSeguridad);
router.patch("/revision/:id", actualizarRevisionSeguridad);
router.get("/cierres", obtenerCierresSeguridad);
router.post("/cierres", guardarCierreSeguridad);

export default router;
