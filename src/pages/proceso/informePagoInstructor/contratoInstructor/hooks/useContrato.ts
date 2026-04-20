import { useState, useEffect } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Contrato, ContratoFormData, CiudadDepartamento } from '../types';

const getInitialFormData = (contrato: Contrato | null): ContratoFormData => ({
  supervisorContrato: contrato?.supervisorContrato ?? '',
  cargoSupervisor: contrato?.cargoSupervisor ?? '',
  objetoContrato: contrato?.objetoContrato ?? '',
  formaDePago: contrato?.formaDePago ?? 'NORMAL',
  ciudadExpedicionId: contrato?.persona?.ciudad_expedicion_rel?.id ?? '',
  siif: contrato?.siif ?? null,
  descripcionFormaPago: contrato?.descripcionFormaPago ?? ''
});

export const useContrato = () => {
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ciudades, setCiudades] = useState<CiudadDepartamento[]>([]);
  const [ciudadSearch, setCiudadSearch] = useState('');
  const [form, setForm] = useState<ContratoFormData>(getInitialFormData(null));

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resContrato, resCiudades] = await Promise.all([
          axios.get('instructores/contratoByInstructor'),
          axios.get('ciudades-departamento')
        ]);

        setCiudades(resCiudades.data);

        const data: Contrato = resContrato.data.contrato[0] ?? null;
        setContrato(data);

        if (data) {
          setForm(getInitialFormData(data));
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setCiudadSearch('');
    setForm(getInitialFormData(contrato));
  };

  const handleSave = async () => {
    if (!contrato) return;
    setSaving(true);
    try {
      await axios.put(`instructores/${contrato.id}/supervisor`, form);

      const ciudadSeleccionada = ciudades.find((c) => c.id === form.ciudadExpedicionId) ?? null;
      setContrato({
        ...contrato,
        ...form,
        persona: {
          ...contrato.persona,
          ciudad_expedicion_rel: ciudadSeleccionada
        }
      });

      setEditing(false);
      setCiudadSearch('');
      enqueueSnackbar('Contrato actualizado con éxito.', { variant: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar los cambios.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const ciudadesFiltradas =
    ciudadSearch.trim().length >= 2
      ? ciudades
          .filter(
            (c) =>
              c.descripcion.toLowerCase().includes(ciudadSearch.toLowerCase()) ||
              c.departamento.descripcion.toLowerCase().includes(ciudadSearch.toLowerCase())
          )
          .slice(0, 8)
      : [];

  const ciudadSeleccionadaLabel = (() => {
    if (!form.ciudadExpedicionId) return null;
    const c = ciudades.find((c) => c.id === form.ciudadExpedicionId);
    return c ? `${c.descripcion} — ${c.departamento.descripcion}` : null;
  })();

  return {
    contrato,
    loading,
    editing,
    saving,
    ciudades,
    ciudadSearch,
    form,
    setForm,
    setCiudadSearch,
    handleEdit,
    handleCancel,
    handleSave,
    ciudadesFiltradas,
    ciudadSeleccionadaLabel
  };
};
