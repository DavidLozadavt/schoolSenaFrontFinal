import React, { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import Select, { MultiValue } from 'react-select';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

import { ModalClaseServicio } from './ModalClaseServicio';
import { ModalTipoServicio } from './ModalTipoServicio';
import { ModalCategoriaServicio } from './ModalCategoriaServicio';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

interface Prestador {
  id: number;
  nombre: string;
}

interface OptionType {
  value: number;
  label: string;
}

const ModalServicio = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  // Campos principales
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tiempoServicio, setTiempoServicio] = useState('');
  const [unidadTiempo, setUnidadTiempo] = useState<'min' | 'hrs'>('min');

  // Relacionamientos
  const [claseServicioId, setClaseServicioId] = useState('');
  const [tipoServicioId, setTipoServicioId] = useState('');
  const [categoriaServicioId, setCategoriaServicioId] = useState('');

  // Listados del backend
  const [tipos, setTipos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);

  // Prestadores
  const [prestadoresDisponibles, setPrestadoresDisponibles] = useState<Prestador[]>([]);
  const [prestadoresSeleccionados, setPrestadoresSeleccionados] = useState<number[]>([]);

  // Escenarios 
  const [escenarios, setEscenarios] = useState<any[]>([]);
  const [escenariosSeleccionados, setEscenariosSeleccionados] = useState<OptionType[]>([]);

  // Imagen / preview
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

  // Errores
  const [errors, setErrors] = useState({
    nombre: '',
    valor: '',
    descripcion: '',
    tipo: '',
    categoria: '',
    tiempo: '',
    clases: '',
    prestadores: '',
    escenarios: ''
  });

  // Modales hijos
  const [isClaseModalOpen, setIsClaseModalOpen] = useState(false);
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);

  // Control: si el tipo seleccionado es de "escenario"
  const [isTipoEscenario, setIsTipoEscenario] = useState(false);

  // Lista de palabras que determinan escenario 
  const tiposEscenario = [
    'cancha',
    'canchas',
    'habitacion',
    'habitaciones',
    'hotel',
    'apartamento',
    'salon',
    'salones',
    'casa',
    'casas',
    'park',
    'parkingmotos',
    'parkingcarros',
    'parqueadero',
    'parking',
    'parqueo',
  ];

  const normalizarTexto = (texto: string = '') =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

  // Dado un id de tipo, categoría o clase intenta obtener el nombre legible (si existe)
  const findNombreById = (list: any[], id: string, keys: string[]) => {
    if (!id) return '';
    const found = list.find((i) => String(i.id) === String(id));
    if (!found) return '';
    for (const k of keys) {
      if (found[k]) return String(found[k]);
    }
    return JSON.stringify(found);
  };

  // ------------------ FETCHES ------------------
  const fetchPrestadores = async () => {
    try {
      const url = `/responsables`;
      const res: AxiosResponse<any[]> = await axios.get(url);
      const dataRecibida = res.data;

      if (!Array.isArray(dataRecibida)) {
        enqueueSnackbar('La respuesta de responsables no es válida', { variant: 'error' });
        setPrestadoresDisponibles([]);
        return;
      }

      const mappedPrestadores: Prestador[] = dataRecibida.map((p: any) => {
        const persona = p.persona || {};
        const nombre1 = persona.nombre1 || '';
        const apellido1 = persona.apellido1 || '';
        const nombreFinal = `${nombre1} ${apellido1}`.trim() || `Prestador ID ${p.id}`;

        return {
          id: p.id,
          nombre: nombreFinal
        };
      });

      setPrestadoresDisponibles(mappedPrestadores);
    } catch (error) {
      console.error('[ERROR] cargar prestadores:', error);
      enqueueSnackbar('Error al cargar prestadores', { variant: 'error' });
      setPrestadoresDisponibles([]);
    }
  };

  const fetchClases = async () => {
    try {
      const res = await axios.get('/clase_servicios');
      setClases(res.data || []);
    } catch (err) {
      enqueueSnackbar('Error al cargar las clases de servicio', { variant: 'error' });
    }
  };

  const fetchTipos = async () => {
    try {
      const res = await axios.get('/tipo_servicios');
      setTipos(res.data || []);
    } catch (err) {
      enqueueSnackbar('Error al cargar tipos de servicio', { variant: 'error' });
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await axios.get('/category_services');
      setCategorias(res.data || []);
    } catch (err) {
      enqueueSnackbar('Error al cargar categorías de servicio', { variant: 'error' });
    }
  };

  const fetchEscenarios = async () => {
    try {
      const res = await axios.get('/escenarios');
      setEscenarios(res.data || []);
    } catch (err) {
      enqueueSnackbar('Error al cargar escenarios', { variant: 'error' });
      setEscenarios([]);
    }
  };

  // ------------------ DETECCIÓN DE TIPO (escenario vs prestador) ------------------
  // Se dispara cuando cambia tipoServicioId (o clase/categoria) o cuando se abre el modal con data
  useEffect(() => {
    if (!open) return;

    // Si tenemos un tipo seleccionado por id, intentar obtener su nombre
    const tipoNombre = findNombreById(tipos, tipoServicioId, ['nombreTipoServicio', 'nombre']) || '';
    const categoriaNombre = findNombreById(categorias, categoriaServicioId, ['nombre', 'nombreCategoria', 'nombreCategoriaServicio']) || '';
    const claseNombre = findNombreById(clases, claseServicioId, ['nombreClaseServicio', 'nombre']) || '';

    const textoReferencia = normalizarTexto(tipoNombre || categoriaNombre || claseNombre || '');

    const esEscenario = tiposEscenario.some((t) => textoReferencia.includes(normalizarTexto(t)));
    setIsTipoEscenario(esEscenario);

    // Reset solo si NO estamos editando
    if (!data) {
      setEscenariosSeleccionados([]);
      setPrestadoresSeleccionados([]);
    }

    if (esEscenario) {
      fetchEscenarios();
    } else {
      // si no es escenario, mantenemos/cargamos prestadores
      fetchPrestadores();
    }
  }, [open, tipoServicioId, categoriaServicioId, claseServicioId, tipos, categorias, clases]);

  // ------------------ CARGA INICIAL CUANDO SE ABRE ------------------
  useEffect(() => {
    if (!open) return;

    fetchClases();
    fetchTipos();
    fetchCategorias();
    fetchPrestadores(); // por defecto traemos prestadores (si luego el tipo es escenario, fetchEscenarios lo sobreescribe)

    // Si viene data (editar) precargamos los campos
    if (data) {
      setNombre(data.nombre || '');
      setValor(
        data.valor
          ? Number(data.valor).toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            })
          : ''
      );
      setDescripcion(data.descripcion || '');
      setTiempoServicio(data.tiempoServicio || '');
      setClaseServicioId(data.idClaseServicio || '');
      setTipoServicioId(data.idTipoServicio || '');
      setCategoriaServicioId(data.idCategoriaServicio || '');
      setPreview(data.rutaServicioUrl || '');
      setImagen(null);

      // Prestadores seleccionados si vienen
      if (data.responsables && Array.isArray(data.responsables)) {
        const ids = data.responsables.map((r: any) => r.id);
        setPrestadoresSeleccionados(ids);
      } else {
        setPrestadoresSeleccionados([]);
      }

      // Si la edición viene con escenarios enlazados (por si el servicio ya tiene escenarios)
      if (data.escenarios && Array.isArray(data.escenarios)) {
        const opts = data.escenarios.map((e: any) => ({ value: e.id, label: e.nombre }));
        setEscenariosSeleccionados(opts);
      } else {
        setEscenariosSeleccionados([]);
      }
    } else {
      // Reset si es nuevo
      setNombre('');
      setValor('');
      setDescripcion('');
      setTiempoServicio('');
      setClaseServicioId('');
      setTipoServicioId('');
      setCategoriaServicioId('');
      setPreview('');
      setImagen(null);
      setPrestadoresSeleccionados([]);
      setEscenariosSeleccionados([]);
    }

    setErrors({
      nombre: '',
      valor: '',
      descripcion: '',
      tipo: '',
      categoria: '',
      tiempo: '',
      clases: '',
      prestadores: '',
      escenarios: ''
    });
  }, [open, data]);

  // ------------------ VALIDACIÓN ------------------
  const validate = () => {
    const newErrors = {
      nombre: nombre.trim() ? '' : 'El nombre es requerido.',
      valor: valor.trim() ? '' : 'El valor es requerido.',
      descripcion: descripcion.trim() ? '' : 'La descripción es requerida.',
      clases: claseServicioId ? '' : 'Selecciona una clase de servicio.',
      tipo: tipoServicioId ? '' : 'Selecciona un tipo de servicio.',
      categoria: categoriaServicioId ? '' : 'Selecciona una categoría.',
      tiempo: tiempoServicio ? '' : 'El tiempo aproximado es requerido.',
      prestadores: !isTipoEscenario ? (prestadoresSeleccionados.length > 0 ? '' : 'Selecciona al menos un prestador.') : '',
      escenarios: isTipoEscenario ? (escenariosSeleccionados.length > 0 ? '' : 'Selecciona al menos un escenario.') : ''
    };

    setErrors(newErrors as any);
    return Object.values(newErrors).every((e) => e === '');
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limpio = e.target.value.replace(/\D/g, '');
    if (!limpio) return setValor('');
    const numero = parseInt(limpio, 10);
    setValor(
      numero.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      })
    );
  };

  // ------------------ GUARDAR ------------------
  const handleSave = async () => {
    if (!validate()) return;

    const valorLimpio = valor.replace(/\D/g, '');

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('valor', valorLimpio);
    formData.append('descripcion', descripcion);

    let tiempoFinal = tiempoServicio;
    if (unidadTiempo === 'hrs' && tiempoServicio) {
      tiempoFinal = (Number(tiempoServicio) * 60).toString();
    }
    formData.append('tiempoServicio', tiempoFinal);

    formData.append('idClaseServicio', String(claseServicioId));
    formData.append('idTipoServicio', String(tipoServicioId));
    formData.append('idCategoriaServicio', String(categoriaServicioId));

    if (!isTipoEscenario) {
      prestadoresSeleccionados.forEach((id, idx) => {
        formData.append(`responsables[${idx}]`, String(id));
      });
    }

    if (imagen) formData.append('urlImage', imagen);

    try {
      // Crear o actualizar servicio en /servicios (siempre)
      let servicioId: number | null = null;

      if (data?.id) {
        formData.append('_method', 'PUT');
        const res = await axios.post(`servicios/${data.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        servicioId = res.data?.id ?? data.id;
        enqueueSnackbar('Servicio actualizado con éxito.', { variant: 'success' });
      } else {
        const res = await axios.post('servicios', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        servicioId = res.data?.id ?? res.data?.data?.id ?? null;
        enqueueSnackbar('Servicio creado con éxito.', { variant: 'success' });
      }

      if (!servicioId) {
        // si no conseguimos id, avisamos y no seguimos con asignaciones
        enqueueSnackbar('No se obtuvo el id del servicio creado/actualizado.', { variant: 'error' });
        if (onSave) onSave();
        onClose();
        return;
      }

      // Si es tipo escenario → llamar endpoint para asignar escenarios
      if (isTipoEscenario) {
        try {
          const escenariosIds = escenariosSeleccionados.map((e) => e.value);
          await axios.post(`/asignar_servicio_escenario`, {
            servicio_id: servicioId,
            escenarios_id: escenariosIds,
            prestadores_id: [] // explícito por si el backend lo espera
          });
          enqueueSnackbar('Escenarios asignados correctamente.', { variant: 'success' });
        } catch (err) {
          console.error('[ERROR] asignar escenarios:', err);
          enqueueSnackbar('Servicio guardado pero hubo un error asignando escenarios.', { variant: 'warning' });
        }
      }

      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('[ERROR] guardar servicio:', err);
      enqueueSnackbar('Error al guardar el servicio.', { variant: 'error' });
    }
  };

  const escenarioOptions: OptionType[] = escenarios.map((e: any) => ({
    value: e.id,
    label: e.nombre
  }));

  return (
    <>
      <Modal open={open}>
        <ModalContent className="max-w-[650px] top-[6%] p-4">
          <ModalHeader>
            <ModalTitle>{data ? 'Editar Servicio' : 'Nuevo Servicio'}</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>

          <ModalBody className="grid gap-3 px-0 py-5">
            <div>
              <label className="block mb-1 text-sm font-medium">Nombre del Servicio</label>
              <input
                type="text"
                className="input border rounded-md w-full p-2"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              {errors.nombre && <p className="text-red-500 text-xs">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Valor</label>
              <input
                type="text"
                className="input border rounded-md w-full p-2"
                value={valor}
                onChange={handleValorChange}
              />
              {errors.valor && <p className="text-red-500 text-xs">{errors.valor}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Descripción</label>
              <textarea
                rows={2}
                className="textarea border rounded-md w-full p-2"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              {errors.descripcion && <p className="text-red-500 text-xs">{errors.descripcion}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Tiempo aproximado (min/hrs)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input border rounded-md w-full p-2"
                  value={tiempoServicio}
                  onChange={(e) => setTiempoServicio(e.target.value)}
                  placeholder="Ej: 60"
                />
                <select
                  className="input border rounded-md p-2 w-24 h-10"
                  value={unidadTiempo}
                  onChange={(e) => setUnidadTiempo(e.target.value as 'min' | 'hrs')}
                >
                  <option value="min">Minutos</option>
                  <option value="hrs">Horas</option>
                </select>
              </div>
              {errors.tiempo && <p className="text-red-500 text-xs">{errors.tiempo}</p>}
            </div>

            {/* Clase, Tipo y Categoría de Servicio */}
            {[
              {
                label: 'Clase',
                value: claseServicioId,
                set: setClaseServicioId,
                data: clases,
                errors: errors.clases,
                modal: setIsClaseModalOpen
              },
              {
                label: 'Tipo',
                value: tipoServicioId,
                set: setTipoServicioId,
                data: tipos,
                errors: errors.tipo,
                modal: setIsTipoModalOpen
              },
              {
                label: 'Categoría',
                value: categoriaServicioId,
                set: setCategoriaServicioId,
                data: categorias,
                errors: errors.categoria,
                modal: setIsCategoriaModalOpen
              }
            ].map((field, i) => (
              <div className="flex items-center gap-2" key={i}>
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium">{field.label} de Servicio</label>
                  <select
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="input border rounded-md w-full p-2"
                  >
                    <option value="">Selecciona {field.label.toLowerCase()}</option>
                    {field.data.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nombreClaseServicio || c.nombreTipoServicio || c.nombre}
                      </option>
                    ))}
                  </select>
                  {field.errors && <p className="text-red-500 text-xs">{field.errors}</p>}
                </div>
                <button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 flex items-center justify-center rounded-md mt-6"
                  onClick={() => field.modal(true)}
                >
                  +
                </button>
              </div>
            ))}

            {/* Mostrar select de Escenarios O select de Prestadores según el tipo */}
            {isTipoEscenario ? (
              <div>
                <label className="block mb-1 text-sm font-medium">Escenarios</label>
                <Select<OptionType, true>
                  isMulti
                  options={escenarioOptions}
                  value={escenariosSeleccionados}
                  onChange={(selected: MultiValue<OptionType>) =>
                    setEscenariosSeleccionados(selected as OptionType[])
                  }
                  placeholder="Selecciona uno o varios escenarios..."
                  className="text-sm"
                  classNamePrefix="react-select"
                />
                {errors.escenarios && <p className="text-red-500 text-xs">{errors.escenarios}</p>}
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-sm font-medium">Prestadores / Responsables</label>
                <Select<OptionType, true>
                  isMulti
                  options={prestadoresDisponibles.map((p) => ({
                    value: p.id,
                    label: p.nombre
                  }))}
                  value={prestadoresSeleccionados.map((id) => {
                    const found = prestadoresDisponibles.find((p) => p.id === id);
                    return found ? { value: found.id, label: found.nombre } : null;
                  }).filter(Boolean) as OptionType[]}
                  onChange={(selected) => {
                    const ids = selected.map((s) => s.value);
                    setPrestadoresSeleccionados(ids);
                  }}
                  placeholder="Selecciona uno o varios prestadores..."
                  className="text-sm"
                  classNamePrefix="react-select"
                />
                {errors.prestadores && <p className="text-red-500 text-xs">{errors.prestadores}</p>}
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Imagen</label>
              <input
                type="file"
                className="file-input"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImagen(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
              {preview && (
                <img src={preview} alt="Preview" className="w-40 h-32 object-cover mt-2 rounded" />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modales hijos */}
      <ModalClaseServicio
        open={isClaseModalOpen}
        onClose={() => setIsClaseModalOpen(false)}
        onSave={() => {
          fetchClases();
          setIsClaseModalOpen(false);
        }}
      />
      <ModalTipoServicio
        open={isTipoModalOpen}
        clases={clases}
        onClose={() => setIsTipoModalOpen(false)}
        onSave={() => {
          fetchTipos();
          setIsTipoModalOpen(false);
        }}
      />
      <ModalCategoriaServicio
        open={isCategoriaModalOpen}
        onClose={() => setIsCategoriaModalOpen(false)}
        onSave={() => {
          fetchCategorias();
          setIsCategoriaModalOpen(false);
        }}
      />
    </>
  );
};

export { ModalServicio };
