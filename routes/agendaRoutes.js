import express from "express";
import {
  actualizarActividadAgenda,
  cambiarEstadoActividadAgenda,
  crearActividadAgenda,
  eliminarActividadAgenda,
  obtenerActividadesAgenda,
} from "../controllers/agendaController.js";

const router = express.Router();

router.get("/", obtenerActividadesAgenda);
router.post("/", crearActividadAgenda);
router.put("/:id", actualizarActividadAgenda);
router.patch("/:id/estado", cambiarEstadoActividadAgenda);
router.delete("/:id", eliminarActividadAgenda);

export default router;
