import express from "express";
import {
  actualizarActividadAgenda,
  cambiarEstadoActividadAgenda,
  crearActividadAgenda,
  eliminarActividadAgenda,
  guardarCierreMantenimientos,
  obtenerCierresMantenimientos,
  obtenerActividadesAgenda,
  previsualizarCierreMantenimientos,
} from "../controllers/agendaController.js";

const router = express.Router();

router.get("/", obtenerActividadesAgenda);
router.get("/mantenimientos/cierres", obtenerCierresMantenimientos);
router.get("/mantenimientos/cierres/preview", previsualizarCierreMantenimientos);
router.post("/mantenimientos/cierres", guardarCierreMantenimientos);
router.post("/", crearActividadAgenda);
router.put("/:id", actualizarActividadAgenda);
router.patch("/:id/estado", cambiarEstadoActividadAgenda);
router.delete("/:id", eliminarActividadAgenda);

export default router;
