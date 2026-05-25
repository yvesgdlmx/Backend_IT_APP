import express from "express";
import {
  actualizarCodigo365,
  login,
  perfil,
  restablecerPassword,
  solicitarResetPassword,
} from "../controllers/authController.js";
import { proteger, soloAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/password/solicitar", solicitarResetPassword);
router.post("/password/restablecer", restablecerPassword);
router.get("/perfil", proteger, perfil);
router.put("/codigo-365", proteger, soloAdmin, actualizarCodigo365);

export default router;
