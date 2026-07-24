import Dispositivos from "../models/Dispositivos.js";
import SeguridadEquipoRevision from "../models/SeguridadEquipoRevision.js";
import SeguridadEquipoCierreMensual from "../models/SeguridadEquipoCierreMensual.js";

const estadosPermitidos = ["vigente", "pendiente", "no_revisado", "no_aplica"];

const limpiarPeriodo = (valor) => {
  const fecha = new Date();
  const anio = Number(valor.anio || fecha.getFullYear());
  const mes = Number(valor.mes || fecha.getMonth() + 1);
  return {
    anio: Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : fecha.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : fecha.getMonth() + 1,
  };
};

const serializarCierre = (cierre) => ({
  id: cierre.id,
  anio: cierre.anio,
  mes: cierre.mes,
  totalEquipos: Number(cierre.totalEquipos || 0),
  vigentes: Number(cierre.vigentes || 0),
  pendientes: Number(cierre.pendientes || 0),
  noRevisados: Number(cierre.noRevisados || 0),
  noAplica: Number(cierre.noAplica || 0),
  porcentajeVigencia: Number(cierre.porcentajeVigencia || 0),
  comentario: cierre.comentario || "",
});

const asegurarRevisiones = async (usuarioId, anio, mes) => {
  const dispositivos = await Dispositivos.findAll({ order: [["createdAt", "DESC"]] });
  const existentes = await SeguridadEquipoRevision.findAll({ where: { usuarioId, anio, mes } });
  const idsExistentes = new Set(existentes.map((item) => item.dispositivoId));

  for (const dispositivo of dispositivos) {
    if (!idsExistentes.has(dispositivo.id)) {
      await SeguridadEquipoRevision.create({
        usuarioId,
        dispositivoId: dispositivo.id,
        anio,
        mes,
      });
    }
  }

  return SeguridadEquipoRevision.findAll({
    where: { usuarioId, anio, mes },
    include: [{ model: Dispositivos, as: "dispositivo" }],
    order: [["createdAt", "DESC"]],
  });
};

const calcularResumen = async (usuarioId, anio, mes) => {
  const revisiones = await asegurarRevisiones(usuarioId, anio, mes);
  const totalEquipos = revisiones.length;
  const vigentes = revisiones.filter((item) => item.estado === "vigente").length;
  const pendientes = revisiones.filter((item) => item.estado === "pendiente").length;
  const noRevisados = revisiones.filter((item) => item.estado === "no_revisado").length;
  const noAplica = revisiones.filter((item) => item.estado === "no_aplica").length;
  const base = totalEquipos;
  const porcentajeVigencia = base ? Number(((vigentes / base) * 100).toFixed(2)) : 0;

  return { anio, mes, totalEquipos, vigentes, pendientes, noRevisados, noAplica, porcentajeVigencia, revisiones };
};

export const obtenerRevisionSeguridad = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.query);
    const resumen = await calcularResumen(req.usuario.id, anio, mes);

    res.json({
      ...resumen,
      revisiones: resumen.revisiones.map((item) => ({
        id: item.id,
        estado: item.estado,
        observacion: item.observacion || "",
        dispositivo: item.dispositivo
          ? {
              id: item.dispositivo.id,
              nombreSistema: item.dispositivo.nombreSistema,
              marca: item.dispositivo.marca,
              tipoEquipo: item.dispositivo.tipoEquipo,
              area: item.dispositivo.area,
              usuarioActual: item.dispositivo.usuarioActual,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarRevisionSeguridad = async (req, res) => {
  try {
    const revision = await SeguridadEquipoRevision.findOne({
      where: { id: req.params.id, usuarioId: req.usuario.id },
    });

    if (!revision) return res.status(404).json({ error: "Revision no encontrada." });

    await revision.update({
      estado: estadosPermitidos.includes(req.body.estado) ? req.body.estado : revision.estado,
      observacion: req.body.observacion?.trim() || null,
    });

    res.json(revision);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerCierresSeguridad = async (req, res) => {
  try {
    const { anio } = limpiarPeriodo(req.query);
    const cierres = await SeguridadEquipoCierreMensual.findAll({
      where: { usuarioId: req.usuario.id, anio },
      order: [["mes", "ASC"]],
    });
    res.json(cierres.map(serializarCierre));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const guardarCierreSeguridad = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.body);
    const resumen = await calcularResumen(req.usuario.id, anio, mes);
    const payload = {
      usuarioId: req.usuario.id,
      anio,
      mes,
      totalEquipos: resumen.totalEquipos,
      vigentes: resumen.vigentes,
      pendientes: resumen.pendientes,
      noRevisados: resumen.noRevisados,
      noAplica: resumen.noAplica,
      porcentajeVigencia: resumen.porcentajeVigencia,
      comentario: req.body.comentario?.trim() || null,
    };
    const [cierre, creado] = await SeguridadEquipoCierreMensual.findOrCreate({
      where: { usuarioId: req.usuario.id, anio, mes },
      defaults: payload,
    });

    if (!creado) await cierre.update(payload);
    res.status(201).json(serializarCierre(cierre));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
