import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface Props {
  formularioId: string | number;
}

interface RespuestaItem {
  idPregunta: number | string;
  preguntaTitulo?: string;
  valor: string | string[];
}

const FormResponsesTab: React.FC<Props> = ({ formularioId }) => {
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [formulario, setFormulario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'tabla' | 'individual'>('tabla');
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [respData, formData] = await Promise.all([
          axios.get(`formularios/${formularioId}/respuestas`),
          axios.get(`formularios/${formularioId}`)
        ]);
        setRespuestas(respData.data);
        setFormulario(formData.data);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };
    if (formularioId) fetchData();
  }, [formularioId]);

  const getPreguntaTitulo = (idPregunta: number | string): string => {
    if (!formulario?.preguntas) return `Pregunta ${idPregunta}`;
    const pregunta = formulario.preguntas.find((p: any) => p.id == idPregunta);
    return pregunta?.titulo || `Pregunta ${idPregunta}`;
  };

  /** Resolve full name from user object — handles accessor, flat name, or nested persona */
  const getUserName = (usuario: any): string => {
    if (!usuario) return 'Anónimo';
    // Backend may already compute name via accessor or map()
    if (usuario.name && usuario.name.trim()) return usuario.name.trim();
    // Nested persona fallback
    const p = usuario.persona;
    if (p) {
      const parts = [p.nombre1, p.nombre2, p.apellido1, p.apellido2].filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    // Last resort: email prefix
    return usuario.email?.split('@')[0] || 'Anónimo';
  };

  const getUserInitials = (usuario: any): string => {
    const name = getUserName(usuario);
    if (name === 'Anónimo') return '?';
    const words = name.trim().split(' ');
    return words.length >= 2
      ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const exportToExcel = () => {
    if (respuestas.length === 0 || !formulario) return;

    const excelData = respuestas.map(r => {
      const row: Record<string, string> = {
        'Fecha': new Date(r.created_at).toLocaleString(),
        'Usuario': getUserName(r.usuario),
        'Email': r.usuario?.email || 'N/A',
      };
      if (Array.isArray(r.respuestas)) {
        r.respuestas.forEach((respItem: RespuestaItem) => {
          const titulo = getPreguntaTitulo(respItem.idPregunta);
          row[titulo] = Array.isArray(respItem.valor)
            ? respItem.valor.join(', ')
            : String(respItem.valor);
        });
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...excelData.map(row => String(row[key] || '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
    XLSX.writeFile(workbook, `respuestas_formulario_${formularioId}.xlsx`);
  };

  const accentColor = formulario?.colorTema || '#6366f1';

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-xl mt-6 p-16 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor}40`, borderTopColor: 'transparent', borderRightColor: accentColor }}></div>
        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Cargando respuestas...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-6">

      {/* Header bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Count badge */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl" style={{ backgroundColor: `${accentColor}12` }}>
            <i className="bi bi-people-fill fs-4" style={{ color: accentColor }}></i>
            <span className="text-2xl font-black" style={{ color: accentColor }}>{respuestas.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              {respuestas.length === 1 ? 'respuesta' : 'respuestas'}
            </span>
          </div>

          {/* View toggle */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl">
            <button
              className={`text-[9px] font-black uppercase tracking-widest py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'tabla' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
              onClick={() => { setViewMode('tabla'); setSelectedResponse(null); }}
            >
              <i className="bi bi-table text-xs"></i> Resumen
            </button>
            <button
              className={`text-[9px] font-black uppercase tracking-widest py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'individual' ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
              onClick={() => setViewMode('individual')}
            >
              <i className="bi bi-person text-xs"></i> Individual
            </button>
          </div>
        </div>

        {/* Export button */}
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          onClick={exportToExcel}
          disabled={respuestas.length === 0}
        >
          <i className="bi bi-file-earmark-excel fs-5"></i>
          Exportar a Excel
        </button>
      </div>

      {/* ─── TABLE VIEW ─── */}
      {viewMode === 'tabla' && (
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-xl overflow-hidden">
          {respuestas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-400">
              <div className="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                <i className="bi bi-inbox fs-1 text-neutral-300 dark:text-neutral-700"></i>
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Sin respuestas aún</p>
                <p className="text-xs text-neutral-350 dark:text-neutral-600 mt-1">Cuando alguien complete el formulario, las respuestas aparecerán aquí.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-white/5">
                    <th className="text-left text-[9px] font-black uppercase tracking-widest text-neutral-400 px-6 py-4 w-10">#</th>
                    <th className="text-left text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4 py-4 min-w-[130px]">Fecha</th>
                    <th className="text-left text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4 py-4 min-w-[160px]">Usuario</th>
                    {formulario?.preguntas?.map((p: any) => (
                      <th key={p.id} className="text-left text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4 py-4 min-w-[160px] max-w-[220px]">
                        <span className="block truncate" title={p.titulo}>{p.titulo}</span>
                      </th>
                    ))}
                    <th className="px-4 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-white/3">
                  {respuestas.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-white/3 cursor-pointer transition-colors group"
                      onClick={() => { setSelectedResponse(r); setViewMode('individual'); }}
                    >
                      <td className="px-6 py-4 text-xs font-bold text-neutral-350 dark:text-neutral-600">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-250">{new Date(r.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(r.created_at).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0"
                            style={{ backgroundColor: accentColor }}
                          >
                            {getUserInitials(r.usuario)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-250 truncate max-w-[130px]">{getUserName(r.usuario)}</span>
                            {r.usuario?.email && <span className="text-[10px] text-neutral-400 truncate max-w-[130px]">{r.usuario.email}</span>}
                          </div>
                        </div>
                      </td>
                      {formulario?.preguntas?.map((p: any) => {
                        const respItem = Array.isArray(r.respuestas)
                          ? r.respuestas.find((ri: RespuestaItem) => ri.idPregunta == p.id)
                          : null;
                        const valor = respItem
                          ? Array.isArray(respItem.valor) ? respItem.valor.join(', ') : String(respItem.valor)
                          : '—';
                        return (
                          <td key={p.id} className="px-4 py-4 max-w-[220px]">
                            <span className="block truncate text-xs font-semibold text-neutral-600 dark:text-neutral-350" title={valor}>{valor}</span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-250 transition-all opacity-0 group-hover:opacity-100">
                          <i className="bi bi-chevron-right text-xs"></i>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── INDIVIDUAL VIEW ─── */}
      {viewMode === 'individual' && (
        <div className="flex flex-col gap-5">
          {/* Back / list of cards */}
          {!selectedResponse && (
            <>
              {respuestas.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-xl flex flex-col items-center justify-center py-24 gap-4 text-neutral-400">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                    <i className="bi bi-inbox fs-1 text-neutral-300 dark:text-neutral-700"></i>
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Sin respuestas aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {respuestas.map((r, idx) => (
                    <button
                      key={r.id}
                      className="text-left bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all p-5 cursor-pointer group"
                      onClick={() => setSelectedResponse(r)}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ backgroundColor: accentColor }}
                        >
                          {getUserInitials(r.usuario)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-neutral-700 dark:text-neutral-250 truncate">
                            {getUserName(r.usuario)}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                          {Array.isArray(r.respuestas) ? `${r.respuestas.length} respuestas` : '0 respuestas'}
                        </span>
                        <i className="bi bi-arrow-right text-neutral-300 group-hover:text-neutral-600 transition-colors"></i>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Detail panel */}
          {selectedResponse && (
            <div className="flex flex-col gap-4">
              <button
                className="self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={() => setSelectedResponse(null)}
              >
                <i className="bi bi-arrow-left text-xs"></i> Volver a la lista
              </button>

              {/* User header card */}
              <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-xl overflow-hidden">
                <div className="px-8 py-5 flex items-center gap-4" style={{ borderBottom: `4px solid ${accentColor}` }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {getUserInitials(selectedResponse.usuario)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-black text-neutral-800 dark:text-white">
                      {getUserName(selectedResponse.usuario)}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
                      {selectedResponse.usuario?.email && <span>{selectedResponse.usuario.email}</span>}
                      <span className="text-neutral-300 hidden sm:inline">·</span>
                      <span>{new Date(selectedResponse.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Answer items */}
                <div className="p-6 md:p-8 flex flex-col gap-5">
                  {Array.isArray(selectedResponse.respuestas) && selectedResponse.respuestas.map((item: RespuestaItem, i: number) => (
                    <div key={i} className="flex flex-col gap-2 pb-5 border-b border-neutral-100 dark:border-white/5 last:border-0 last:pb-0">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                        {getPreguntaTitulo(item.idPregunta)}
                      </label>
                      <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-250">
                        {(() => {
                          if (Array.isArray(item.valor)) {
                            return (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.valor.map((v, vi) => (
                                  <span
                                    key={vi}
                                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl"
                                    style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            );
                          }

                          const valorStr = String(item.valor || '');
                          if (!valorStr.trim()) {
                            return <span className="italic text-neutral-350 dark:text-neutral-600 text-xs">Sin respuesta</span>;
                          }

                          // Check if the value is a JSON array or a comma-separated list of URLs
                          let urls: string[] = [];
                          try {
                            if (valorStr.startsWith('[') && valorStr.endsWith(']')) {
                              const parsed = JSON.parse(valorStr);
                              if (Array.isArray(parsed)) {
                                urls = parsed;
                              }
                            }
                          } catch (e) {}

                          if (urls.length === 0) {
                            if (valorStr.includes('http://') || valorStr.includes('https://')) {
                              urls = valorStr.split(',').map(s => s.trim()).filter(Boolean);
                            }
                          }

                          if (urls.length > 0) {
                            return (
                              <div className="flex flex-col gap-3 mt-2">
                                {urls.map((url, uidx) => {
                                  const isImage = /\.(jpeg|jpg|gif|png|webp)/i.test(url);
                                  return (
                                    <div key={uidx} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850/20 border border-neutral-100/50 max-w-lg shadow-inner">
                                      <div 
                                        className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-200/20 bg-neutral-100 flex items-center justify-center ${isImage ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                        onClick={() => isImage && setActiveLightboxUrl(url)}
                                      >
                                        {isImage ? (
                                          <img src={url} alt="Archivo" className="w-full h-full object-cover" />
                                        ) : (
                                          <i className="bi bi-file-earmark-pdf fs-2 text-rose-500"></i>
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-black uppercase text-neutral-400 dark:text-neutral-500">
                                          Archivo {uidx + 1}
                                        </span>
                                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate max-w-[250px] mb-1.5">{url.split('/').pop()}</span>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1.5 mt-0.5">
                                          <i className="bi bi-eye"></i> Ver archivo completo
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          return <span>{valorStr}</span>;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Lightbox Modal */}
      {activeLightboxUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-300 animate-fade-in"
          onClick={() => setActiveLightboxUrl(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer border-0"
            onClick={() => setActiveLightboxUrl(null)}
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
          <div className="max-w-[90vw] max-h-[90vh] relative p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activeLightboxUrl} 
              alt="Ampliada" 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10 animate-scale-up" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponsesTab;
