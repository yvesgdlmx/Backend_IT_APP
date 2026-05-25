import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Op } from "sequelize";
import generarJWT from "../helpers/generarJWT.js";
import Usuario from "../models/Usuario.js";
import ConfiguracionSeguridad from "../models/ConfiguracionSeguridad.js";
import PasswordReset from "../models/PasswordReset.js";
import { enviarCorreo } from "../helpers/enviarCorreo.js";

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

export const solicitarResetPassword = async (req, res) => {
  const respuestaGenerica = {
    mensaje:
      "Si el correo esta registrado, recibiras un enlace para cambiar tu contrasena.",
  };

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Ingresa tu correo electronico." });
    }

    const usuario = await Usuario.findOne({
      where: { email: email.trim().toLowerCase(), activo: true },
    });

    if (!usuario) {
      return res.json(respuestaGenerica);
    }

    await PasswordReset.destroy({
      where: {
        usuarioId: usuario.id,
        usedAt: null,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/recuperar-password/${token}`;

    await PasswordReset.create({
      usuarioId: usuario.id,
      tokenHash,
      expiresAt,
    });

    await enviarCorreo({
      to: usuario.email,
      subject: "Recuperacion de contrasena - TI CONTROL",
      text: `Hola ${usuario.nombre}. Usa este enlace para cambiar tu contrasena: ${resetUrl}. El enlace vence en 1 hora.`,
      html: `
        <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
            <div style="background:#0f172a;border-radius:18px 18px 0 0;padding:26px 30px;color:#ffffff;">
              <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#93c5fd;">TI CONTROL</div>
              <h1 style="margin:14px 0 0;font-size:24px;line-height:1.25;">Cambio de contrasena</h1>
            </div>
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 18px 18px;padding:30px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;">Hola ${usuario.nombre}, recibimos una solicitud para cambiar la contrasena de tu cuenta.</p>
              <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 20px;font-weight:700;font-size:14px;">Cambiar contrasena</a>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Este enlace vence en 1 hora. Si tu no solicitaste este cambio, puedes ignorar este correo.</p>
            </div>
          </div>
        </div>
      `,
    });

    res.json(respuestaGenerica);
  } catch (error) {
    console.error("Error al solicitar recuperacion:", error);
    res.status(500).json({ error: "No fue posible enviar el correo de recuperacion." });
  }
};

export const restablecerPassword = async (req, res) => {
  try {
    const { token, password, confirmarPassword } = req.body;

    if (!token || !password || !confirmarPassword) {
      return res.status(400).json({ error: "Completa todos los campos." });
    }

    if (password !== confirmarPassword) {
      return res.status(400).json({ error: "La confirmacion no coincide." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const solicitud = await PasswordReset.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!solicitud) {
      return res.status(400).json({ error: "El enlace no es valido o ya expiro." });
    }

    const usuario = await Usuario.findByPk(solicitud.usuarioId);

    if (!usuario || !usuario.activo) {
      return res.status(400).json({ error: "El enlace no es valido o ya expiro." });
    }

    await usuario.update({
      password: await bcrypt.hash(password, 12),
    });

    await solicitud.update({ usedAt: new Date() });

    res.json({ mensaje: "Contrasena actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
