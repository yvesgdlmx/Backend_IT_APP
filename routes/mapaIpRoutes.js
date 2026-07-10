import express from "express";
import {
  actualizarDireccionIp,
  actualizarRedIp,
  crearDireccionIp,
  crearRedIp,
  eliminarDireccionIp,
  eliminarRedIp,
  obtenerRedesIp,
} from "../controllers/mapaIpController.js";

const router = express.Router();

router.get("/", obtenerRedesIp);
router.post("/", crearRedIp);
router.put("/:id", actualizarRedIp);
router.delete("/:id", eliminarRedIp);
router.post("/:redId/ips", crearDireccionIp);
router.put("/:redId/ips/:ipId", actualizarDireccionIp);
router.delete("/:redId/ips/:ipId", eliminarDireccionIp);

export default router;
