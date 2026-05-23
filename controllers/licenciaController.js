import Licencia from "../models/Licencia.js";

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

export const obtenerLicencias = async (req, res) => {
  try {
    const licencias = await Licencia.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.json(licencias);
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

    const licencia = await Licencia.create(payload);
    res.status(201).json(licencia);
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
    res.json(licencia);
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
