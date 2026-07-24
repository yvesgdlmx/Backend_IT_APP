import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const InventarioEquipoCierreMensual = sequelize.define(
  "inventario_equipo_cierres_mensuales",
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
    totalRegistrados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalOperacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    porcentajeInventario: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    detalle: {
      type: DataTypes.JSON,
      allowNull: true,
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

export default InventarioEquipoCierreMensual;
