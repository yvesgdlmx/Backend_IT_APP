import ActividadAgenda from "../models/ActividadAgenda.js";
import MantenimientoCierreMensual from "../models/MantenimientoCierreMensual.js";
import { DataTypes, Op } from "sequelize";

const tiposPermitidos = ["tarea", "mantenimiento", "renovacion", "reunion", "recordatorio"];
const prioridadesPermitidas = ["baja", "media", "alta"];
const estadosPermitidos = ["pendiente", "completada", "cancelada"];
const entidadesPermitidas = ["ninguna", "licencia", "cuenta", "dispositivo", "credencial"];
let esquemaAgendaPromise = null;

const asegurarEsquemaAgenda = async () => {
  if (!esquemaAgendaPromise) {
    esquemaAgendaPromise = (async () => {
      const queryInterface = ActividadAgenda.sequelize.getQueryInterface();
      const tablaAgenda = ActividadAgenda.getTableName();

      try {
        const tabla = await queryInterface.describeTable(tablaAgenda);

        if (!tabla.fechaRealizacion) {
          await queryInterface.addColumn(tablaAgenda, "fechaRealizacion", {
            type: DataTypes.DATEONLY,
            allowNull: true,
          });
        }
      } catch (error) {
        const tablaNoExiste =
          error?.original?.code === "ER_NO_SUCH_TABLE" ||
          error?.message?.includes(`No description found for "${tablaAgenda}" table`);
        const columnaYaExiste = error?.original?.code === "ER_DUP_FIELDNAME";

        if (!tablaNoExiste && !columnaYaExiste) {
          throw error;
        }
      }
    })();
  }

  try {
    await esquemaAgendaPromise;
  } catch (error) {
    esquemaAgendaPromise = null;
    throw error;
  }
};

const limpiarPayload = (body) => ({
  titulo: body.titulo?.trim(),
  descripcion: body.descripcion?.trim() || null,
  fecha: body.fecha || null,
  hora: body.hora || null,
  tipo: tiposPermitidos.includes(body.tipo) ? body.tipo : "tarea",
  prioridad: prioridadesPermitidas.includes(body.prioridad) ? body.prioridad : "media",
  estado: estadosPermitidos.includes(body.estado) ? body.estado : "pendiente",
  fechaRealizacion: body.fechaRealizacion || null,
  responsable: body.responsable?.trim() || null,
  entidadTipo: entidadesPermitidas.includes(body.entidadTipo) ? body.entidadTipo : "ninguna",
  entidadId: body.entidadId?.trim() || null,
  entidadNombre: body.entidadNombre?.trim() || null,
});

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
  const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const finDate = new Date(anio, mes, 0);
  const fin = `${anio}-${String(mes).padStart(2, "0")}-${String(finDate.getDate()).padStart(2, "0")}`;

  return { inicio, fin };
};

const calcularResumenMantenimientos = async (usuarioId, anio, mes) => {
  await asegurarEsquemaAgenda();

  const { inicio, fin } = rangoMes(anio, mes);
  const mantenimientos = await ActividadAgenda.findAll({
    where: {
      usuarioId,
      tipo: "mantenimiento",
      fecha: {
        [Op.between]: [inicio, fin],
      },
    },
    order: [
      ["fecha", "ASC"],
      ["hora", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  const programados = mantenimientos.length;
  const realizados = mantenimientos.filter((item) => item.estado === "completada").length;
  const cancelados = mantenimientos.filter((item) => item.estado === "cancelada").length;
  const pendientes = mantenimientos.filter((item) => item.estado === "pendiente").length;
  const fueraDeTiempo = mantenimientos.filter(
    (item) =>
      item.estado === "completada" &&
      item.fechaRealizacion &&
      item.fecha &&
      item.fechaRealizacion > item.fecha
  ).length;
  const porcentajeCumplimiento = programados ? Number(((realizados / programados) * 100).toFixed(2)) : 0;

  return {
    anio,
    mes,
    programados,
    realizados,
    pendientes,
    cancelados,
    fueraDeTiempo,
    porcentajeCumplimiento,
    mantenimientos,
  };
};

const serializarCierreMantenimiento = (cierre) => ({
  id: cierre.id,
  anio: cierre.anio,
  mes: cierre.mes,
  programados: Number(cierre.programados || 0),
  realizados: Number(cierre.realizados || 0),
  pendientes: Number(cierre.pendientes || 0),
  cancelados: Number(cierre.cancelados || 0),
  fueraDeTiempo: Number(cierre.fueraDeTiempo || 0),
  porcentajeCumplimiento: Number(cierre.porcentajeCumplimiento || 0),
  comentario: cierre.comentario || "",
  createdAt: cierre.createdAt,
  updatedAt: cierre.updatedAt,
});

const buscarActividadUsuario = async (id, usuarioId) => {
  await asegurarEsquemaAgenda();

  const actividad = await ActividadAgenda.findOne({
    where: {
      id,
      usuarioId,
    },
  });

  return actividad;
};

export const obtenerActividadesAgenda = async (req, res) => {
  try {
    await asegurarEsquemaAgenda();

    const where = { usuarioId: req.usuario.id };

    if (estadosPermitidos.includes(req.query.estado)) {
      where.estado = req.query.estado;
    }

    if (tiposPermitidos.includes(req.query.tipo)) {
      where.tipo = req.query.tipo;
    }

    const actividades = await ActividadAgenda.findAll({
      where,
      order: [
        ["fecha", "ASC"],
        ["hora", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearActividadAgenda = async (req, res) => {
  try {
    await asegurarEsquemaAgenda();

    const payload = limpiarPayload(req.body);

    if (!payload.titulo) {
      return res.status(400).json({ error: "El titulo es obligatorio." });
    }

    if (!payload.fecha) {
      return res.status(400).json({ error: "La fecha es obligatoria." });
    }

    const actividad = await ActividadAgenda.create({
      ...payload,
      usuarioId: req.usuario.id,
    });

    res.status(201).json(actividad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarActividadAgenda = async (req, res) => {
  try {
    await asegurarEsquemaAgenda();

    const actividad = await buscarActividadUsuario(req.params.id, req.usuario.id);

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada." });
    }

    const payload = limpiarPayload(req.body);

    if (!payload.titulo) {
      return res.status(400).json({ error: "El titulo es obligatorio." });
    }

    if (!payload.fecha) {
      return res.status(400).json({ error: "La fecha es obligatoria." });
    }

    await actividad.update(payload);
    res.json(actividad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cambiarEstadoActividadAgenda = async (req, res) => {
  try {
    await asegurarEsquemaAgenda();

    const actividad = await buscarActividadUsuario(req.params.id, req.usuario.id);

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada." });
    }

    const estado = estadosPermitidos.includes(req.body.estado) ? req.body.estado : "completada";
    const cambios = { estado };

    if (estado === "completada") {
      cambios.fechaRealizacion = req.body.fechaRealizacion || actividad.fechaRealizacion || new Date().toISOString().slice(0, 10);
    } else {
      cambios.fechaRealizacion = null;
    }

    await actividad.update(cambios);
    res.json(actividad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarActividadAgenda = async (req, res) => {
  try {
    await asegurarEsquemaAgenda();

    const actividad = await buscarActividadUsuario(req.params.id, req.usuario.id);

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada." });
    }

    await actividad.destroy();

    res.json({ mensaje: "Actividad eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCierresMantenimientos = async (req, res) => {
  try {
    const { anio } = limpiarPeriodo(req.query);

    const cierres = await MantenimientoCierreMensual.findAll({
      where: {
        usuarioId: req.usuario.id,
        anio,
      },
      order: [["mes", "ASC"]],
    });

    res.json(cierres.map(serializarCierreMantenimiento));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const previsualizarCierreMantenimientos = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.query);
    const resumen = await calcularResumenMantenimientos(req.usuario.id, anio, mes);

    res.json({
      ...resumen,
      mantenimientos: resumen.mantenimientos.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        fecha: item.fecha,
        fechaRealizacion: item.fechaRealizacion,
        estado: item.estado,
        responsable: item.responsable,
        entidadNombre: item.entidadNombre,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const guardarCierreMantenimientos = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.body);
    const resumen = await calcularResumenMantenimientos(req.usuario.id, anio, mes);
    const payload = {
      usuarioId: req.usuario.id,
      anio,
      mes,
      programados: resumen.programados,
      realizados: resumen.realizados,
      pendientes: resumen.pendientes,
      cancelados: resumen.cancelados,
      fueraDeTiempo: resumen.fueraDeTiempo,
      porcentajeCumplimiento: resumen.porcentajeCumplimiento,
      comentario: req.body.comentario?.trim() || null,
    };

    const [cierre, creado] = await MantenimientoCierreMensual.findOrCreate({
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

    res.status(201).json(serializarCierreMantenimiento(cierre));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
