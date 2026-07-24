import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Dispositivos = sequelize.define('dispositivos', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  marca: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  serie: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tipoEquipo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombreSistema: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  area: {
    type: DataTypes.STRING,
  },
  usuarioActual: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estadoInventario: {
    type: DataTypes.ENUM("operacion", "resguardo", "baja", "mantenimiento"),
    allowNull: false,
    defaultValue: "operacion",
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cuentaHijaId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  cuentaPadreId: {
    type: DataTypes.UUID,
    allowNull: true,
  },

}, {
  timestamps: true,
});

export default Dispositivos;
