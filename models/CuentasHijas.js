import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CuentasHijas = sequelize.define('Cuentas_hijas', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fechaVencimiento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cuentaPadreId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cuentas_padres',
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

export default CuentasHijas;
