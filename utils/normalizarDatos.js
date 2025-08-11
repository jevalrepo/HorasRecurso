export const normalizarDatos = (horasRecursoRaw, recursoRaw) => {
  const horasRecurso = horasRecursoRaw
    .map(h => {
      const mes = parseInt(h.mes, 10);
      const anio = h.anio ? parseInt(h.anio, 10) : new Date().getFullYear();
      const tipo = h.tipo ?? h.proyectos?.tipo ?? null;
      const horas = parseFloat(h.horas);
      if (!mes || !anio || !tipo || isNaN(horas)) return null;
      return { mes, anio, tipo, horas };
    })
    .filter(Boolean);

  const asignaciones = { proyecto: {}, mtto: {} };
  const tipos = ["proyecto", "mtto"];

  tipos.forEach(tipo => {
    const raw = recursoRaw.asignaciones?.[tipo] ?? {};
    Object.entries(raw).forEach(([anioStr, mesesObj]) => {
      const anio = parseInt(anioStr, 10);
      asignaciones[tipo][anio] = {};
      Object.entries(mesesObj).forEach(([mesStr, horas]) => {
        const mes = parseInt(mesStr, 10);
        asignaciones[tipo][anio][mes] = parseFloat(horas) || 0;
      });
    });
  });

  return {
    horasRecurso,
    recurso: {
      ...recursoRaw,
      asignaciones,
      totalHoras: parseFloat(recursoRaw.totalHoras) || 0,
    },
  };
};