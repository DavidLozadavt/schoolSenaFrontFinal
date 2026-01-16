import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { useLocation, useParams } from 'react-router';
import { UserProfileHero } from '@/partials/heros';
import axios from 'axios';
import {
  AboutContract,
  AboutPerson,
  CompanyBadge,
  ContractFiles,
  TrazabilityContract,
  TrazabilityContractInterrumpido
} from './blocks';

import { ModalExtensionContract } from './ModalExtensionContract';
import { ModalInterrumpirContract } from './ModalInterrumpirContract';
import Spinner from '@/components/loaders/Spinner';
import { ModalObservacionPreocupacional } from './ModalObservacionPreocupacional';
import { KeenIcon } from '@/components';
import { ModalUpdateEntidad } from './ModalUpdateEntidad';
import { UpdateContractPage } from './UpdateContractPage';

const ContratoPage = () => {
  const { currentLayout } = useLayout();
  const location = useLocation();
  const id = location.state;
  const [contrato, setContrato] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalInterrumpirOpen, setIsModalInterrumpirOpen] = useState(false);
  const [isModalExtensionOpen, setIsModalExtensionOpen] = useState(false);
  const [isModalUpdateEntidadOpen, setIsModalUpdateEntidadOpen] = useState(false);
  const [isModalUpdateContract, setIsModalUpdateContract] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState({
    tipo: null,
    nombre: ''
  });

  const [isObservacionPreocupacionalOpen, setIsObservacionPreocupacionalOpen] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const fetchContrato = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`contrato_by_id/${id}`);
      setContrato(response.data);
    } catch (error) {
      setError('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleAfterSave = () => {
    fetchContrato();
    setIsModalInterrumpirOpen(false);
    setIsModalExtensionOpen(false);
    setIsModalUpdateEntidadOpen(false);
    setIsModalUpdateContract(false);
  };

  const handleOpenModalEntidad = (tipo: any, nombre: any) => {
    setEntidadSeleccionada({ tipo, nombre });
    setIsModalUpdateEntidadOpen(true);
  };

  useEffect(() => {
    if (contrato?.fechaFinalContrato) {
      const fechaFinal = new Date(contrato.fechaFinalContrato).getTime();
      const fechaActual = new Date().getTime();

      const diferenciaDias = Math.ceil((fechaFinal - fechaActual) / (1000 * 60 * 60 * 24));

      setIsButtonEnabled(diferenciaDias <= 15 || fechaActual > fechaFinal);
    }
  }, [contrato?.fechaFinalContrato]);

  useEffect(() => {
    fetchContrato();
  }, [fetchContrato]);

  const image = (
    <div className="flex items-center justify-center rounded-full border-2 border-success-clarity bg-light h-[100px] w-[100px]">
      <img
        src={contrato.persona?.rutaFotoUrl}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <UserProfileHero
            name={`${contrato?.persona?.nombre1 || ''} ${contrato?.persona?.nombre2 || ''} ${contrato?.persona?.apellido1 || ''} ${contrato?.persona?.apellido2 || ''}`.trim()}
            image={image}
            info={[
              { label: contrato?.empresa?.razonSocial, icon: 'abstract-41' },
              { email: contrato?.persona?.email, icon: 'sms' }
            ]}
          />
          {loading && <Spinner />}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
            <div className="col-span-1">
              <div className="grid gap-5 lg:gap-7.5">
                <CompanyBadge title="Empresa" contrato={contrato} />

                <ContractFiles
                  title="Documentos del Contrato"
                  contrato={contrato}
                  onSave={fetchContrato}
                />

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Observaciones Preocupacionales</h3>
                  </div>

                  <div className="card-body pt-2 pb-3 flex justify-center">
                    <button
                      onClick={() => setIsObservacionPreocupacionalOpen(true)}
                      className="w-full flex items-center justify-center btn-light  px-4 py-2 btn btn-sm rounded"
                    >
                      Ver Todas las Observaciones
                    </button>
                  </div>
                </div>

                <TrazabilityContractInterrumpido
                  title="Detalles de Interrupción del Contrato"
                  contrato={contrato}
                />
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex flex-col gap-5 lg:gap-7.5">
                <div className="flex flex-col gap-5 lg:gap-7.5">
                  <AboutPerson contrato={contrato} />
                  <AboutContract contrato={contrato} />

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Datos de Seguridad Social</h3>
                    </div>
                    <div className="card-body pt-4 pb-3">
                      <table className="table-auto">
                        <tbody>
                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Pensión:</td>
                            <td className="text-sm text-gray-900 pb-3.5 relative">
                              <span>{contrato?.pension?.nombre || 'N/A'}</span>
                              <button
                                className="ml-6"
                                onClick={() =>
                                  handleOpenModalEntidad(
                                    'pension',
                                    contrato?.pension?.nombre || 'N/A'
                                  )
                                }
                              >
                                <KeenIcon className="text-lg" icon="pencil" />
                              </button>
                            </td>
                          </tr>

                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Salud:</td>
                            <td className="text-sm text-gray-900 pb-3.5 relative">
                              <span>{contrato?.salud?.nombre || 'N/A'}</span>
                              <button
                                className="ml-6"
                                onClick={() =>
                                  handleOpenModalEntidad('salud', contrato?.salud?.nombre || 'N/A')
                                }
                              >
                                <KeenIcon className="text-lg" icon="pencil" />
                              </button>
                            </td>
                          </tr>

                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">ARL:</td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.arl?.nombre || 'N/A'}
                            </td>
                          </tr>

                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">
                              Caja de Compensación:
                            </td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.cajaCompensacion?.nombre || 'N/A'}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Cesantías:</td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.cesantias?.nombre || 'N/A'}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Tipo Cotizante:</td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.tipoCotizante?.tipoCotizante || 'N/A'}
                            </td>
                          </tr>

                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Riesgo Arl: </td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.tarifasRiesgo?.nivel || 'N/A'}{' '}
                              {contrato?.tarifasRiesgo?.porcentajeCotizacion || 'N/A'}
                            </td>
                          </tr>

                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">
                              Actividad Riesgo Profesional:{' '}
                            </td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.actividadRiesgo?.codigo || 'N/A'}{' '}
                              {contrato?.actividadRiesgo?.clase || 'N/A'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Datos Bancarios</h3>
                    </div>
                    <div className="card-body pt-4 pb-3">
                      <table className="table-auto">
                        <tbody>
                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Banco:</td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.banco?.nombre || 'N/A'}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Número de Cuenta:</td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.numeroCuentaBancaria || 'N/A'}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-sm text-gray-600 pb-3.5 pe-3">Tipo de Cuenta:</td>
                            <td className="text-sm text-gray-900 pb-3.5">
                              {contrato?.tipoCuentaBancaria || 'N/A'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <TrazabilityContract title="Trazabilidad del Contrato" contrato={contrato} />

                  <div className="card">
                    <div className="card-header" id="contract_options">
                      <h3 className="card-title">Opciones del Contrato</h3>
                    </div>
                    <div className="card-body lg:py-7.5 lg:gap-7.5 gap-5">
                      <div className="flex flex-col gap-5">
                        <div className="text-sm text-gray-800">
                          Puedes extender un contrato hasta 15 días antes de la fecha de
                          finalización. Si prefieres terminar el contrato, puedes hacerlo en
                          cualquier momento antes de la fecha final.
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 mt-4">
                        <button
                          onClick={() => {
                            setIsModalUpdateContract(true);
                          }}
                          className="btn btn-primary"

                        >
                          Actualizar Contrato
                        </button>

                        <button
                          onClick={() => {
                            setIsModalExtensionOpen(true);
                          }}
                          className="btn btn-light"
                          disabled={!isButtonEnabled}
                        >
                          Extender Contrato
                        </button>
                        <button
                          onClick={() => {
                            setIsModalInterrumpirOpen(true);
                          }}
                          className="btn btn-danger"
                          disabled={contrato?.estado?.estado === 'INTERRUMPIDO'}
                        >
                          Termino Contrato
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ModalInterrumpirContract
            open={isModalInterrumpirOpen}
            onClose={() => {
              setIsModalInterrumpirOpen(false);
            }}
            contrato={contrato}
            onSave={handleAfterSave}
          />

          <UpdateContractPage
            open={isModalUpdateContract}
            onClose={() => {
              setIsModalUpdateContract(false);
            }}
            onSave={handleAfterSave}
          />

          <ModalUpdateEntidad
            open={isModalUpdateEntidadOpen}
            onClose={() => setIsModalUpdateEntidadOpen(false)}
            tipo={entidadSeleccionada.tipo}
            contrato={contrato}
            nombre={entidadSeleccionada.nombre}
            onSave={handleAfterSave}
          />

          <ModalExtensionContract
            open={isModalExtensionOpen}
            onClose={() => {
              setIsModalExtensionOpen(false);
            }}
            contrato={contrato}
            onSave={handleAfterSave}
          />

          <ModalObservacionPreocupacional
            open={isObservacionPreocupacionalOpen}
            data={contrato?.persona?.observaciones_preocupacionales}
            onClose={() => setIsObservacionPreocupacionalOpen(false)}
          />
        </Container>
      )}
    </Fragment>
  );
};

export { ContratoPage };
