import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SeguridadEquipoCierreMensual = sequelize.define(
  "seguridad_equipo_cierres_mensuales",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "usuarios", key: "id" },
    },
    anio: { type: DataTypes.INTEGER, allowNull: false },
    mes: { type: DataTypes.INTEGER, allowNull: false },
    totalEquipos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    vigentes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pendientes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    noRevisados: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    noAplica: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    porcentajeVigencia: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    comentario: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["usuarioId", "anio", "mes"] }],
  }
);

export default SeguridadEquipoCierreMensual;
