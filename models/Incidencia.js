import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Incidencia = sequelize.define(
  "incidencias",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    folio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sistema: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "General",
    },
    tipo: {
      type: DataTypes.ENUM("software", "hardware", "acceso", "sistema"),
      allowNull: false,
      defaultValue: "software",
    },
    categoria: {
      type: DataTypes.ENUM("acceso", "contrasena", "permisos", "caida", "equipo", "licencia", "otro"),
      allowNull: false,
      defaultValue: "acceso",
    },
    usuarioAfectado: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prioridad: {
      type: DataTypes.ENUM("baja", "media", "alta", "critica"),
      allowNull: false,
      defaultValue: "media",
    },
    estado: {
      type: DataTypes.ENUM("abierta", "en_proceso", "resuelta", "cancelada"),
      allowNull: false,
      defaultValue: "abierta",
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fechaIncidencia: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fechaResolucion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tiempoResolucionHoras: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    comentarioCierre: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Incidencia;
