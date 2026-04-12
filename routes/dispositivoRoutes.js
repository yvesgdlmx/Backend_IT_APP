import express from "express";
import {
  actualizarDispositivo,
  crearDispositivo,
  eliminarDispositivo,
  obtenerDispositivo,
  obtenerDispositivos,
} from "../controllers/dispositivoController.js";

const router = express.Router();

router.get("/", obtenerDispositivos);
router.get("/:id", obtenerDispositivo);
router.post("/", crearDispositivo);
router.put("/:id", actualizarDispositivo);
router.delete("/:id", eliminarDispositivo);

export default router;
