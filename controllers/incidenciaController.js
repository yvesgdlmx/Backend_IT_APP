import { Op } from "sequelize";
import Incidencia from "../models/Incidencia.js";
import IncidenciaCierreMensual from "../models/IncidenciaCierreMensual.js";

const tiposPermitidos = ["software", "hardware", "acceso", "sistema"];
const categoriasPermitidas = ["acceso", "contrasena", "permisos", "caida", "equipo", "licencia", "otro"];
const prioridadesPermitidas = ["baja", "media", "alta", "critica"];
const estadosPermitidos = ["abierta", "en_proceso", "resuelta", "cancelada"];

const calcularHoras = (inicio, fin) => {
  if (!inicio || !fin) return null;

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);

  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) return null;

  const horas = (fechaFin - fechaInicio) / (1000 * 60 * 60);
  return horas >= 0 ? Number(horas.toFixed(2)) : null;
};

const limpiarPayload = (body) => {
  const estado = estadosPermitidos.includes(body.estado) ? body.estado : "abierta";
  const fechaIncidencia = body.fechaIncidencia || new Date().toISOString();
  const fechaResolucion = estado === "resuelta" ? body.fechaResolucion || new Date().toISOString() : null;

  return {
    titulo: body.titulo?.trim(),
    sistema: body.sistema?.trim() || "General",
    tipo: tiposPermitidos.includes(body.tipo) ? body.tipo : "software",
    categoria: categoriasPermitidas.includes(body.categoria) ? body.categoria : "acceso",
    usuarioAfectado: body.usuarioAfectado?.trim() || null,
    area: body.area?.trim() || null,
    descripcion: body.descripcion?.trim() || null,
    prioridad: prioridadesPermitidas.includes(body.prioridad) ? body.prioridad : "media",
    estado,
    fechaIncidencia,
    fechaResolucion,
    tiempoResolucionHoras: calcularHoras(fechaIncidencia, fechaResolucion),
  };
};

const generarFolioIncidencia = async (usuarioId, fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  const anio = Number.isNaN(fecha.getTime()) ? new Date().getFullYear() : fecha.getFullYear();
  const inicio = new Date(anio, 0, 1, 0, 0, 0);
  const fin = new Date(anio, 11, 31, 23, 59, 59);
  const totalAnio = await Incidencia.count({
    where: {
      usuarioId,
      fechaIncidencia: {
        [Op.between]: [inicio, fin],
      },
    },
  });

  return `INC-${anio}-${String(totalAnio + 1).padStart(4, "0")}`;
};

const limpiarPeriodo = (query) => {
  const fecha = new Date();
  const anio = Number(query.anio || fecha.getFullYear());
  const mes = Number(query.mes || fecha.getMonth() + 1);

  return {
    anio: Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : fecha.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : fecha.getMonth() + 1,
  };
};

const rangoMes = (anio, mes) => {
  const inicio = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0));
  const fin = new Date(Date.UTC(anio, mes, 0, 23, 59, 59));

  return { inicio, fin };
};

const serializarCierre = (cierre) => ({
  id: cierre.id,
  anio: cierre.anio,
  mes: cierre.mes,
  totalIncidencias: Number(cierre.totalIncidencias || 0),
  abiertas: Number(cierre.abiertas || 0),
  enProceso: Number(cierre.enProceso || 0),
  resueltas: Number(cierre.resueltas || 0),
  canceladas: Number(cierre.canceladas || 0),
  criticas: Number(cierre.criticas || 0),
  sumaTiempoResolucionHoras: Number(cierre.sumaTiempoResolucionHoras || 0),
  promedioResolucionHoras: Number(cierre.promedioResolucionHoras || 0),
  comentario: cierre.comentario || "",
  createdAt: cierre.createdAt,
  updatedAt: cierre.updatedAt,
});

const calcularResumenIncidencias = async (usuarioId, anio, mes) => {
  const { inicio, fin } = rangoMes(anio, mes);
  const incidencias = await Incidencia.findAll({
    where: {
      usuarioId,
      fechaIncidencia: {
        [Op.between]: [inicio, fin],
      },
    },
    order: [
      ["fechaIncidencia", "DESC"],
      ["createdAt", "DESC"],
    ],
  });

  const totalIncidencias = incidencias.length;
  const abiertas = incidencias.filter((item) => item.estado === "abierta").length;
  const enProceso = incidencias.filter((item) => item.estado === "en_proceso").length;
  const resueltas = incidencias.filter((item) => item.estado === "resuelta").length;
  const canceladas = incidencias.filter((item) => item.estado === "cancelada").length;
  const criticas = incidencias.filter((item) => item.prioridad === "critica").length;
  const sumaTiempoResolucionHoras = incidencias
    .filter((item) => item.estado === "resuelta")
    .reduce((acc, item) => acc + Number(item.tiempoResolucionHoras || 0), 0);
  const promedioResolucionHoras = resueltas
    ? Number((sumaTiempoResolucionHoras / resueltas).toFixed(2))
    : 0;

  return {
    anio,
    mes,
    totalIncidencias,
    abiertas,
    enProceso,
    resueltas,
    canceladas,
    criticas,
    sumaTiempoResolucionHoras: Number(sumaTiempoResolucionHoras.toFixed(2)),
    promedioResolucionHoras,
    incidencias,
  };
};

const buscarIncidenciaUsuario = async (id, usuarioId) =>
  Incidencia.findOne({
    where: {
      id,
      usuarioId,
    },
  });

export const obtenerIncidencias = async (req, res) => {
  try {
    const where = { usuarioId: req.usuario.id };

    if (estadosPermitidos.includes(req.query.estado)) where.estado = req.query.estado;
    if (tiposPermitidos.includes(req.query.tipo)) where.tipo = req.query.tipo;

    const incidencias = await Incidencia.findAll({
      where,
      order: [
        ["fechaIncidencia", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(incidencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearIncidencia = async (req, res) => {
  try {
    const payload = limpiarPayload(req.body);

    if (!payload.titulo) return res.status(400).json({ error: "El titulo es obligatorio." });

    const incidencia = await Incidencia.create({
      ...payload,
      folio: await generarFolioIncidencia(req.usuario.id, payload.fechaIncidencia),
      usuarioId: req.usuario.id,
    });

    res.status(201).json(incidencia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarIncidencia = async (req, res) => {
  try {
    const incidencia = await buscarIncidenciaUsuario(req.params.id, req.usuario.id);

    if (!incidencia) return res.status(404).json({ error: "Incidencia no encontrada." });

    const payload = limpiarPayload(req.body);

    if (!payload.titulo) return res.status(400).json({ error: "El titulo es obligatorio." });

    await incidencia.update(payload);
    res.json(incidencia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cambiarEstadoIncidencia = async (req, res) => {
  try {
    const incidencia = await buscarIncidenciaUsuario(req.params.id, req.usuario.id);

    if (!incidencia) return res.status(404).json({ error: "Incidencia no encontrada." });

    const estado = estadosPermitidos.includes(req.body.estado) ? req.body.estado : "resuelta";
    const fechaResolucion = estado === "resuelta" ? req.body.fechaResolucion || new Date().toISOString() : null;

    await incidencia.update({
      estado,
      fechaResolucion,
      tiempoResolucionHoras: calcularHoras(incidencia.fechaIncidencia, fechaResolucion),
    });

    res.json(incidencia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarIncidencia = async (req, res) => {
  try {
    const incidencia = await buscarIncidenciaUsuario(req.params.id, req.usuario.id);

    if (!incidencia) return res.status(404).json({ error: "Incidencia no encontrada." });

    await incidencia.destroy();
    res.json({ mensaje: "Incidencia eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCierresIncidencias = async (req, res) => {
  try {
    const { anio } = limpiarPeriodo(req.query);
    const cierres = await IncidenciaCierreMensual.findAll({
      where: {
        usuarioId: req.usuario.id,
        anio,
      },
      order: [["mes", "ASC"]],
    });

    res.json(cierres.map(serializarCierre));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const previsualizarCierreIncidencias = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.query);
    const resumen = await calcularResumenIncidencias(req.usuario.id, anio, mes);

    res.json({
      ...resumen,
      incidencias: resumen.incidencias.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        tipo: item.tipo,
        prioridad: item.prioridad,
        estado: item.estado,
        fechaIncidencia: item.fechaIncidencia,
        fechaResolucion: item.fechaResolucion,
        tiempoResolucionHoras: Number(item.tiempoResolucionHoras || 0),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const guardarCierreIncidencias = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.body);
    const resumen = await calcularResumenIncidencias(req.usuario.id, anio, mes);
    const payload = {
      usuarioId: req.usuario.id,
      anio,
      mes,
      totalIncidencias: resumen.totalIncidencias,
      abiertas: resumen.abiertas,
      enProceso: resumen.enProceso,
      resueltas: resumen.resueltas,
      canceladas: resumen.canceladas,
      criticas: resumen.criticas,
      sumaTiempoResolucionHoras: resumen.sumaTiempoResolucionHoras,
      promedioResolucionHoras: resumen.promedioResolucionHoras,
      comentario: req.body.comentario?.trim() || null,
    };

    const [cierre, creado] = await IncidenciaCierreMensual.findOrCreate({
      where: {
        usuarioId: req.usuario.id,
        anio,
        mes,
      },
      defaults: payload,
    });

    if (!creado) {
      await cierre.update(payload);
    }

    res.status(201).json(serializarCierre(cierre));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
