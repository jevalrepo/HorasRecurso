const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getDataRecursos() {
  const res = await fetch(`${API_URL}/api/recursos`);
  if (!res.ok) {
    console.error('Error al consultar recursos:', res.statusText);
    return [];
  }
  const data = await res.json();

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
  const res = await fetch(`${API_URL}/api/horas-recurso?recurso_id=${recursoId}`);
  if (!res.ok) {
    console.error('Error al consultar horasrecurso:', res.statusText);
    return [];
  }
  const data = await res.json();

  return data.map((item) => ({
    ...item,
    tipo: item.tipo ?? 'desconocido',
  }));
}
