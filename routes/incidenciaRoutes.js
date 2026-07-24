import express from "express";
import {
  actualizarIncidencia,
  cambiarEstadoIncidencia,
  crearIncidencia,
  eliminarIncidencia,
  guardarCierreIncidencias,
  obtenerCierresIncidencias,
  obtenerIncidencias,
  previsualizarCierreIncidencias,
} from "../controllers/incidenciaController.js";

const router = express.Router();

router.get("/", obtenerIncidencias);
router.get("/cierres", obtenerCierresIncidencias);
router.get("/cierres/preview", previsualizarCierreIncidencias);
router.post("/cierres", guardarCierreIncidencias);
router.post("/", crearIncidencia);
router.patch("/:id/estado", cambiarEstadoIncidencia);
router.put("/:id", actualizarIncidencia);
router.delete("/:id", eliminarIncidencia);

export default router;
