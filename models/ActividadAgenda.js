import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ActividadAgenda = sequelize.define(
  "actividades_agenda",
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
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM("tarea", "mantenimiento", "renovacion", "reunion", "recordatorio"),
      allowNull: false,
      defaultValue: "tarea",
    },
    prioridad: {
      type: DataTypes.ENUM("baja", "media", "alta"),
      allowNull: false,
      defaultValue: "media",
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "completada", "cancelada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entidadTipo: {
      type: DataTypes.ENUM("ninguna", "licencia", "cuenta", "dispositivo", "credencial"),
      allowNull: false,
      defaultValue: "ninguna",
    },
    entidadId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entidadNombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default ActividadAgenda;
