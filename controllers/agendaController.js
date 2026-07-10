import ActividadAgenda from "../models/ActividadAgenda.js";

const tiposPermitidos = ["tarea", "mantenimiento", "renovacion", "reunion", "recordatorio"];
const prioridadesPermitidas = ["baja", "media", "alta"];
const estadosPermitidos = ["pendiente", "completada", "cancelada"];
const entidadesPermitidas = ["ninguna", "licencia", "cuenta", "dispositivo", "credencial"];

const limpiarPayload = (body) => ({
  titulo: body.titulo?.trim(),
  descripcion: body.descripcion?.trim() || null,
  fecha: body.fecha || null,
  hora: body.hora || null,
  tipo: tiposPermitidos.includes(body.tipo) ? body.tipo : "tarea",
  prioridad: prioridadesPermitidas.includes(body.prioridad) ? body.prioridad : "media",
  estado: estadosPermitidos.includes(body.estado) ? body.estado : "pendiente",
  responsable: body.responsable?.trim() || null,
  entidadTipo: entidadesPermitidas.includes(body.entidadTipo) ? body.entidadTipo : "ninguna",
  entidadId: body.entidadId?.trim() || null,
  entidadNombre: body.entidadNombre?.trim() || null,
});

const buscarActividadUsuario = async (id, usuarioId) => {
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
    const actividad = await buscarActividadUsuario(req.params.id, req.usuario.id);

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada." });
    }

    const estado = estadosPermitidos.includes(req.body.estado) ? req.body.estado : "completada";

    await actividad.update({ estado });
    res.json(actividad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarActividadAgenda = async (req, res) => {
  try {
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
