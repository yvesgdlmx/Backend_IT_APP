import RedIp from "../models/RedIp.js";
import DireccionIp from "../models/DireccionIp.js";

const estadosRedPermitidos = ["activa", "inactiva"];
const estadosIpPermitidos = ["disponible", "ocupada", "reservada", "bloqueada"];
const tiposEquipoPermitidos = [
  "pc",
  "laptop",
  "servidor",
  "impresora",
  "camara",
  "router",
  "access_point",
  "telefono",
  "otro",
];

const ipRegex =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const validarIp = (ip) => ipRegex.test(String(ip || "").trim());

const limpiarRed = (body) => {
  const ipMadre = body.ipMadre?.trim();

  return {
    ipMadre,
    estado: estadosRedPermitidos.includes(body.estado) ? body.estado : "activa",
    notas: body.notas?.trim() || null,
  };
};

const limpiarIp = (body) => ({
  direccion: body.direccion?.trim(),
  equipo: body.equipo?.trim() || null,
  tipoEquipo: tiposEquipoPermitidos.includes(body.tipoEquipo) ? body.tipoEquipo : "otro",
  area: body.area?.trim() || null,
  responsable: body.responsable?.trim() || null,
  mac: body.mac?.trim() || null,
  estado: estadosIpPermitidos.includes(body.estado) ? body.estado : "disponible",
  notas: body.notas?.trim() || null,
});

const includeIps = [
  {
    model: DireccionIp,
    as: "ips",
  },
];

const validarRedPayload = (payload) => {
  if (!validarIp(payload.ipMadre)) {
    return "La IP madre debe ser una direccion IP valida.";
  }

  return "";
};

const validarIpPayload = (payload) => {
  if (!validarIp(payload.direccion)) {
    return "La direccion IP no es valida.";
  }

  if (payload.estado === "ocupada" && !payload.equipo) {
    return "Una IP ocupada debe tener un equipo vinculado.";
  }

  return "";
};

export const obtenerRedesIp = async (req, res) => {
  try {
    const redes = await RedIp.findAll({
      include: includeIps,
      order: [
        ["createdAt", "DESC"],
        [{ model: DireccionIp, as: "ips" }, "direccion", "ASC"],
      ],
    });

    res.json(redes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearRedIp = async (req, res) => {
  try {
    const payload = limpiarRed(req.body);
    const errorValidacion = validarRedPayload(payload);

    if (errorValidacion) {
      return res.status(400).json({ error: errorValidacion });
    }

    const red = await RedIp.create(payload);
    const redCompleta = await RedIp.findByPk(red.id, { include: includeIps });

    res.status(201).json(redCompleta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarRedIp = async (req, res) => {
  try {
    const red = await RedIp.findByPk(req.params.id);

    if (!red) {
      return res.status(404).json({ error: "Red IP no encontrada." });
    }

    const payload = limpiarRed(req.body);
    const errorValidacion = validarRedPayload(payload);

    if (errorValidacion) {
      return res.status(400).json({ error: errorValidacion });
    }

    await red.update(payload);

    const redCompleta = await RedIp.findByPk(red.id, { include: includeIps });
    res.json(redCompleta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarRedIp = async (req, res) => {
  try {
    const red = await RedIp.findByPk(req.params.id);

    if (!red) {
      return res.status(404).json({ error: "Red IP no encontrada." });
    }

    await red.destroy();
    res.json({ mensaje: "Red IP eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearDireccionIp = async (req, res) => {
  try {
    const red = await RedIp.findByPk(req.params.redId);

    if (!red) {
      return res.status(404).json({ error: "Red IP no encontrada." });
    }

    const payload = limpiarIp(req.body);
    const errorValidacion = validarIpPayload(payload);

    if (errorValidacion) {
      return res.status(400).json({ error: errorValidacion });
    }

    const ip = await DireccionIp.create({
      ...payload,
      redIpId: red.id,
    });

    res.status(201).json(ip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const actualizarDireccionIp = async (req, res) => {
  try {
    const ip = await DireccionIp.findOne({
      where: {
        id: req.params.ipId,
        redIpId: req.params.redId,
      },
    });

    if (!ip) {
      return res.status(404).json({ error: "Direccion IP no encontrada." });
    }

    const payload = limpiarIp(req.body);
    const errorValidacion = validarIpPayload(payload);

    if (errorValidacion) {
      return res.status(400).json({ error: errorValidacion });
    }

    await ip.update(payload);
    res.json(ip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const eliminarDireccionIp = async (req, res) => {
  try {
    const ip = await DireccionIp.findOne({
      where: {
        id: req.params.ipId,
        redIpId: req.params.redId,
      },
    });

    if (!ip) {
      return res.status(404).json({ error: "Direccion IP no encontrada." });
    }

    await ip.destroy();
    res.json({ mensaje: "Direccion IP eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
