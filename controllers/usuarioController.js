import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

const datosUsuario = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  activo: usuario.activo,
  createdAt: usuario.createdAt,
});

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre", "email", "rol", "activo", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Completa nombre, correo y contrasena." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres." });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const existe = await Usuario.findOne({ where: { email: emailNormalizado } });

    if (existe) {
      return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
    }

    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      email: emailNormalizado,
      password: await bcrypt.hash(password, 12),
      rol: rol === "admin" ? "admin" : "usuario",
      activo: true,
    });

    res.status(201).json(datosUsuario(usuario));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (usuario.id === req.usuario.id) {
      return res.status(400).json({ error: "No puedes desactivar tu propio usuario." });
    }

    await usuario.update({ activo: !usuario.activo });

    res.json(datosUsuario(usuario));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
