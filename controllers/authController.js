import bcrypt from "bcryptjs";
import generarJWT from "../helpers/generarJWT.js";
import Usuario from "../models/Usuario.js";
import ConfiguracionSeguridad from "../models/ConfiguracionSeguridad.js";

const datosUsuario = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
});

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Ingresa correo y contrasena." });
    }

    const usuario = await Usuario.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: "Credenciales no validas." });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales no validas." });
    }

    res.json({
      token: generarJWT(usuario.id),
      usuario: datosUsuario(usuario),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const perfil = async (req, res) => {
  res.json({ usuario: datosUsuario(req.usuario) });
};

export const actualizarCodigo365 = async (req, res) => {
  try {
    const { passwordAdmin, nuevoCodigo, confirmarCodigo } = req.body;

    if (!passwordAdmin || !nuevoCodigo || !confirmarCodigo) {
      return res.status(400).json({ error: "Completa todos los campos." });
    }

    if (nuevoCodigo !== confirmarCodigo) {
      return res.status(400).json({ error: "La confirmacion no coincide." });
    }

    if (nuevoCodigo.trim().length < 6) {
      return res.status(400).json({ error: "El codigo debe tener al menos 6 caracteres." });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    const passwordValida = await bcrypt.compare(passwordAdmin, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: "La contrasena del administrador no es correcta." });
    }

    const valorHash = await bcrypt.hash(nuevoCodigo.trim(), 12);

    const [configuracion, creado] = await ConfiguracionSeguridad.findOrCreate({
      where: { clave: "cuentas365_reveal_code" },
      defaults: {
        valorHash,
        actualizadoPor: req.usuario.id,
      },
    });

    if (!creado) {
      await configuracion.update({
        valorHash,
        actualizadoPor: req.usuario.id,
      });
    }

    res.json({ mensaje: "Codigo de visualizacion actualizado correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
