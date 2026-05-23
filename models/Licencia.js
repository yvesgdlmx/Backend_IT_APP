import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Licencia = sequelize.define(
  "licencias",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "software",
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cantidadTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    cantidadUsada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    costo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    moneda: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "MXN",
    },
    fechaCompra: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    renovacion: {
      type: DataTypes.ENUM("mensual", "anual", "unica", "otro"),
      allowNull: false,
      defaultValue: "anual",
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM("activa", "por_vencer", "vencida", "inactiva"),
      allowNull: false,
      defaultValue: "activa",
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

export default Licencia;
