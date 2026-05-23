import EspacioTrabajo from "../models/EspacioTrabajo.js";

const tiposPermitidos = ["actividad", "nota", "apunte"];
const prioridadesPermitidas = ["baja", "media", "alta"];
const estadosPermitidos = ["pendiente", "completada"];

const parseArchivos = (valor) => {
  try {
    const archivos = JSON.parse(valor || "[]");
    return Array.isArray(archivos) ? archivos : [];
  } catch {
    return [];
  }
};

const serializarItem = (item) => {
  const plano = item.toJSON();
  return {
    ...plano,
    archivos: parseArchivos(plano.archivos),
  };
};

const archivosSubidos = (files = []) =>
  files.map((file) => ({
    nombre: file.originalname,
    archivo: file.filename,
    url: `/uploads/trabajo/${file.filename}`,
    mime: file.mimetype,
    tipo: file.mimetype.startsWith("video/") ? "video" : "imagen",
    tamano: file.size,
  }));

const buscarItemUsuario = async (id, usuarioId) => {
  const item = await EspacioTrabajo.findOne({
    where: {
      id,
      usuarioId,
    },
  });

  return item;
};

export const obtenerItemsTrabajo = async (req, res) => {
  try {
    const where = { usuarioId: req.usuario.id };

    if (tiposPermitidos.includes(req.query.tipo)) {
      where.tipo = req.query.tipo;
    }

    const items = await EspacioTrabajo.findAll({
      where,
      order: [
        ["estado", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(items.map(serializarItem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearItemTrabajo = async (req, res) => {
  try {
    const { tipo, titulo, contenido, prioridad, fechaLimite } = req.body;

    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({ error: "Tipo no valido." });
    }

    if (!titulo?.trim()) {
      return res.status(400).json({ error: "El titulo es obligatorio." });
    }

    const item = await EspacioTrabajo.create({
      usuarioId: req.usuario.id,
      tipo,
      titulo: titulo.trim(),
      contenido: contenido?.trim() || "",
      prioridad: prioridadesPermitidas.includes(prioridad) ? prioridad : "media",
      fechaLimite: fechaLimite || null,
      archivos: JSON.stringify(archivosSubidos(req.files)),
    });

    res.status(201).json(serializarItem(item));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarItemTrabajo = async (req, res) => {
  try {
    const item = await buscarItemUsuario(req.params.id, req.usuario.id);

    if (!item) {
      return res.status(404).json({ error: "Registro no encontrado." });
    }

    const archivosActuales = parseArchivos(item.archivos);
    const nuevosArchivos = archivosSubidos(req.files);

    const cambios = {};

    if (req.body.titulo !== undefined) cambios.titulo = req.body.titulo.trim();
    if (req.body.contenido !== undefined) cambios.contenido = req.body.contenido.trim();
    if (prioridadesPermitidas.includes(req.body.prioridad)) cambios.prioridad = req.body.prioridad;
    if (estadosPermitidos.includes(req.body.estado)) cambios.estado = req.body.estado;
    if (req.body.fechaLimite !== undefined) cambios.fechaLimite = req.body.fechaLimite || null;

    if (nuevosArchivos.length > 0) {
      cambios.archivos = JSON.stringify([...archivosActuales, ...nuevosArchivos]);
    }

    await item.update(cambios);

    res.json(serializarItem(item));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const completarActividad = async (req, res) => {
  try {
    const item = await buscarItemUsuario(req.params.id, req.usuario.id);

    if (!item) {
      return res.status(404).json({ error: "Actividad no encontrada." });
    }

    if (item.tipo !== "actividad") {
      return res.status(400).json({ error: "Solo las actividades se pueden completar." });
    }

    await item.update({
      estado: item.estado === "completada" ? "pendiente" : "completada",
    });

    res.json(serializarItem(item));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarItemTrabajo = async (req, res) => {
  try {
    const item = await buscarItemUsuario(req.params.id, req.usuario.id);

    if (!item) {
      return res.status(404).json({ error: "Registro no encontrado." });
    }

    await item.destroy();

    res.json({ mensaje: "Registro eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
