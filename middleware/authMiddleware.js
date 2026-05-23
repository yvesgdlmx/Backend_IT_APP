import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export const proteger = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ["id", "nombre", "email", "rol", "activo"],
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: "Sesion no valida." });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({ error: "Sesion expirada o invalida." });
  }
};

export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ error: "Solo un administrador puede realizar esta accion." });
  }

  next();
};
