import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const IncidenciaCierreMensual = sequelize.define(
  "incidencia_cierres_mensuales",
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
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalIncidencias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    abiertas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    enProceso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    resueltas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    canceladas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    criticas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sumaTiempoResolucionHoras: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    promedioResolucionHoras: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["usuarioId", "anio", "mes"],
      },
    ],
  }
);

export default IncidenciaCierreMensual;
