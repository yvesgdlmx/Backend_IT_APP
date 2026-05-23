import express from "express";
import {
  cambiarEstadoUsuario,
  crearUsuario,
  obtenerUsuarios,
} from "../controllers/usuarioController.js";
import { soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", soloAdmin, obtenerUsuarios);
router.post("/", soloAdmin, crearUsuario);
router.patch("/:id/estado", soloAdmin, cambiarEstadoUsuario);

export default router;
