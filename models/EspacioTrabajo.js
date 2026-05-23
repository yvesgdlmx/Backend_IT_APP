import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const EspacioTrabajo = sequelize.define(
  "espacios_trabajo",
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
    tipo: {
      type: DataTypes.ENUM("actividad", "nota", "apunte"),
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "completada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    prioridad: {
      type: DataTypes.ENUM("baja", "media", "alta"),
      allowNull: false,
      defaultValue: "media",
    },
    fechaLimite: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    archivos: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
  },
  {
    timestamps: true,
  }
);

export default EspacioTrabajo;
