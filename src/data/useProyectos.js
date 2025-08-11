import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre, tipo, folio')
        .order('nombre', { ascending: true });
      if (error) throw error;
      setProyectos(data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // (opcional) realtime: si cambian en DB, vuelve a cargar
  useEffect(() => {
    const ch = supabase
      .channel('public:proyectos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, refetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [refetch]);

  return { proyectos, loading, error, refetch, setProyectos };
}
