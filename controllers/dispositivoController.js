import Dispositivos from "../models/Dispositivos.js";
import CuentasPadres from "../models/CuentasPadres.js";
import CuentasHijas from "../models/CuentasHijas.js";
import Licencia from "../models/Licencia.js";
import LicenciaDispositivo from "../models/LicenciaDispositivo.js";

const includeDispositivos = [
  {
    model: CuentasPadres,
    as: "cuentaPadre",
    attributes: ["id", "correo"],
  },
  {
    model: CuentasHijas,
    as: "cuentaHija",
    attributes: ["id", "correo", "cuentaPadreId"],
  },
  {
    model: LicenciaDispositivo,
    as: "licenciasAsignadas",
    where: { estado: "activa" },
    required: false,
    include: [
      {
        model: Licencia,
        as: "licencia",
        attributes: ["id", "nombre", "proveedor", "plan", "cantidadTotal", "estado"],
      },
    ],
  },
];

const resolverAsignacion = async ({ cuentaPadreId, cuentaHijaId }) => {
  if (cuentaPadreId && cuentaHijaId) {
    throw new Error(
      "Un dispositivo no puede asignarse a cuenta padre y cuenta hija al mismo tiempo.",
    );
  }

  if (!cuentaPadreId && !cuentaHijaId) {
    return {
      cuentaPadreId: null,
      cuentaHijaId: null,
    };
  }

  if (cuentaHijaId) {
    const cuentaHija = await CuentasHijas.findByPk(cuentaHijaId);

    if (!cuentaHija) {
      throw new Error("La cuenta hija seleccionada no existe.");
    }

    return {
      cuentaHijaId: cuentaHija.id,
      cuentaPadreId: null,
    };
  }

  const cuentaPadre = await CuentasPadres.findByPk(cuentaPadreId);

  if (!cuentaPadre) {
    throw new Error("La cuenta padre seleccionada no existe.");
  }

  return {
    cuentaPadreId: cuentaPadre.id,
    cuentaHijaId: null,
  };
};

const normalizarLicenciaIds = (licenciaIds = []) =>
  [...new Set((Array.isArray(licenciaIds) ? licenciaIds : []).filter(Boolean))];

const sincronizarLicenciasDispositivo = async (dispositivoId, licenciaIds = []) => {
  const idsDeseados = normalizarLicenciaIds(licenciaIds);

  const asignacionesActuales = await LicenciaDispositivo.findAll({
    where: { dispositivoId, estado: "activa" },
  });

  const idsActuales = new Set(asignacionesActuales.map((asignacion) => asignacion.licenciaId));
  const idsNuevos = idsDeseados.filter((id) => !idsActuales.has(id));
  const idsRemovidos = asignacionesActuales.filter((asignacion) => !idsDeseados.includes(asignacion.licenciaId));

  for (const asignacion of idsRemovidos) {
    await asignacion.update({
      estado: "liberada",
      fechaLiberacion: new Date(),
    });
  }

  for (const licenciaId of idsNuevos) {
    const licencia = await Licencia.findByPk(licenciaId);

    if (!licencia) {
      throw new Error("Una de las licencias seleccionadas no existe.");
    }

    const asignacionesActivas = await LicenciaDispositivo.count({
      where: { licenciaId, estado: "activa" },
    });

    if (asignacionesActivas >= Number(licencia.cantidadTotal || 0)) {
      throw new Error(`No hay cupos disponibles para ${licencia.nombre}.`);
    }

    await LicenciaDispositivo.create({
      licenciaId,
      dispositivoId,
    });
  }
};

export const obtenerDispositivos = async (req, res) => {
  try {
    const dispositivos = await Dispositivos.findAll({
      include: includeDispositivos,
      order: [["createdAt", "DESC"]],
    });

    res.json(dispositivos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerDispositivo = async (req, res) => {
  try {
    const dispositivo = await Dispositivos.findByPk(req.params.id, {
      include: includeDispositivos,
    });

    if (!dispositivo) {
      return res.status(404).json({ error: "Dispositivo no encontrado." });
    }

    res.json(dispositivo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearDispositivo = async (req, res) => {
  try {
    const { marca, tipoEquipo, nombreSistema, area, usuarioActual, licenciaIds } = req.body;
    const asignacion = await resolverAsignacion(req.body);

    const dispositivo = await Dispositivos.create({
      marca,
      tipoEquipo,
      nombreSistema,
      area,
      usuarioActual,
      ...asignacion,
    });

    await sincronizarLicenciasDispositivo(dispositivo.id, licenciaIds);

    const dispositivoCompleto = await Dispositivos.findByPk(dispositivo.id, {
      include: includeDispositivos,
    });

    res.status(201).json(dispositivoCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarDispositivo = async (req, res) => {
  try {
    const dispositivo = await Dispositivos.findByPk(req.params.id);

    if (!dispositivo) {
      return res.status(404).json({ error: "Dispositivo no encontrado." });
    }

    const { marca, tipoEquipo, nombreSistema, area, usuarioActual, licenciaIds } = req.body;
    const asignacion = await resolverAsignacion(req.body);

    await dispositivo.update({
      marca,
      tipoEquipo,
      nombreSistema,
      area,
      usuarioActual,
      ...asignacion,
    });

    if (Array.isArray(licenciaIds)) {
      await sincronizarLicenciasDispositivo(dispositivo.id, licenciaIds);
    }

    const dispositivoActualizado = await Dispositivos.findByPk(dispositivo.id, {
      include: includeDispositivos,
    });

    res.json(dispositivoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarDispositivo = async (req, res) => {
  try {
    const dispositivo = await Dispositivos.findByPk(req.params.id);

    if (!dispositivo) {
      return res.status(404).json({ error: "Dispositivo no encontrado." });
    }

    await dispositivo.destroy();

    res.json({ mensaje: "Dispositivo eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
