import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BadgeCheck, Loader2, ShieldAlert } from 'lucide-react';
import { EscarapelaCard, type EscarapelaDatos } from './EscarapelaCard';
import { DescargarEscarapela } from './escarapelaExport';

/**
 * Página pública que abre el QR de una escarapela: confirma que la inscripción
 * existe y muestra a quién pertenece.
 */
const EscarapelaPublicPage: React.FC = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [datos, setDatos] = useState<EscarapelaDatos | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'no_existe' | 'error'>('cargando');

  useEffect(() => {
    let vigente = true;
    axios
      .get(`escarapela/${codigo}`)
      .then((res) => {
        if (!vigente) return;
        setDatos(res.data);
        setEstado('ok');
      })
      .catch((err) => vigente && setEstado(err.response?.status === 404 ? 'no_existe' : 'error'));
    return () => {
      vigente = false;
    };
  }, [codigo]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-5 bg-slate-100 p-4">
      {estado === 'cargando' && <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />}

      {estado === 'ok' && datos && (
        <>
          <div className="flex items-center gap-2 text-emerald-600">
            <BadgeCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Inscripción válida</span>
          </div>

          <EscarapelaCard datos={datos} />

          <DescargarEscarapela datos={datos} />
        </>
      )}

      {(estado === 'no_existe' || estado === 'error') && (
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 max-w-sm text-center flex flex-col items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
          <h1 className="text-sm font-black uppercase tracking-wider text-neutral-800">
            {estado === 'no_existe' ? 'Escarapela no válida' : 'No se pudo verificar'}
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {estado === 'no_existe'
              ? 'Este código no corresponde a ninguna inscripción registrada.'
              : 'Hubo un problema al consultar la inscripción. Revisa tu conexión e inténtalo de nuevo.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EscarapelaPublicPage;
