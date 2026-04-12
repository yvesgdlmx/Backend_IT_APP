import CuentasPadres from "../models/CuentasPadres.js";
import CuentasHijas from "../models/CuentasHijas.js";
import Dispositivos from "../models/Dispositivos.js";

const includeCuentas = [
  {
    model: CuentasHijas,
    as: "hijas",
    include: [
      {
        model: Dispositivos,
        as: "dispositivos",
      },
    ],
  },
  {
    model: Dispositivos,
    as: "dispositivos",
    where: {
      cuentaHijaId: null,
    },
    required: false,
  },
];

const normalizarHijas = (hijas = []) =>
  (Array.isArray(hijas) ? hijas : [])
    .map((hija) => ({
      correo: hija.correo?.trim(),
      fechaVencimiento: hija.fechaVencimiento,
      contraseña: hija.contraseña?.trim(),
    }))
    .filter((hija) => hija.correo || hija.fechaVencimiento || hija.contraseña);

export const obtenerCuentasPadres = async (req, res) => {
  try {
    const cuentas = await CuentasPadres.findAll({
      include: includeCuentas,
      order: [["createdAt", "DESC"]],
    });

    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCuentaPadre = async (req, res) => {
  try {
    const cuenta = await CuentasPadres.findByPk(req.params.id, {
      include: includeCuentas,
    });

    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }

    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearCuentaPadre = async (req, res) => {
  const t = await CuentasPadres.sequelize.transaction();

  try {
    const { correo, fechaVencimiento, contraseña } = req.body;
    const hijas = normalizarHijas(req.body.hijas);

    const nuevaCuenta = await CuentasPadres.create(
      {
        correo,
        fechaVencimiento,
        contraseña,
      },
      { transaction: t }
    );

    if (hijas.length > 0) {
      await CuentasHijas.bulkCreate(
        hijas.map((hija) => ({
          ...hija,
          cuentaPadreId: nuevaCuenta.id,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    const cuentaCompleta = await CuentasPadres.findByPk(nuevaCuenta.id, {
      include: includeCuentas,
    });

    res.status(201).json(cuentaCompleta);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};

export const actualizarCuentaPadre = async (req, res) => {
  const t = await CuentasPadres.sequelize.transaction();

  try {
    const cuenta = await CuentasPadres.findByPk(req.params.id, { transaction: t });

    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }

    const { correo, fechaVencimiento, contraseña } = req.body;
    const hijas = normalizarHijas(req.body.hijas);

    await cuenta.update(
      {
        correo,
        fechaVencimiento,
        contraseña,
      },
      { transaction: t }
    );

    await CuentasHijas.destroy({
      where: { cuentaPadreId: cuenta.id },
      transaction: t,
    });

    if (hijas.length > 0) {
      await CuentasHijas.bulkCreate(
        hijas.map((hija) => ({
          ...hija,
          cuentaPadreId: cuenta.id,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    const cuentaActualizada = await CuentasPadres.findByPk(cuenta.id, {
      include: includeCuentas,
    });

    res.json(cuentaActualizada);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};

export const eliminarCuentaPadre = async (req, res) => {
  try {
    const cuenta = await CuentasPadres.findByPk(req.params.id);

    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }

    await cuenta.destroy();

    res.json({ mensaje: "Cuenta eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
