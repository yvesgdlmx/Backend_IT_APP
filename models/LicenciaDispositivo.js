import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LicenciaDispositivo = sequelize.define(
  "licencia_dispositivos",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    licenciaId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dispositivoId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("activa", "liberada"),
      allowNull: false,
      defaultValue: "activa",
    },
    fechaAsignacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fechaLiberacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default LicenciaDispositivo;
