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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [respData, formData] = await Promise.all([
          axios.get(`/formularios/${formularioId}/respuestas`),
          axios.get(`/formularios/${formularioId}`)
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

  const exportToExcel = () => {
    if (respuestas.length === 0 || !formulario) return;

    const headers = formulario.preguntas.map((p: any) => p.titulo);

    const excelData = respuestas.map(r => {
      const row: Record<string, string> = {
        'Fecha': new Date(r.created_at).toLocaleString(),
        'Usuario': r.usuario?.name || 'Anónimo',
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

    // Auto-ajustar anchos de columna
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...excelData.map(row => String(row[key] || '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Respuestas');
    XLSX.writeFile(workbook, `respuestas_formulario_${formularioId}.xlsx`);
  };

  if (loading) {
    return (
      <div className="card shadow-sm mt-5">
        <div className="card-body d-flex flex-column align-items-center justify-content-center py-20">
          <div className="spinner-border text-primary mb-4" role="status"></div>
          <span className="text-muted fw-bold">Cargando respuestas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mt-5">
      <div className="card-header border-0 pt-6">
        <div className="card-title">
          <div className="d-flex align-items-center gap-4">
            <div className="d-flex align-items-center bg-light-primary rounded px-4 py-2">
              <i className="bi bi-people-fill text-primary fs-3 me-2"></i>
              <span className="fw-bolder fs-4 text-primary">{respuestas.length}</span>
              <span className="text-gray-600 fw-bold ms-2">respuestas</span>
            </div>

            {/* View mode toggle */}
            <div className="d-flex bg-light rounded p-1">
              <button
                className={`btn btn-sm px-3 ${viewMode === 'tabla' ? 'btn-primary' : 'btn-color-muted'}`}
                onClick={() => { setViewMode('tabla'); setSelectedResponse(null); }}
              >
                <i className="bi bi-table me-1"></i> Resumen
              </button>
              <button
                className={`btn btn-sm px-3 ${viewMode === 'individual' ? 'btn-primary' : 'btn-color-muted'}`}
                onClick={() => setViewMode('individual')}
              >
                <i className="bi bi-person me-1"></i> Individual
              </button>
            </div>
          </div>
        </div>
        <div className="card-toolbar">
          <button
            type="button"
            className="btn btn-light-success"
            onClick={exportToExcel}
            disabled={respuestas.length === 0}
          >
            <i className="bi bi-file-earmark-excel fs-2 me-2"></i>
            Exportar a Excel
          </button>
        </div>
      </div>

      <div className="card-body pt-0">
        {viewMode === 'tabla' ? (
          /* VISTA TABLA */
          <div className="table-responsive">
            <table className="table align-middle table-row-dashed fs-6 gy-5">
              <thead>
                <tr className="text-start text-muted fw-bolder fs-7 text-uppercase gs-0">
                  <th className="w-20px">#</th>
                  <th className="min-w-100px">Fecha</th>
                  <th className="min-w-125px">Usuario</th>
                  {formulario?.preguntas?.map((p: any) => (
                    <th key={p.id} className="min-w-150px text-truncate" style={{ maxWidth: '200px' }}>
                      {p.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-600 fw-bold">
                {respuestas.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => { setSelectedResponse(r); setViewMode('individual'); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <span className="text-gray-800">{new Date(r.created_at).toLocaleDateString()}</span>
                      <br />
                      <span className="text-muted fs-8">{new Date(r.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td>
                      {r.usuario ? (
                        <div className="d-flex flex-column">
                          <span className="text-gray-800 mb-1">{r.usuario.name}</span>
                          <span className="text-muted fs-7">{r.usuario.email}</span>
                        </div>
                      ) : (
                        <span className="badge badge-light-secondary">Anónimo</span>
                      )}
                    </td>
                    {formulario?.preguntas?.map((p: any) => {
                      const respItem = Array.isArray(r.respuestas)
                        ? r.respuestas.find((ri: RespuestaItem) => ri.idPregunta == p.id)
                        : null;
                      const valor = respItem
                        ? Array.isArray(respItem.valor) ? respItem.valor.join(', ') : String(respItem.valor)
                        : '-';
                      return (
                        <td key={p.id} className="text-truncate" style={{ maxWidth: '200px' }} title={valor}>
                          {valor}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {respuestas.length === 0 && (
                  <tr>
                    <td colSpan={(formulario?.preguntas?.length || 0) + 3} className="text-center text-muted py-15">
                      <i className="bi bi-inbox fs-2x d-block mb-4 text-gray-400"></i>
                      Aún no hay respuestas para este formulario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* VISTA INDIVIDUAL */
          <div>
            {!selectedResponse && respuestas.length > 0 && (
              <div className="row g-4">
                {respuestas.map((r, idx) => (
                  <div key={r.id} className="col-12 col-md-6 col-lg-4">
                    <div
                      className="card border border-dashed border-gray-300 cursor-pointer hover-elevate-up"
                      onClick={() => setSelectedResponse(r)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body p-5">
                        <div className="d-flex align-items-center mb-3">
                          <div className="symbol symbol-35px symbol-circle bg-light-primary me-3">
                            <span className="symbol-label fw-bolder text-primary">{idx + 1}</span>
                          </div>
                          <div>
                            <span className="fw-bolder text-gray-800 d-block">
                              {r.usuario?.name || 'Anónimo'}
                            </span>
                            <span className="text-muted fs-8">
                              {new Date(r.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-muted fs-7">
                          {Array.isArray(r.respuestas) ? `${r.respuestas.length} respuestas` : '0 respuestas'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedResponse && (
              <div>
                <button
                  className="btn btn-sm btn-light-primary mb-5"
                  onClick={() => setSelectedResponse(null)}
                >
                  <i className="bi bi-arrow-left me-1"></i> Volver a la lista
                </button>

                <div className="card border border-gray-200 shadow-sm">
                  <div className="card-header bg-light-primary border-0">
                    <div className="card-title">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-circle text-primary fs-2 me-3"></i>
                        <div>
                          <span className="fw-bolder text-gray-800 d-block">
                            {selectedResponse.usuario?.name || 'Anónimo'}
                          </span>
                          <span className="text-muted fs-7">
                            {selectedResponse.usuario?.email || 'Sin email'} · {new Date(selectedResponse.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {Array.isArray(selectedResponse.respuestas) && selectedResponse.respuestas.map((item: RespuestaItem, i: number) => (
                      <div key={i} className="mb-6 pb-4 border-bottom border-gray-200">
                        <label className="fs-6 fw-bold text-gray-700 mb-2 d-block">
                          {getPreguntaTitulo(item.idPregunta)}
                        </label>
                        <div className="fs-5 text-gray-900">
                          {Array.isArray(item.valor)
                            ? item.valor.map((v, vi) => (
                                <span key={vi} className="badge badge-light-primary me-2 mb-1">{v}</span>
                              ))
                            : (item.valor || <span className="text-muted fst-italic">Sin respuesta</span>)
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!selectedResponse && respuestas.length === 0 && (
              <div className="text-center py-15 text-muted">
                <i className="bi bi-inbox fs-2x d-block mb-4 text-gray-400"></i>
                Aún no hay respuestas para este formulario.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormResponsesTab;
