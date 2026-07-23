import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const MantenimientoCierreMensual = sequelize.define(
  "mantenimiento_cierres_mensuales",
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
    programados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    realizados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    pendientes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    cancelados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fueraDeTiempo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    porcentajeCumplimiento: {
      type: DataTypes.DECIMAL(6, 2),
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

export default MantenimientoCierreMensual;
