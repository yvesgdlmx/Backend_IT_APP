import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import db from "./config/db.js";

import CuentasPadres from "./models/CuentasPadres.js";
import CuentasHijas from "./models/CuentasHijas.js";
import Dispositivos from "./models/Dispositivos.js";
import Usuario from "./models/Usuario.js";
import ConfiguracionSeguridad from "./models/ConfiguracionSeguridad.js";
import EspacioTrabajo from "./models/EspacioTrabajo.js";
import Licencia from "./models/Licencia.js";
import ActividadAgenda from "./models/ActividadAgenda.js";
import RedIp from "./models/RedIp.js";
import DireccionIp from "./models/DireccionIp.js";
import PasswordReset from "./models/PasswordReset.js";
import LicenciaCierreMensual from "./models/LicenciaCierreMensual.js";
import LicenciaDispositivo from "./models/LicenciaDispositivo.js";
import cuentaRoutes from "./routes/cuentaRoutes.js";
import dispositivoRoutes from "./routes/dispositivoRoutes.js";
import credencialesRoutes from "./routes/credencialesRoutes.js"
import authRoutes from "./routes/authRoutes.js";
import espacioTrabajoRoutes from "./routes/espacioTrabajoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import licenciaRoutes from "./routes/licenciaRoutes.js";
import agendaRoutes from "./routes/agendaRoutes.js";
import mapaIpRoutes from "./routes/mapaIpRoutes.js";
import { proteger } from "./middleware/authMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

CuentasPadres.hasMany(CuentasHijas, {
  as: "hijas",
  foreignKey: "cuentaPadreId",
  onDelete: "CASCADE",
});

CuentasHijas.belongsTo(CuentasPadres, {
  as: "padre",
  foreignKey: "cuentaPadreId",
});

CuentasPadres.hasMany(Dispositivos, {
  as: "dispositivos",
  foreignKey: "cuentaPadreId",
  onDelete: "CASCADE",
});

CuentasHijas.hasMany(Dispositivos, {
  as: "dispositivos",
  foreignKey: "cuentaHijaId",
  onDelete: "CASCADE",
});

Dispositivos.belongsTo(CuentasHijas, {
  as: "cuentaHija",
  foreignKey: "cuentaHijaId",
});

Dispositivos.belongsTo(CuentasPadres, {
  as: "cuentaPadre",
  foreignKey: "cuentaPadreId",
});

Usuario.hasMany(EspacioTrabajo, {
  as: "espaciosTrabajo",
  foreignKey: "usuarioId",
  onDelete: "CASCADE",
});

EspacioTrabajo.belongsTo(Usuario, {
  as: "usuario",
  foreignKey: "usuarioId",
});

Usuario.hasMany(ActividadAgenda, {
  as: "actividadesAgenda",
  foreignKey: "usuarioId",
  onDelete: "CASCADE",
});

ActividadAgenda.belongsTo(Usuario, {
  as: "usuario",
  foreignKey: "usuarioId",
});

RedIp.hasMany(DireccionIp, {
  as: "ips",
  foreignKey: "redIpId",
  onDelete: "CASCADE",
});

DireccionIp.belongsTo(RedIp, {
  as: "red",
  foreignKey: "redIpId",
});

Usuario.hasMany(PasswordReset, {
  as: "recuperacionesPassword",
  foreignKey: "usuarioId",
  onDelete: "CASCADE",
});

PasswordReset.belongsTo(Usuario, {
  as: "usuario",
  foreignKey: "usuarioId",
});

Licencia.hasMany(LicenciaDispositivo, {
  as: "asignaciones",
  foreignKey: "licenciaId",
  onDelete: "CASCADE",
});

LicenciaDispositivo.belongsTo(Licencia, {
  as: "licencia",
  foreignKey: "licenciaId",
});

Dispositivos.hasMany(LicenciaDispositivo, {
  as: "licenciasAsignadas",
  foreignKey: "dispositivoId",
  onDelete: "CASCADE",
});

LicenciaDispositivo.belongsTo(Dispositivos, {
  as: "dispositivo",
  foreignKey: "dispositivoId",
});

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const FRONTEND = process.env.FRONTEND_URL;
const whitelist = [
  FRONTEND,
  ...(process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    console.log("Origin de la peticion:", origin);
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Error de CORS: origen no permitido"));
    }
  },
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
  exposedHeaders: ["Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const conectarDB = async () => {
  try {
    await db.authenticate();
    console.log("Conexion correcta a la base de datos");

    await prepararEsquemaMapaIp();

    const syncAlter = process.env.DB_SYNC_ALTER === "true";
    await db.sync(syncAlter ? { alter: true } : undefined);
    console.log("Tablas sincronizadas correctamente");

    await prepararSeguridadInicial();
  } catch (error) {
    console.error("Error en la base de datos:", error);
    process.exit(1);
  }
};

const prepararEsquemaMapaIp = async () => {
  const queryInterface = db.getQueryInterface();

  try {
    const tabla = await queryInterface.describeTable("redes_ip");

    if (tabla.redBase && !tabla.ipMadre) {
      await queryInterface.renameColumn("redes_ip", "redBase", "ipMadre");
    }

    const columnasObsoletas = ["nombre", "cidr", "gateway", "vlan", "area"];

    for (const columna of columnasObsoletas) {
      const tablaActual = await queryInterface.describeTable("redes_ip");

      if (tablaActual[columna]) {
        await queryInterface.removeColumn("redes_ip", columna);
      }
    }
  } catch (error) {
    if (error?.original?.code !== "ER_NO_SUCH_TABLE") {
      throw error;
    }
  }
};

const prepararSeguridadInicial = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@sistema.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin12345!";
  const codigo365 = process.env.CUENTAS_365_INITIAL_CODE || "123456";

  const totalUsuarios = await Usuario.count();

  if (totalUsuarios === 0) {
    await Usuario.create({
      nombre: process.env.ADMIN_NAME || "Administrador",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      rol: "admin",
    });

    console.log(`Usuario admin inicial: ${adminEmail}`);
  }

  const configuracion = await ConfiguracionSeguridad.findOne({
    where: { clave: "cuentas365_reveal_code" },
  });

  if (!configuracion) {
    await ConfiguracionSeguridad.create({
      clave: "cuentas365_reveal_code",
      valorHash: await bcrypt.hash(codigo365, 12),
    });

    console.log("Codigo inicial de visualizacion 365 configurado.");
  }
};

conectarDB();

app.use("/api/auth", authRoutes);
app.use("/api/cuentas", proteger, cuentaRoutes);
app.use("/api/dispositivos", proteger, dispositivoRoutes);
app.use("/api/credenciales", proteger, credencialesRoutes);
app.use("/api/trabajo", proteger, espacioTrabajoRoutes);
app.use("/api/usuarios", proteger, usuarioRoutes);
app.use("/api/licencias", proteger, licenciaRoutes);
app.use("/api/agenda", proteger, agendaRoutes);
app.use("/api/mapa-ip", proteger, mapaIpRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({ error: err.message, stack: err.stack });
});
