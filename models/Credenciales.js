import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Credenciales = sequelize.define("credenciales", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  usuario: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  portal: {
    type: DataTypes.STRING,
  },

  estado: {
    type: DataTypes.STRING,
    defaultValue: "Activa",
  },

  mfa: {
    type: DataTypes.STRING,
    defaultValue: "no",
  },

  fechaCambio: {
    type: DataTypes.DATEONLY,
  },

  responsable: {
    type: DataTypes.STRING,
  },

  notas: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
});

export default Credenciales;