import express from "express";
import {
  actualizarCuentaPadre,
  crearCuentaPadre,
  eliminarCuentaPadre,
  obtenerCuentaPadre,
  obtenerCuentasPadres,
  revelarPasswordCuenta,
} from "../controllers/cuentaController.js";

const router = express.Router();

router.get("/padre", obtenerCuentasPadres);
router.post("/password/revelar", revelarPasswordCuenta);
router.get("/padre/:id", obtenerCuentaPadre);
router.post("/padre", crearCuentaPadre);
router.put("/padre/:id", actualizarCuentaPadre);
router.delete("/padre/:id", eliminarCuentaPadre);

export default router;
