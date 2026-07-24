import Dispositivos from "../models/Dispositivos.js";
import InventarioEquipoCierreMensual from "../models/InventarioEquipoCierreMensual.js";

const categorias = [
  { id: "computadoras", nombre: "Computadoras", pistas: ["laptop", "notebook", "desktop", "pc", "computadora", "escritorio"] },
  { id: "monitores", nombre: "Monitores", pistas: ["monitor", "pantalla", "display"] },
  { id: "impresoras", nombre: "Impresoras", pistas: ["impresora", "printer"] },
  { id: "escaneres", nombre: "Escaneres", pistas: ["scanner", "escaner", "escaner"] },
  { id: "red", nombre: "Red", pistas: ["switch", "router", "access point", "ap", "firewall", "red"] },
  { id: "servidores", nombre: "Servidores", pistas: ["servidor", "server", "nas"] },
  { id: "moviles", nombre: "Moviles", pistas: ["tablet", "celular", "telefono", "movil"] },
  { id: "energia", nombre: "Energia", pistas: ["ups", "no break", "nobreak", "regulador"] },
  { id: "otros", nombre: "Otros", pistas: [] },
];

const limpiarPeriodo = (valor) => {
  const fecha = new Date();
  const anio = Number(valor.anio || fecha.getFullYear());
  const mes = Number(valor.mes || fecha.getMonth() + 1);

  return {
    anio: Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : fecha.getFullYear(),
    mes: Number.isInteger(mes) && mes >= 1 && mes <= 12 ? mes : fecha.getMonth() + 1,
  };
};

const categoriaDispositivo = (dispositivo) => {
  const texto = `${dispositivo.tipoEquipo || ""} ${dispositivo.nombreSistema || ""}`.toLowerCase();
  return categorias.find((categoria) => categoria.pistas.some((pista) => texto.includes(pista)))?.id || "otros";
};

const serializarCierre = (cierre) => ({
  id: cierre.id,
  anio: cierre.anio,
  mes: cierre.mes,
  totalRegistrados: Number(cierre.totalRegistrados || 0),
  totalOperacion: Number(cierre.totalOperacion || 0),
  porcentajeInventario: Number(cierre.porcentajeInventario || 0),
  detalle: Array.isArray(cierre.detalle) ? cierre.detalle : [],
  comentario: cierre.comentario || "",
});

const calcularDetalleRegistrado = async () => {
  const dispositivos = await Dispositivos.findAll({ where: { estadoInventario: "operacion" } });
  const conteos = categorias.reduce((acc, categoria) => ({ ...acc, [categoria.id]: 0 }), {});

  dispositivos.forEach((dispositivo) => {
    conteos[categoriaDispositivo(dispositivo)] += 1;
  });

  return categorias.map((categoria) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    registrados: conteos[categoria.id] || 0,
    totalOperacion: conteos[categoria.id] || 0,
  }));
};

const construirResumen = (detalle) => {
  const normalizado = detalle.map((item) => {
    const registrados = Number(item.registrados || 0);
    const totalOperacion = Math.max(Number(item.totalOperacion || 0), registrados);

    return {
      id: item.id,
      nombre: item.nombre,
      registrados,
      totalOperacion,
      faltantes: Math.max(totalOperacion - registrados, 0),
    };
  });
  const totalRegistrados = normalizado.reduce((acc, item) => acc + item.registrados, 0);
  const totalOperacion = normalizado.reduce((acc, item) => acc + item.totalOperacion, 0);
  const porcentajeInventario = totalOperacion ? Number(((totalRegistrados / totalOperacion) * 100).toFixed(2)) : 0;

  return { detalle: normalizado, totalRegistrados, totalOperacion, porcentajeInventario };
};

export const previsualizarInventarioEquipos = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.query);
    const existente = await InventarioEquipoCierreMensual.findOne({
      where: { usuarioId: req.usuario.id, anio, mes },
    });
    const detalleBase = await calcularDetalleRegistrado();
    const detalleGuardado = Array.isArray(existente?.detalle) ? existente.detalle : [];
    const detalle = detalleBase.map((item) => {
      const guardado = detalleGuardado.find((detalleItem) => detalleItem.id === item.id);
      return {
        ...item,
        totalOperacion: Math.max(Number(guardado?.totalOperacion || item.totalOperacion), item.registrados),
      };
    });

    res.json({ anio, mes, ...construirResumen(detalle), comentario: existente?.comentario || "" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const guardarCierreInventarioEquipos = async (req, res) => {
  try {
    const { anio, mes } = limpiarPeriodo(req.body);
    const detalleBase = await calcularDetalleRegistrado();
    const detallePayload = Array.isArray(req.body.detalle) ? req.body.detalle : [];
    const detalle = detalleBase.map((item) => {
      const recibido = detallePayload.find((detalleItem) => detalleItem.id === item.id);
      return {
        ...item,
        totalOperacion: Math.max(Number(recibido?.totalOperacion || item.totalOperacion), item.registrados),
      };
    });
    const resumen = construirResumen(detalle);
    const payload = {
      usuarioId: req.usuario.id,
      anio,
      mes,
      ...resumen,
      comentario: req.body.comentario?.trim() || null,
    };
    const [cierre, creado] = await InventarioEquipoCierreMensual.findOrCreate({
      where: { usuarioId: req.usuario.id, anio, mes },
      defaults: payload,
    });

    if (!creado) await cierre.update(payload);
    res.status(201).json(serializarCierre(cierre));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerCierresInventarioEquipos = async (req, res) => {
  try {
    const { anio } = limpiarPeriodo(req.query);
    const cierres = await InventarioEquipoCierreMensual.findAll({
      where: { usuarioId: req.usuario.id, anio },
      order: [["mes", "ASC"]],
    });

    res.json(cierres.map(serializarCierre));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
