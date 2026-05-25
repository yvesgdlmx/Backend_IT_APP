import Credenciales from "../models/Credenciales.js";
import ConfiguracionSeguridad from "../models/ConfiguracionSeguridad.js";
import bcrypt from "bcryptjs";

const validarClaveRevelado = async (clave = "") => {
  if (!clave) {
    return { ok: false, status: 400, error: "Ingresa el codigo de autorizacion." };
  }

  const configuracion = await ConfiguracionSeguridad.findOne({
    where: { clave: "cuentas365_reveal_code" },
  });

  if (!configuracion) {
    return {
      ok: false,
      status: 503,
      error: "Configura el codigo de visualizacion desde Configuracion.",
    };
  }

  const codigoValido = await bcrypt.compare(clave, configuracion.valorHash);

  if (!codigoValido) {
    return {
      ok: false,
      status: 401,
      error: "El codigo de autorizacion no es correcto.",
    };
  }

  return { ok: true };
};

export const obtenerCredenciales = async (req,res)=>{
  try{
     const data = await Credenciales.findAll({
        order:[["createdAt","DESC"]]
     });

     res.json(data);
  }catch(error){
     res.status(500).json({error:error.message});
  }
}

export const crearCredencial = async (req,res)=>{
 try{
   const nueva = await Credenciales.create(req.body);
   res.status(201).json(nueva);
 }catch(error){
   res.status(400).json({error:error.message});
 }
}

export const actualizarCredencial = async (req,res)=>{
 try{
   const item = await Credenciales.findByPk(req.params.id);

   if(!item){
      return res.status(404).json({error:"No encontrada"});
   }

   await item.update(req.body);

   res.json(item);

 }catch(error){
   res.status(400).json({error:error.message});
 }
}

export const eliminarCredencial = async (req,res)=>{
 try{
   const item = await Credenciales.findByPk(req.params.id);

   if(!item){
      return res.status(404).json({error:"No encontrada"});
   }

   await item.destroy();

   res.json({mensaje:"Eliminada correctamente"});

 }catch(error){
   res.status(500).json({error:error.message});
 }
}

export const revelarPasswordCredencial = async (req, res) => {
 try {
   const { id, clave } = req.body;
   const validacion = await validarClaveRevelado(clave);

   if (!validacion.ok) {
      return res.status(validacion.status).json({ error: validacion.error });
   }

   const item = await Credenciales.findByPk(id);

   if (!item) {
      return res.status(404).json({ error: "Credencial no encontrada." });
   }

   res.json({ password: item.password });
 } catch (error) {
   res.status(500).json({ error: error.message });
 }
}
