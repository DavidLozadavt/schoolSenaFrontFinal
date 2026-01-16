import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  propietario: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalFormPersonaJuridica = ({ open, onClose, propietario, onSave }: ModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const fetchInfoPropietario = useCallback(async () => {
    if (!propietario?.id) {
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`get_info_persona_juridica/${propietario?.id}`);

      if (response.data) {
        const { persona, empresa } = response.data;

        setFormData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries({
              ...empresa,
              ...persona
            }).map(([key, value]) => [key, value ?? ''])
          )
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [propietario?.id]);

  const [referencias, setReferencias] = useState<any[]>([]);

  const fetchReferencias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`get_referencias_personales/${propietario?.id}`);
      setReferencias(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setReferencias([]);
    } finally {
      setLoading(false);
    }
  }, [propietario?.id]);

  const handleChangeTable = (id: any, field: string, value: any) => {
    setReferencias((prev) => prev.map((ref) => (ref.id === id ? { ...ref, [field]: value } : ref)));
  };

  const addRow = () => {
    setReferencias((prev) => [
      ...prev,
      {
        id: Date.now(),
        nombre: '',
        profesion: '',
        telefono: '',
        empresa: '',
        vehiculo: '',
        placa: ''
      }
    ]);
  };

  const handleSaveReferencias = async () => {
    try {
      setLoading(true);
      await axios.post('store_referencias_personales', {
        idPersona: propietario?.id,
        referencias
      });

      await fetchReferencias();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReferencia = async (id: number) => {
    try {
      setLoading(true);

      if (id.toString().length > 10) {
        setReferencias((prev) => prev.filter((ref) => ref.id !== id));
      } else {
        await axios.delete(`delete_referencia_personal/${id}`);
        setReferencias((prev) => prev.filter((ref) => ref.id !== id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfoPropietario();
    fetchReferencias();
  }, [fetchInfoPropietario, fetchReferencias]);

  const formatCOP = (value: any) => {
    if (!value) return '';
    const number = Number(parseFloat(value));
    return number.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const handleNumberChange = (e: any, field: any) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, [field]: value });
  };

  const [formData, setFormData] = useState({
    //empresa
    razonSocial: '',
    tipoDocumento: '',
    nit: '',
    dv: '',
    oficinaPrincipal: '',
    direccion: '',
    tipoEmpresa: '',
    actividadEconomica: '',
    ciiu: '',
    departamento: '',
    ciudad: '',
    telefono: '',
    email: '',

    //persona
    lugarExpedicionRep: '',
    nacionalidad1: '',
    nacionalidad2: '',
    pais: '',
    pep: '',
    adminRecursos: '',
    detalleTributarias: '',
    tributariasOtroPais: '',
    ingresos: '',
    egresos: '',
    activos: '',
    pasivos: '',
    patrimonio: '',
    otrosIngresos: '',
    conceptoOtrosIngresos: ''
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await axios.post('store_informacion_persona_juridica', {
        idPersona: propietario?.id,
        ...formData
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[1200px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Completar Información Persona Juridica</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <h3 className="text-lg font-semibold px-4">Información básica de la empresa</h3>
          <div className="grid grid-cols-2 gap-4 px-4">
            <label>
              Nombre o Razón Social
              <input
                type="text"
                name="razonSocial"
                placeholder="Ingrese el nombre o razón social"
                value={formData.razonSocial}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Tipo de Documento
              <select
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="">Seleccione...</option>
                <option value="CC">CC</option>
                <option value="TI">TI</option>
                <option value="NIT">NIT</option>
                <option value="CE">CE</option>
              </select>
            </label>

            <label>
              NIT
              <input
                type="text"
                name="nit"
                placeholder="Ej: 123456789"
                value={formData.nit}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              DV
              <input
                type="text"
                name="dv"
                placeholder="Ej: 5"
                value={formData.dv}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Oficina Principal
              <input
                type="text"
                name="oficinaPrincipal"
                placeholder="Oficina Principal"
                value={formData.oficinaPrincipal}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Dirección
              <input
                type="text"
                name="direccion"
                placeholder="Ej: Calle 123 #45-67"
                value={formData.direccion}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Tipo de Empresa
              <input
                type="text"
                name="tipoEmpresa"
                placeholder="Ej: S.A.S"
                value={formData.tipoEmpresa}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Actividad Económica
              <input
                type="text"
                name="actividadEconomica"
                placeholder="Ej: Comercio al por menor"
                value={formData.actividadEconomica}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              CIIU (Código)
              <input
                type="text"
                name="ciiu"
                placeholder="Ej: 6201"
                value={formData.ciiu}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Departamento
              <input
                type="text"
                name="departamento"
                placeholder="Ej: Antioquia"
                value={formData.departamento}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Ciudad
              <input
                type="text"
                name="ciudad"
                placeholder="Ej: Medellín"
                value={formData.ciudad}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Teléfono
              <input
                type="text"
                name="telefono"
                placeholder="Ej: (604) 1234567"
                value={formData.telefono}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                name="email"
                placeholder="empresa@correo.com"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
              />
            </label>
          </div>

          <h3 className="text-lg font-semibold px-4 mt-6">Representante Legal</h3>
          <div className="grid grid-cols-2 gap-4 px-4">
            <label>
              Lugar Expedición Documento
              <input
                type="text"
                name="lugarExpedicionRep"
                placeholder="Ej: Cali"
                value={formData.lugarExpedicionRep}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Nacionalidad 1
              <input
                type="text"
                name="nacionalidad1"
                placeholder="Ej: Colombiana"
                value={formData.nacionalidad1}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              Nacionalidad 2
              <input
                type="text"
                name="nacionalidad2"
                placeholder="Ej: Española"
                value={formData.nacionalidad2}
                onChange={handleChange}
                className="input w-full"
              />
            </label>

            <label>
              País
              <input
                type="text"
                name="pais"
                placeholder="Ej: Colombia"
                value={formData.pais}
                onChange={handleChange}
                className="input w-full"
              />
            </label>
          </div>

          <h3 className="text-lg font-semibold px-4 mt-6">Preguntas de Control</h3>
          <div className="grid grid-cols-2 gap-4 px-4">
            <div>
              <label className="block mb-1 font-semibold">
                ¿Alguno de los administradores (Representantes legales, miembros de la Junta
                Directiva) es una Persona Expuesta Políticamente?
              </label>
              <select
                name="pep"
                value={formData.pep}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="">Seleccione</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold">
                ¿Por su cargo o actividad, alguno de los administradores (Representantes legales,
                miembros de la Junta Directiva) administra recursos públicos?
              </label>
              <select
                name="adminRecursos"
                value={formData.adminRecursos}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="">Seleccione</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold">
                ¿Es usted sujeto de obligaciones tributarias en otro país o grupo de países?
              </label>
              <select
                name="tributariasOtroPais"
                value={formData.tributariasOtroPais}
                onChange={handleChange}
                className="input w-full mb-2"
              >
                <option value="">Seleccione</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>

              <label className="block mb-1 font-semibold">Indique</label>

              <input
                type="text"
                name="detalleTributarias"
                placeholder="Indique"
                value={formData.detalleTributarias}
                onChange={handleChange}
                className="input w-full col-span-2"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold px-4 mt-6">Información Financiera</h3>
          <div className="grid grid-cols-2 gap-4 px-4">
            <div>
              <label className="block mb-1 font-semibold">Ingresos mensuales</label>
              <input
                type="text"
                name="ingresos"
                placeholder="Ingresos mensuales"
                value={formatCOP(formData.ingresos)}
                onChange={(e) => handleNumberChange(e, 'ingresos')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Egresos mensuales</label>
              <input
                type="text"
                name="egresos"
                placeholder="Egresos mensuales"
                value={formatCOP(formData.egresos)}
                onChange={(e) => handleNumberChange(e, 'egresos')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Activos</label>
              <input
                type="text"
                name="activos"
                placeholder="Activos"
                value={formatCOP(formData.activos)}
                onChange={(e) => handleNumberChange(e, 'activos')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Pasivos</label>
              <input
                type="text"
                name="pasivos"
                placeholder="Pasivos"
                value={formatCOP(formData.pasivos)}
                onChange={(e) => handleNumberChange(e, 'pasivos')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Patrimonio</label>
              <input
                type="text"
                name="patrimonio"
                placeholder="Patrimonio"
                value={formatCOP(formData.patrimonio)}
                onChange={(e) => handleNumberChange(e, 'patrimonio')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Otros ingresos</label>
              <input
                type="text"
                name="otrosIngresos"
                placeholder="Otros ingresos"
                value={formatCOP(formData.otrosIngresos)}
                onChange={(e) => handleNumberChange(e, 'otrosIngresos')}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Concepto otros ingresos</label>
              <input
                type="text"
                name="conceptoOtrosIngresos"
                placeholder="Concepto otros ingresos"
                value={formData.conceptoOtrosIngresos}
                onChange={handleChange}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <div className="card card-grid min-w-full mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold ml-3 mt-3">Referencias Personales</h3>
                {referencias.length < 3 && (
                  <button onClick={addRow} className="btn btn-sm btn-light mr-3 mt-3">
                    Agregar Referencia Personal
                  </button>
                )}
              </div>

              <div className="card-table">
                <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 w-10">N°</th>
                      <th className="px-4 py-2">Referencias Personales</th>
                      <th className="px-4 py-2">Profesión</th>
                      <th className="px-4 py-2">Teléfono</th>
                      <th className="px-4 py-2">Empresa donde labora</th>
                      <th className="px-4 py-2">Vehículo</th>
                      <th className="px-4 py-2">N° Placa</th>
                      <th className="px-4 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referencias.map((ref, index) => (
                      <tr key={ref.id}>
                        <td className="px-4 py-2 text-center">{index + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={ref.nombre}
                            onChange={(e) => handleChangeTable(ref.id, 'nombre', e.target.value)}
                            className="input w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={ref.profesion}
                            onChange={(e) => handleChangeTable(ref.id, 'profesion', e.target.value)}
                            className="input w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={ref.telefono}
                            onChange={(e) => handleChangeTable(ref.id, 'telefono', e.target.value)}
                            className="input w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={ref.empresa}
                            onChange={(e) => handleChangeTable(ref.id, 'empresa', e.target.value)}
                            className="input w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={ref.vehiculo}
                            onChange={(e) => handleChangeTable(ref.id, 'vehiculo', e.target.value)}
                            className="input w-full border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={ref.placa}
                            onChange={(e) => {
                              let val = e.target.value.toUpperCase();
                              val = val.replace(/[^A-Z0-9]/g, '');

                              if (val.length > 3) {
                                val = val.slice(0, 3) + '-' + val.slice(3);
                              }

                              if (val.length > 7) {
                                val = val.slice(0, 7);
                              }

                              handleChangeTable(ref.id, 'placa', val);
                            }}
                            className="input w-full border rounded px-2 py-1"
                            placeholder="AAA-111"
                          />
                        </td>

                        <td className="text-center">
                          <button
                            onClick={() => deleteReferencia(ref.id)}
                            className="text-red-500 hover:text-red-700 font-semibold text-lg"
                          >
                            <KeenIcon icon="trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {referencias.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-500">
                          No hay referencias personales registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3 gap-2 flex justify-end">
              <button onClick={handleSaveReferencias} className="btn btn-sm btn-primary">
                Guardar Referencias
              </button>
            </div>
          </div>

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

export { ModalFormPersonaJuridica };
