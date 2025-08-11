// Calcula anchos en px a partir del contenido
export const autosizeByContent = (rows, leafCols) => {
  const sizing = {};
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // MUI body2 ~ 14px Roboto
  ctx.font = '14px Roboto, Helvetica, Arial';

  const PAD = 28;      // padding + sort + resizer
  const MIN = 80;      // ancho mínimo
  const MAX = 520;     // ancho máximo

  leafCols.forEach((col) => {
    const id = col.id ?? col.accessorKey;
    if (!id) return;

    // fija Acciones para que quepan 2 íconos
    if (id === 'mrt-row-actions') {
      sizing[id] = 96;
      return;
    }

    const header = typeof col.columnDef.header === 'string'
      ? col.columnDef.header
      : (id || '');

    const headerWidth = ctx.measureText(header).width;

    let maxCellWidth = 0;
    rows.forEach((r) => {
      const v = r?.[id];
      const text = v == null ? '' : String(v);
      const w = ctx.measureText(text).width;
      if (w > maxCellWidth) maxCellWidth = w;
    });

    const px = Math.min(Math.max(MIN, Math.max(headerWidth, maxCellWidth) + PAD), MAX);
    sizing[id] = Math.round(px);
  });

  return sizing;
};
