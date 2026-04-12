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
    allowNull: false,
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
