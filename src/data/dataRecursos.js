import { supabase } from '../lib/supabaseClient';

export async function getDataRecursos() {
  const { data, error } = await supabase
    .from('recursos')
    .select('id, recurso, porcProyecto, porcMtto, horasProyecto, horasMtto, totalHoras');
    console.log("Datos recibidos:", data); // 👈 Verifica esto en consola
  if (error) {
    console.error('Error al consultar recursos:', error);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    recurso: item.recurso,
    proyecto: item.porcProyecto + '%',
    mtto: item.porcMtto + '%',
    horasProyectos: item.horasProyecto,
    horasMtto: item.horasMtto,
    totalHoras: item.totalHoras,
  }));
}


export async function getHorasRecursoPorId(recursoId) {
  const { data, error } = await supabase
    .from("horasrecurso")
    .select(`
      id,
      recurso_id,
      proyecto_id,
      horas,
      mes,
      anio,
      proyectos (
        tipo
      )
    `)
    .eq("recurso_id", recursoId);

  if (error) {
    console.error("Error al consultar horasrecurso:", error);
    return [];
  }

  // Mapear tipo directamente
  return data.map((item) => ({
    ...item,
    tipo: item.proyectos?.tipo ?? "desconocido",
  }));
}