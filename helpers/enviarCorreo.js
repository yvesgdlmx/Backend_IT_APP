import nodemailer from "nodemailer";

const crearTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE ?? "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Faltan variables SMTP_HOST, SMTP_USER o SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const obtenerRemitente = () => {
  const address = process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER;
  const name = process.env.SMTP_FROM_NAME || "TI CONTROL";

  if (!address) {
    throw new Error("Falta configurar SMTP_FROM_ADDRESS o SMTP_USER.");
  }

  return { name, address };
};

export const enviarCorreo = async ({ to, subject, html, text }) => {
  const transporter = crearTransporter();
  const remitente = obtenerRemitente();

  return transporter.sendMail({
    from: remitente,
    sender: process.env.SMTP_USER,
    envelope: {
      from: process.env.SMTP_USER,
      to,
    },
    to,
    subject,
    html,
    text,
  });
};
