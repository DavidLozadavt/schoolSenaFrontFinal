import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { Calendar, Clock, MapPin, Type, FileText, Link, Send } from 'lucide-react';

interface ModalEventoProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  evento?: any;
}

export const ModalEvento = ({ open, onClose, onSave, evento }: ModalEventoProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicial: '',
    fechaFinal: '',
    hora: '',
    linkRegistro: '',
    tipoEvento: 'GENERAL',
    idArea: '',
    crearHistoria: true 
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get('areas');
        setAreas(response.data);
      } catch (err) {
        console.error('Error al cargar áreas:', err);
      }
    };
    if (open) fetchAreas();
  }, [open]);

  useEffect(() => {
    if (evento) {
      setFormData({
        nombre: evento.nombre || '',
        descripcion: evento.descripcion || '',
        fechaInicial: evento.fechaInicial || '',
        fechaFinal: evento.fechaFinal || '',
        hora: evento.hora || '',
        linkRegistro: evento.linkRegistro || '',
        tipoEvento: evento.tipoEvento || 'GENERAL',
        idArea: evento.idArea || '',
        crearHistoria: false 
      });
      setPreview(evento.url || null);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        fechaInicial: '',
        fechaFinal: '',
        hora: '',
        linkRegistro: '',
        tipoEvento: 'GENERAL',
        idArea: '',
        crearHistoria: true
      });
      setArchivo(null);
      setPreview(null);
    }
  }, [evento, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString());
    });
    
    if (archivo) {
      data.append('archivo', archivo);
    }

    try {
      if (evento) {
        await axios.post(`eventos-multimedia/${evento.idEvento}`, data);
        enqueueSnackbar('Evento actualizado correctamente', { variant: 'success' });
      } else {
        await axios.post('eventos-multimedia', data);
        enqueueSnackbar('Evento creado correctamente', { variant: 'success' });
      }
      onSave();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error al procesar el evento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open}>
      <ModalContent className="w-full max-w-[700px] top-[5%] p-4 relative">
        <ModalHeader>
          <ModalTitle>
            <Calendar className="w-5 h-5 mr-2 inline text-orange-500" />
            {evento ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="py-5 px-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Type className="w-4 h-4 text-orange-500" /> Nombre del Evento
                </label>
                <input
                  type="text"
                  required
                  className="input input-sm"
                  placeholder="Ej: Taller de Robótica"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <KeenIcon icon="category" className="text-orange-500" /> Tipo
                </label>
                <select
                  className="select select-sm"
                  value={formData.tipoEvento}
                  onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                >
                  <option value="GENERAL">General</option>
                  <option value="TALLER">Taller</option>
                  <option value="CONFERENCIA">Conferencia</option>
                  <option value="DEPORTIVO">Deportivo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Fecha
                </label>
                <input
                  type="date"
                  required
                  className="input input-sm"
                  value={formData.fechaInicial}
                  onChange={(e) => setFormData({ ...formData, fechaInicial: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Hora
                </label>
                <input
                  type="time"
                  required
                  className="input input-sm"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" /> Lugar / Área
                </label>
                <select
                  className="select select-sm"
                  value={formData.idArea}
                  onChange={(e) => setFormData({ ...formData, idArea: e.target.value })}
                >
                  <option value="">Selecciona un área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Link className="w-4 h-4 text-orange-500" /> Link de Registro
                </label>
                <input
                  type="url"
                  className="input input-sm"
                  placeholder="https://..."
                  value={formData.linkRegistro}
                  style={{ textTransform: 'none' }}
                  onChange={(e) => setFormData({ ...formData, linkRegistro: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" /> Descripción
              </label>
              <textarea
                className="textarea textarea-sm h-24"
                placeholder="Detalles del evento..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold">Imagen/Póster del Evento</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <KeenIcon icon="file-up" className="text-2xl text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Haz clic para subir o arrastra</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                {preview && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-neutral-200">
                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </div>
            </div>

            {!evento && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400">Automatización Multimedia</h4>
                  <p className="text-xs text-orange-600/80 dark:text-orange-400/60">Se creará una "Historia" automáticamente con esta imagen.</p>
                </div>
                <div className="form-switch">
                  <input
                    type="checkbox"
                    checked={formData.crearHistoria}
                    onChange={(e) => setFormData({ ...formData, crearHistoria: e.target.checked })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="btn btn-sm btn-light">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-sm btn-primary min-w-[120px] flex items-center justify-center gap-2">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {evento ? 'Actualizar' : 'Crear Evento'}
                  </>
                )}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
