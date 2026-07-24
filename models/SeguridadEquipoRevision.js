import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SeguridadEquipoRevision = sequelize.define(
  "seguridad_equipo_revisiones",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "usuarios", key: "id" },
    },
    dispositivoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "dispositivos", key: "id" },
    },
    anio: { type: DataTypes.INTEGER, allowNull: false },
    mes: { type: DataTypes.INTEGER, allowNull: false },
    estado: {
      type: DataTypes.ENUM("vigente", "pendiente", "no_revisado", "no_aplica"),
      allowNull: false,
      defaultValue: "no_revisado",
    },
    observacion: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["usuarioId", "dispositivoId", "anio", "mes"] }],
  }
);

export default SeguridadEquipoRevision;
