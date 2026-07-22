import express from "express";
import {
  actualizarLicencia,
  asignarDispositivoLicencia,
  crearLicencia,
  eliminarLicencia,
  liberarDispositivoLicencia,
  guardarCierreLicencias,
  obtenerCierresLicencias,
  obtenerLicencias,
  previsualizarCierreLicencias,
} from "../controllers/licenciaController.js";

const router = express.Router();

router.get("/", obtenerLicencias);
router.get("/cierres", obtenerCierresLicencias);
router.get("/cierres/preview", previsualizarCierreLicencias);
router.post("/cierres", guardarCierreLicencias);
router.post("/", crearLicencia);
router.post("/:id/dispositivos", asignarDispositivoLicencia);
router.patch("/asignaciones/:asignacionId/liberar", liberarDispositivoLicencia);
router.put("/:id", actualizarLicencia);
router.delete("/:id", eliminarLicencia);

export default router;
