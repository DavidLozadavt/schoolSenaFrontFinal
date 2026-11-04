import axios from 'axios';
import {
  extensionFromPath,
  materialDocumentoShouldOpenInBrowser,
  resolveMaterialDocumentoFileName,
} from '@/pages/ambiente-virtual/actividades/materialDocumentoSupport';
import type {
  ClaseReferenciaMaterial,
  CompetenciaAccesible,
  CompetenciasAccesiblesResponse,
  FichaMaterialCompetencia,
  MaterialCompetenciaElegible,
  MaterialCompetenciaItem,
  MaterialCompetenciaRecursoItem,
} from './materialCompetencia.types';

const BASE = 'ambiente-virtual/actividades-competencia';

const parseErrorPayload = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== 'object') return fallback;
  const payload = data as { error?: string; errors?: Record<string, string[]> | string[] };
  if (payload.error) return payload.error;
  if (payload.errors) {
    if (Array.isArray(payload.errors)) return payload.errors.join('\n');
    return Object.values(payload.errors).flat().join('\n');
  }
  return fallback;
};

const errorMessage = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  const parsed = parseErrorPayload(response?.data, fallback);
  if (/failed to upload/i.test(parsed)) {
    return 'El servidor no pudo recibir el archivo multimedia.';
  }
  if (response?.status === 500 && parsed === fallback) {
    return 'Error del servidor al consultar el material. Intente de nuevo.';
  }
  return parsed;
};

export const materialCompetenciaService = {
  errorMessage,

  async listarCompetencias(): Promise<CompetenciasAccesiblesResponse> {
    const res = await axios.get<CompetenciasAccesiblesResponse>(`${BASE}/competencias`);
    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    const data = raw
      .map((c) => {
        const id = Number(c?.id);
        return {
          ...c,
          id: Number.isFinite(id) && id > 0 ? id : 0,
        };
      })
      .filter((c) => c.id > 0);
    return {
      data,
      puedeAdministrar: Boolean(res.data?.puedeAdministrar),
    };
  },

  async listarFichasInstructor(): Promise<FichaMaterialCompetencia[]> {
    const res = await axios.get<{ data?: FichaMaterialCompetencia[] }>(`${BASE}/fichas`);
    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    const seen = new Set<number>();
    return raw
      .map((f) => {
        const id = Number(f?.id);
        return {
          ...f,
          id: Number.isFinite(id) && id > 0 ? id : 0,
        };
      })
      .filter((f) => {
        if (f.id <= 0 || seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      });
  },

  async listarCompetenciasDeFicha(idFicha: number): Promise<CompetenciaAccesible[]> {
    const res = await axios.get<{ data?: CompetenciaAccesible[] }>(`${BASE}/fichas/${idFicha}/competencias`);
    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    return raw
      .map((c) => {
        const id = Number(c?.id);
        return {
          ...c,
          id: Number.isFinite(id) && id > 0 ? id : 0,
        };
      })
      .filter((c) => c.id > 0);
  },

  async listarFichas(idCompetencia: number): Promise<FichaMaterialCompetencia[]> {
    const res = await axios.get<{ data?: FichaMaterialCompetencia[] }>(
      `${BASE}/competencias/${idCompetencia}/fichas`
    );
    const raw = Array.isArray(res.data?.data) ? res.data.data : [];
    return raw
      .map((f) => {
        const id = Number(f?.id);
        return {
          ...f,
          id: Number.isFinite(id) && id > 0 ? id : 0,
        };
      })
      .filter((f) => f.id > 0);
  },

  async listarClasesReferencia(idCompetencia: number): Promise<{ fecha?: string; data: ClaseReferenciaMaterial[] }> {
    const res = await axios.get<{ fecha?: string; data?: ClaseReferenciaMaterial[] }>(
      `${BASE}/competencias/${idCompetencia}/clases-referencia`
    );
    return {
      fecha: res.data?.fecha,
      data: Array.isArray(res.data?.data) ? res.data.data : [],
    };
  },

  async listarMateriales(idCompetencia: number, idFicha: number): Promise<MaterialCompetenciaItem[]> {
    const res = await axios.get<MaterialCompetenciaItem[]>(
      `${BASE}/competencias/${idCompetencia}/materiales`,
      { params: { idFicha } }
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  async listarMaterialesAutorizados(): Promise<MaterialCompetenciaItem[]> {
    const res = await axios.get<{ data?: MaterialCompetenciaItem[] } | MaterialCompetenciaItem[]>(
      `${BASE}/materiales`
    );
    const payload = res.data;
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.data) ? payload.data : [];
  },

  async subir(idCompetencia: number, form: FormData, idFicha: number): Promise<MaterialCompetenciaItem> {
    form.append('idFicha', String(idFicha));
    const res = await axios.post<MaterialCompetenciaItem>(
      `${BASE}/competencias/${idCompetencia}/materiales`,
      form
    );
    return res.data;
  },

  async actualizar(idCompetencia: number, id: number, form: FormData): Promise<MaterialCompetenciaItem> {
    const res = await axios.post<MaterialCompetenciaItem>(
      `${BASE}/competencias/${idCompetencia}/materiales/${id}`,
      form
    );
    return res.data;
  },

  async eliminarRecurso(idCompetencia: number, id: number, idRecurso: number): Promise<MaterialCompetenciaItem> {
    const res = await axios.delete<MaterialCompetenciaItem>(
      `${BASE}/competencias/${idCompetencia}/materiales/${id}/recursos/${idRecurso}`
    );
    return res.data;
  },

  recursoDownloadUrl(idCompetencia: number, id: number, idRecurso: number, inline = false): string {
    const q = inline ? '?inline=1' : '';
    return `${BASE}/competencias/${idCompetencia}/materiales/${id}/recursos/${idRecurso}/descargar${q}`;
  },

  async elegibles(idCompetencia: number, idFicha: number, q = ''): Promise<MaterialCompetenciaElegible[]> {
    const res = await axios.get<MaterialCompetenciaElegible[]>(
      `${BASE}/competencias/${idCompetencia}/materiales-elegibles`,
      { params: { idFicha, ...(q.trim() ? { q: q.trim() } : {}) } }
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  async incorporar(
    idCompetencia: number,
    idFicha: number,
    payload: { origen: string; idActividad?: number | null; idMaterialApoyoActividad?: number | null }
  ): Promise<MaterialCompetenciaItem> {
    const res = await axios.post<MaterialCompetenciaItem>(
      `${BASE}/competencias/${idCompetencia}/materiales/incorporar`,
      { ...payload, idFicha }
    );
    return res.data;
  },

  async mover(
    idCompetencia: number,
    id: number,
    idCompetenciaDestino: number,
    idFichaDestino: number
  ): Promise<{ message?: string; data?: MaterialCompetenciaItem }> {
    const res = await axios.post<{ message?: string; data?: MaterialCompetenciaItem }>(
      `${BASE}/competencias/${idCompetencia}/materiales/${id}/mover`,
      { idCompetenciaDestino, idFichaDestino }
    );
    return res.data;
  },

  async desvincular(idCompetencia: number, id: number): Promise<void> {
    await axios.delete(`${BASE}/competencias/${idCompetencia}/materiales/${id}`);
  },

  downloadUrl(idCompetencia: number, id: number, inline = false): string {
    const q = inline ? '?inline=1' : '';
    return `${BASE}/competencias/${idCompetencia}/materiales/${id}/descargar${q}`;
  },

  async descargarOPrevisualizar(
    item: MaterialCompetenciaItem,
    idCompetencia: number,
    inline = false,
    recurso?: MaterialCompetenciaRecursoItem | null
  ): Promise<void> {
    const ext = extensionFromPath(
      recurso?.url || recurso?.ruta || item.urlDocumentoUrl || item.urlDocumento || item.titulo
    );
    const previsualizar = inline || materialDocumentoShouldOpenInBrowser(ext);
    const endpoint =
      recurso?.id != null
        ? this.recursoDownloadUrl(idCompetencia, item.id, recurso.id, previsualizar)
        : this.downloadUrl(idCompetencia, item.id, previsualizar);
    try {
      const response = await axios.get(endpoint, {
        responseType: 'blob',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      if (blob.type && blob.type.includes('application/json')) {
        const text = await blob.text();
        try {
          throw new Error(parseErrorPayload(JSON.parse(text), 'El archivo no está disponible.'));
        } catch (inner) {
          if (inner instanceof SyntaxError) {
            throw new Error('El archivo no está disponible.');
          }
          throw inner;
        }
      }
      const objectUrl = window.URL.createObjectURL(blob);
      if (previsualizar) {
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      const fileName = resolveMaterialDocumentoFileName(
        item.urlDocumentoUrl || item.urlDocumento,
        item.titulo
      );
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName || 'archivo';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      throw new Error(errorMessage(err, 'Descarga o previsualización no disponible.'));
    }
  },
};

export type {
  CompetenciaAccesible,
  MaterialCompetenciaItem,
  MaterialCompetenciaElegible,
} from './materialCompetencia.types';
