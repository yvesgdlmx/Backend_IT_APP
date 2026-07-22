import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LicenciaCierreMensual = sequelize.define(
  "licencia_cierres_mensuales",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    totalContratadas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalUtilizadas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalDisponibles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    porcentajeUso: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["anio", "mes"],
      },
    ],
    timestamps: true,
  }
);

export default LicenciaCierreMensual;
