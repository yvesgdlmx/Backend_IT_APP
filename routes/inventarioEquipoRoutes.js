import express from "express";
import {
  guardarCierreInventarioEquipos,
  obtenerCierresInventarioEquipos,
  previsualizarInventarioEquipos,
} from "../controllers/inventarioEquipoController.js";

const router = express.Router();

router.get("/preview", previsualizarInventarioEquipos);
router.get("/cierres", obtenerCierresInventarioEquipos);
router.post("/cierres", guardarCierreInventarioEquipos);

export default router;
