import Licencia from "../models/Licencia.js";
import Dispositivos from "../models/Dispositivos.js";
import LicenciaDispositivo from "../models/LicenciaDispositivo.js";

const estadosPermitidos = ["activa", "por_vencer", "vencida", "inactiva"];
const renovacionesPermitidas = ["mensual", "anual", "unica", "otro"];

const limpiarPayload = (body) => ({
  nombre: body.nombre?.trim(),
  proveedor: body.proveedor?.trim(),
  categoria: body.categoria?.trim() || "software",
  plan: body.plan?.trim() || null,
  cantidadTotal: Number(body.cantidadTotal) || 1,
  cantidadUsada: Number(body.cantidadUsada) || 0,
  costo: body.costo === "" || body.costo === undefined ? null : Number(body.costo),
  moneda: body.moneda?.trim()?.toUpperCase() || "MXN",
  fechaCompra: body.fechaCompra || null,
  fechaVencimiento: body.fechaVencimiento || null,
  renovacion: renovacionesPermitidas.includes(body.renovacion) ? body.renovacion : "anual",
  responsable: body.responsable?.trim() || null,
  estado: estadosPermitidos.includes(body.estado) ? body.estado : "activa",
  notas: body.notas?.trim() || null,
});

const includeAsignaciones = [
  {
    model: LicenciaDispositivo,
    as: "asignaciones",
    where: { estado: "activa" },
    required: false,
    include: [
      {
        model: Dispositivos,
        as: "dispositivo",
        attributes: ["id", "nombreSistema", "marca", "tipoEquipo", "area", "usuarioActual"],
      },
    ],
  },
];

const serializarLicencia = (licencia) => {
  const json = licencia.toJSON();
  const asignacionesActivas = Array.isArray(json.asignaciones) ? json.asignaciones : [];

  return {
    ...json,
    cantidadUsada: asignacionesActivas.length,
    cantidadDisponible: Math.max(Number(json.cantidadTotal || 0) - asignacionesActivas.length, 0),
    porcentajeUso:
      Number(json.cantidadTotal || 0) > 0
        ? Number(((asignacionesActivas.length / Number(json.cantidadTotal)) * 100).toFixed(2))
        : 0,
  };
};

export const obtenerLicencias = async (req, res) => {
  try {
    const licencias = await Licencia.findAll({
      include: includeAsignaciones,
      order: [["createdAt", "DESC"]],
    });

    res.json(licencias.map(serializarLicencia));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearLicencia = async (req, res) => {
  try {
    const payload = limpiarPayload(req.body);

    if (!payload.nombre || !payload.proveedor) {
      return res.status(400).json({ error: "Nombre y proveedor son obligatorios." });
    }

    if (payload.cantidadUsada > payload.cantidadTotal) {
      return res.status(400).json({ error: "Las licencias usadas no pueden superar el total." });
    }

    const licencia = await Licencia.create({ ...payload, cantidadUsada: 0 });
    const licenciaCompleta = await Licencia.findByPk(licencia.id, {
      include: includeAsignaciones,
    });

    res.status(201).json(serializarLicencia(licenciaCompleta));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarLicencia = async (req, res) => {
  try {
    const licencia = await Licencia.findByPk(req.params.id);

    if (!licencia) {
      return res.status(404).json({ error: "Licencia no encontrada." });
    }

    const payload = limpiarPayload(req.body);

    if (!payload.nombre || !payload.proveedor) {
      return res.status(400).json({ error: "Nombre y proveedor son obligatorios." });
    }

    if (payload.cantidadUsada > payload.cantidadTotal) {
      return res.status(400).json({ error: "Las licencias usadas no pueden superar el total." });
    }

    await licencia.update(payload);

    const licenciaActualizada = await Licencia.findByPk(licencia.id, {
      include: includeAsignaciones,
    });

    res.json(serializarLicencia(licenciaActualizada));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarLicencia = async (req, res) => {
  try {
    const licencia = await Licencia.findByPk(req.params.id);

    if (!licencia) {
      return res.status(404).json({ error: "Licencia no encontrada." });
    }

    await licencia.destroy();
    res.json({ mensaje: "Licencia eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const asignarDispositivoLicencia = async (req, res) => {
  try {
    const licencia = await Licencia.findByPk(req.params.id);

    if (!licencia) {
      return res.status(404).json({ error: "Licencia no encontrada." });
    }

    const dispositivo = await Dispositivos.findByPk(req.body.dispositivoId);

    if (!dispositivo) {
      return res.status(404).json({ error: "Dispositivo no encontrado." });
    }

    const asignacionesActivas = await LicenciaDispositivo.count({
      where: { licenciaId: licencia.id, estado: "activa" },
    });

    if (asignacionesActivas >= Number(licencia.cantidadTotal || 0)) {
      return res.status(400).json({ error: "No hay licencias disponibles para asignar." });
    }

    const asignacionExistente = await LicenciaDispositivo.findOne({
      where: {
        licenciaId: licencia.id,
        dispositivoId: dispositivo.id,
        estado: "activa",
      },
    });

    if (asignacionExistente) {
      return res.status(400).json({ error: "Este dispositivo ya tiene asignada esta licencia." });
    }

    await LicenciaDispositivo.create({
      licenciaId: licencia.id,
      dispositivoId: dispositivo.id,
      notas: req.body.notas?.trim() || null,
      fechaAsignacion: req.body.fechaAsignacion || new Date(),
    });

    const licenciaActualizada = await Licencia.findByPk(licencia.id, {
      include: includeAsignaciones,
    });

    res.status(201).json(serializarLicencia(licenciaActualizada));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const liberarDispositivoLicencia = async (req, res) => {
  try {
    const asignacion = await LicenciaDispositivo.findByPk(req.params.asignacionId);

    if (!asignacion) {
      return res.status(404).json({ error: "Asignacion no encontrada." });
    }

    await asignacion.update({
      estado: "liberada",
      fechaLiberacion: new Date(),
    });

    const licenciaActualizada = await Licencia.findByPk(asignacion.licenciaId, {
      include: includeAsignaciones,
    });

    res.json(serializarLicencia(licenciaActualizada));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
