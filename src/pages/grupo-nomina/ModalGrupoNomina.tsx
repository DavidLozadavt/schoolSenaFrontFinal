import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  grupo?: any;
}

const periodos = ['MENSUAL', 'QUINCENAL', 'SEMANAL'];


const ModalGrupoNomina = ({ open, onClose, onSave, grupo }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombreGrupo, setNombreGrupo] = useState('');
  const [sabados, setSabados] = useState('0');
  const [domingos, setDomingos] = useState('0');
  const [festivos, setFestivos] = useState('0');
  const [trabajoDiaPorMedio, setTrabajoDiaPorMedio] = useState('0');
  const [periodoLiquidacion, setPeriodoLiquidacion] = useState('');

  const [errorNombre, setErrorNombre] = useState('');
  const [errorPeriodo, setErrorPeriodo] = useState('');

  useEffect(() => {
    if (open) {
      if (grupo) {
        setNombreGrupo(grupo.nombreGrupo || '');
        setSabados(grupo.sabados ? '1' : '0');
        setDomingos(grupo.domingos ? '1' : '0');
        setFestivos(grupo.festivos ? '1' : '0');
        setTrabajoDiaPorMedio(grupo.trabajoDiaPorMedio ? '1' : '0');
        setPeriodoLiquidacion(grupo.periodoLiquidacion || '');
      } else {
        setNombreGrupo('');
        setSabados('0');
        setDomingos('0');
        setFestivos('0');
        setTrabajoDiaPorMedio('0');
        setPeriodoLiquidacion('');
      }
      setErrorNombre('');
      setErrorPeriodo('');
    }
  }, [open, grupo]);

  const handleSave = async () => {
    let hasError = false;

    if (!nombreGrupo) {
      setErrorNombre('El nombre del grupo es obligatorio.');
      hasError = true;
    } else setErrorNombre('');

    if (!periodoLiquidacion) {
      setErrorPeriodo('Debe seleccionar un periodo de liquidación.');
      hasError = true;
    } else setErrorPeriodo('');

    if (hasError) return;

    try {
      const data = {
        nombreGrupo,
        sabados: sabados === '1',
        domingos: domingos === '1',
        festivos: festivos === '1',
        trabajoDiaPorMedio: trabajoDiaPorMedio === '1',
        periodoLiquidacion
      };

      if (grupo?.id) {
        await axios.put(`grupos_nomina/${grupo.id}`, data);
        enqueueSnackbar('Grupo actualizado con éxito.', { variant: 'success' });
      } else {
        await axios.post('grupos_nomina', data);
        enqueueSnackbar('Grupo creado con éxito.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error al guardar el grupo.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{grupo ? 'Editar Grupo de Nómina' : 'Nuevo Grupo de Nómina'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Nombre del grupo</label>
            <input
              className="input p-2 border border-gray-300 rounded-md w-full"
              placeholder="Ejemplo: Operarios, Administrativos, etc."
              type="text"
              value={nombreGrupo}
              onChange={(e) => setNombreGrupo(e.target.value)}
            />
            {errorNombre && <p className="text-red-500 text-sm mt-1">{errorNombre}</p>}
          </div>

          {/* Periodo de liquidación */}
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Periodo de liquidación</label>
            <select
              className="input p-2 border border-gray-300 rounded-md w-full"
              value={periodoLiquidacion}
              onChange={(e) => setPeriodoLiquidacion(e.target.value)}
            >
              <option value="">Seleccione un periodo</option>
              {periodos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {errorPeriodo && <p className="text-red-500 text-sm mt-1">{errorPeriodo}</p>}
          </div>

          {/* Días laborales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 ml-1">Sábados</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                value={sabados}
                onChange={(e) => setSabados(e.target.value)}
              >
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 ml-1">Domingos</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                value={domingos}
                onChange={(e) => setDomingos(e.target.value)}
              >
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 ml-1">Festivos</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                value={festivos}
                onChange={(e) => setFestivos(e.target.value)}
              >
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 ml-1">Trabaja día por medio</label>
              <select
                className="input p-2 border border-gray-300 rounded-md w-full"
                value={trabajoDiaPorMedio}
                onChange={(e) => setTrabajoDiaPorMedio(e.target.value)}
              >
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalGrupoNomina };