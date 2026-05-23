import express from "express";
import {
  actualizarLicencia,
  crearLicencia,
  eliminarLicencia,
  obtenerLicencias,
} from "../controllers/licenciaController.js";

const router = express.Router();

router.get("/", obtenerLicencias);
router.post("/", crearLicencia);
router.put("/:id", actualizarLicencia);
router.delete("/:id", eliminarLicencia);

export default router;
