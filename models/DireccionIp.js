import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const DireccionIp = sequelize.define(
  "direcciones_ip",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    redIpId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "redes_ip",
        key: "id",
      },
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    equipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipoEquipo: {
      type: DataTypes.ENUM("pc", "laptop", "servidor", "impresora", "camara", "router", "access_point", "telefono", "otro"),
      allowNull: false,
      defaultValue: "otro",
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mac: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM("disponible", "ocupada", "reservada", "bloqueada"),
      allowNull: false,
      defaultValue: "disponible",
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["redIpId", "direccion"],
      },
    ],
  }
);

export default DireccionIp;
