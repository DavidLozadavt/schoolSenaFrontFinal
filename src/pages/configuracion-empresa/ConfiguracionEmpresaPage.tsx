import { useAuthContext } from '@/auth';
import { Container } from '@/components';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react';

const ConfiguracionEmpresaPage = () => {
  const authContext = useAuthContext();
  const { empresa } = authContext;

  const [formData, setFormData] = useState({
    razonSocial: empresa?.razonSocial || '',
    nit: empresa?.nit || '',
    digitoVerificacion: empresa?.digitoVerificacion || '',
    email: empresa?.email || '',
    direccion: empresa?.direccion || '',
    telefono: empresa?.telefono || '',
    representanteLegal: empresa?.representanteLegal || '',
    devolucion: empresa?.devolucion || '',
    garantia: empresa?.garantia || '',
    valorIva: empresa?.valorIva || '',
    responsableIva: empresa?.responsableIva || 0,
    retenciones: empresa?.retenciones || 0,
    facturacionElectronica: 0,
    valorAfiliacion: empresa?.valorAfiliacion || '',
    valorAdministracion: empresa?.valorAdministracion || '',
    diasMoraInventario: empresa?.diasMoraInventario || 0,
    diasMoraAdministracion: empresa?.diasMoraAdministracion || 0,
    diasVencimientoFacturacion: empresa?.diasVencimientoFacturacion || 0,
    diaCorteAdministracion: empresa?.diaCorteAdministracion || 0,
    descuentoAsociado: empresa?.descuentoAsociado || '',
    descuentoEmpleado: empresa?.descuentoEmpleado || '',
    stockMinimo: empresa?.stockMinimo || ''
  });

  const [logoPreview, setLogoPreview] = useState(empresa?.rutaLogoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        dataToSend.append(key, value as string);
      });
      if (logoFile) {
        dataToSend.append('rutaLogoFile', logoFile);
      }

      await axios.post(`company_update`, dataToSend);
      enqueueSnackbar('Datos actualizados correctamente', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al actualizar la empresa', { variant: 'error' });
    }
  };

  if (!empresa) return <div>Cargando...</div>;

  const formatCOP = (value: any) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleMoneyChange = (e: any) => {
    const raw = e.target.value.replace(/\./g, ''); // quitar puntos
    const numeric = parseInt(raw) || 0;

    setFormData({
      ...formData,
      [e.target.name]: numeric
    });
  };

  return (
    <Container>
      <form onSubmit={handleSubmit}>
        <div className="card pb-2.5">
          <div className="card-header">
            <h3 className="card-title">Configuración de Empresa</h3>
          </div>
          <div className="card-body space-y-10">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Información de la Empresa
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="form-label">Razón Social</label>
                    <input
                      type="text"
                      name="razonSocial"
                      className="input"
                      value={formData.razonSocial}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="form-label">NIT</label>
                    <input
                      type="text"
                      name="nit"
                      className="input"
                      value={formData.nit}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="form-label">Dígito Verificación</label>
                    <input
                      type="number"
                      name="digitoVerificacion"
                      className="input"
                      value={formData.digitoVerificacion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="form-label">Representante Legal</label>
                    <input
                      type="text"
                      name="representanteLegal"
                      className="input"
                      value={formData.representanteLegal}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="form-label">Correo</label>
                    <input
                      type="email"
                      name="email"
                      className="input"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="form-label">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      className="input"
                      value={formData.direccion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      className="input"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center border rounded p-2 mr-6">
                  <label className="form-label mb-2">Logo</label>

                  <input
                    type="file"
                    accept="image/*"
                    className="file-input mb-3"
                    onChange={handleFileChange}
                  />

                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-48 object-contain" />
                  ) : (
                    <span className="text-gray-400">No hay logo seleccionado</span>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Configuración Tributaria
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="flex flex-col">
                  <label className="form-label">Responsable IVA</label>
                  <select
                    name="responsableIva"
                    className="select"
                    value={formData.responsableIva}
                    onChange={handleChange}
                  >
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Retenciones</label>
                  <select
                    name="retenciones"
                    className="select"
                    value={formData.retenciones}
                    onChange={handleChange}
                  >
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Facturación Electrónica</label>
                  <select
                    name="facturacionElectronica"
                    className="select"
                    value={formData.facturacionElectronica}
                    onChange={handleChange}
                  >
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Días devolución</label>
                  <input
                    type="number"
                    name="devolucion"
                    className="input"
                    value={formData.devolucion}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Días garantía</label>
                  <input
                    type="number"
                    name="garantia"
                    className="input"
                    value={formData.garantia}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">IVA (%)</label>
                  <input
                    type="number"
                    name="valorIva"
                    className="input"
                    value={formData.valorIva}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Días vencimiento facturación</label>
                  <input
                    type="number"
                    name="diasVencimientoFacturacion"
                    className="input"
                    value={formData.diasVencimientoFacturacion}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* === SECCIÓN 3: Costos === */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Costos de la Empresa
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="form-label">Valor de Afiliación</label>
                  <input
                    type="text"
                    name="valorAfiliacion"
                    className="input"
                    value={formatCOP(formData.valorAfiliacion)}
                    onChange={handleMoneyChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Valor de Administración</label>
                  <input
                    type="text"
                    name="valorAdministracion"
                    className="input"
                    value={formatCOP(formData.valorAdministracion)}
                    onChange={handleMoneyChange}
                  />
                </div>
              </div>
            </section>

            {/* === SECCIÓN: Configuración Inventario === */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Configuración Inventario
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="flex flex-col">
                  <label className="form-label">Descuento Asociado (%)</label>
                  <input
                    type="number"
                    name="descuentoAsociado"
                    className="input"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.descuentoAsociado}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Descuento Empleado (%)</label>
                  <input
                    type="number"
                    name="descuentoEmpleado"
                    className="input"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.descuentoEmpleado}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Stock Mínimo</label>
                  <input
                    type="number"
                    name="stockMinimo"
                    className="input"
                    min="0"
                    value={formData.stockMinimo}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Configuración de Cartera
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="form-label">Días mora inventario</label>
                  <input
                    type="number"
                    name="diasMoraInventario"
                    className="input"
                    value={formData.diasMoraInventario}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Días mora Administración</label>
                  <input
                    type="number"
                    name="diasMoraAdministracion"
                    className="input"
                    value={formData.diasMoraAdministracion}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="form-label">Día corte Administración</label>
                  <input
                    type="number"
                    name="diaCorteAdministracion"
                    className="input"
                    value={formData.diaCorteAdministracion}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button type="submit" className="btn btn-primary px-8">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </form>
    </Container>
  );
};

export { ConfiguracionEmpresaPage };
