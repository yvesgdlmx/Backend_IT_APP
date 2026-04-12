import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/db.js";

import CuentasPadres from "./models/CuentasPadres.js";
import CuentasHijas from "./models/CuentasHijas.js";
import Dispositivos from "./models/Dispositivos.js";
import cuentaRoutes from "./routes/cuentaRoutes.js";
import dispositivoRoutes from "./routes/dispositivoRoutes.js";

dotenv.config();

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

const app = express();
app.use(express.json());

const FRONTEND = process.env.FRONTEND_URL;
const whitelist = [FRONTEND];

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
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const conectarDB = async () => {
  try {
    await db.authenticate();
    console.log("Conexion correcta a la base de datos");

    await db.sync({ alter: true });
    console.log("Tablas sincronizadas correctamente");
  } catch (error) {
    console.error("Error en la base de datos:", error);
    process.exit(1);
  }
};

conectarDB();

app.use("/api/cuentas", cuentaRoutes);
app.use("/api/dispositivos", dispositivoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({ error: err.message, stack: err.stack });
});
