import { useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';
import { seguimientoAspirantesService } from '@/services/seguimientoAspirantesService';

interface ModalExportarAspirantesProps {
  open: boolean;
  onClose: () => void;
  programas: string[];
  centros: string[];
  fichas: string[];
}

const ESTADOS_WHATSAPP = [
  { value: '', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendiente por enviar' },
  { value: 'Enviado', label: 'Enviado' },
  { value: 'Respondido', label: 'Respondido' },
  { value: 'SI', label: 'Continúa (Sí)' },
  { value: 'NO', label: 'Cancela (No)' },
  { value: 'Error', label: 'Error' },
];

const ESTADOS_DOCUMENTALES = [
  { value: '', label: 'Todos' },
  { value: 'link_enviado', label: 'Link enviado' },
  { value: 'formulario_iniciado', label: 'Formulario iniciado' },
  { value: 'formulario_enviado', label: 'Formulario enviado' },
  { value: 'documentacion_completa', label: 'Documentación completa' },
  { value: 'documentacion_incompleta', label: 'Documentación incompleta' },
  { value: 'pendiente_revision', label: 'Pendiente de revisión' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'correccion_solicitada', label: 'Corrección solicitada' },
];

const ModalExportarAspirantes = ({ open, onClose, programas, centros, fichas }: ModalExportarAspirantesProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [estado, setEstado] = useState('');
  const [estadoDocumental, setEstadoDocumental] = useState('');
  const [programa, setPrograma] = useState('');
  const [centro, setCentro] = useState('');
  const [ficha, setFicha] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [formato, setFormato] = useState<'pdf' | 'excel'>('excel');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleExportar = async () => {
    setLoading(true);
    try {
      const blob = await seguimientoAspirantesService.exportar({
        estado: estado || undefined,
        estadoDocumental: estadoDocumental || undefined,
        programa: programa || undefined,
        centro_formacion: centro || undefined,
        ficha: ficha || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        formato,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formato === 'pdf' ? 'aspirantes.pdf' : 'aspirantes.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('Exportación generada correctamente.', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Error al generar la exportación.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[520px] top-[8%] p-4">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <KeenIcon icon="exit-down" className="text-primary text-2xl" />
            Exportar Aspirantes
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={handleClose} disabled={loading}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Estado WhatsApp</label>
              <select className="select select-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_WHATSAPP.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Estado documental</label>
              <select className="select select-sm" value={estadoDocumental} onChange={(e) => setEstadoDocumental(e.target.value)}>
                {ESTADOS_DOCUMENTALES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Programa</label>
              <select className="select select-sm" value={programa} onChange={(e) => setPrograma(e.target.value)}>
                <option value="">Todos</option>
                {programas.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Centro</label>
              <select className="select select-sm" value={centro} onChange={(e) => setCentro(e.target.value)}>
                <option value="">Todos</option>
                {centros.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Ficha</label>
              <select className="select select-sm" value={ficha} onChange={(e) => setFicha(e.target.value)}>
                <option value="">Todas</option>
                {fichas.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Fecha desde</label>
              <input type="date" className="input input-sm" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label font-medium">Fecha hasta</label>
              <input type="date" className="input input-sm" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="form-label font-medium">Formato</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={clsx('btn btn-sm flex-1', formato === 'excel' ? 'btn-primary' : 'btn-light')}
                onClick={() => setFormato('excel')}
              >
                <KeenIcon icon="file-sheet" /> Excel
              </button>
              <button
                type="button"
                className={clsx('btn btn-sm flex-1', formato === 'pdf' ? 'btn-primary' : 'btn-light')}
                onClick={() => setFormato('pdf')}
              >
                <KeenIcon icon="file-down" /> PDF
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-full" onClick={handleExportar} disabled={loading}>
            {loading ? 'Generando...' : 'Generar documento'}
          </button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalExportarAspirantes };
