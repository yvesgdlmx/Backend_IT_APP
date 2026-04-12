import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CuentasPadres = sequelize.define('cuentas_padres', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  fechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default CuentasPadres;
