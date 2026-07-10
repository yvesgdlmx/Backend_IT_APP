import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const RedIp = sequelize.define(
  "redes_ip",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ipMadre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("activa", "inactiva"),
      allowNull: false,
      defaultValue: "activa",
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

export default RedIp;
