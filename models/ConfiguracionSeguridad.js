import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ConfiguracionSeguridad = sequelize.define(
  "configuraciones_seguridad",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clave: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    valorHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actualizadoPor: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default ConfiguracionSeguridad;
