import Credenciales from "../models/Credenciales.js";

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