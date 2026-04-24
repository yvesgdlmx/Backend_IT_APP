import express from "express";
import { 
    obtenerCredenciales, 
    crearCredencial, 
    actualizarCredencial, 
    eliminarCredencial 
} from "../controllers/credencialesController.js";

const router = express.Router();

router.get("/", obtenerCredenciales);
router.post("/", crearCredencial);
router.put("/:id", actualizarCredencial);
router.delete("/:id", eliminarCredencial);

export default router;