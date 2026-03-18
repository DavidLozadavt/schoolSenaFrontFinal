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
  TrazabilityContractInterrumpido,
  AcademicLevel,
  KnowledgeAreas,
  AssignedPrograms
} from './blocks';

import { ModalExtensionContract } from './ModalExtensionContract';
import { ModalInterrumpirContract } from './ModalInterrumpirContract';
import Spinner from '@/components/loaders/Spinner';
import { ModalObservacionPreocupacional } from './ModalObservacionPreocupacional';
import { KeenIcon } from '@/components';
import { ModalUpdateEntidad } from './ModalUpdateEntidad';
import { UpdateContractPage } from './UpdateContractPage';
import { ModalUpdatePerson } from './ModalUpdatePerson';
import { ModalUpdateContract } from './ModalUpdateContract';
import { ModalUpdateBankData } from './ModalUpdateBankData';
import { ModalUpdateSeguridadSocial } from './ModalUpdateSeguridadSocial';
import { ModalUpdateFotoPerfil } from './ModalUpdateFotoPerfil';
import { toAbsoluteUrl } from '@/utils/Assets';

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
  const [isModalUpdatePersonOpen, setIsModalUpdatePersonOpen] = useState(false);
  const [isModalUpdateContractDataOpen, setIsModalUpdateContractDataOpen] = useState(false);
  const [isModalUpdateBankDataOpen, setIsModalUpdateBankDataOpen] = useState(false);
  const [isModalUpdateSeguridadSocialOpen, setIsModalUpdateSeguridadSocialOpen] = useState(false);
  const [isModalUpdateFotoPerfilOpen, setIsModalUpdateFotoPerfilOpen] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState({
    tipo: null,
    nombre: ''
  });

  const [isObservacionPreocupacionalOpen, setIsObservacionPreocupacionalOpen] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  // Estado para sincronizar programas seleccionados entre AssignedPrograms y KnowledgeAreas
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);

  const fetchContrato = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await axios.get(`contrato_by_id/${id}`);
      setContrato(response.data);
    } catch (error) {
      setError('Error al cargar el contrato');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [id]);

  const handleAfterSave = () => {
    fetchContrato();
    setIsModalInterrumpirOpen(false);
    setIsModalExtensionOpen(false);
    setIsModalUpdateEntidadOpen(false);
    setIsModalUpdateContract(false);
    setIsModalUpdatePersonOpen(false);
    setIsModalUpdateContractDataOpen(false);
    setIsModalUpdateBankDataOpen(false);
    setIsModalUpdateSeguridadSocialOpen(false);
    setIsModalUpdateFotoPerfilOpen(false);
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

  // Sincronizar programas seleccionados cuando se carga el contrato (solo si realmente cambió)
  const previousProgramIdsRef = useRef<string>('');
  useEffect(() => {
    if (contrato?.programas && Array.isArray(contrato.programas)) {
      const programIds = contrato.programas
        .map((program: any) => {
          if (typeof program === 'object' && program !== null && 'id' in program) {
            return program.id as number;
          }
          return typeof program === 'number' ? program : null;
        })
        .filter((id:number | null): id is number => id !== null);
      
      const programIdsString = programIds.sort().join(',');
      // Solo actualizar si realmente cambió para evitar recargas innecesarias
      if (programIdsString !== previousProgramIdsRef.current) {
        previousProgramIdsRef.current = programIdsString;
        setSelectedProgramIds(programIds);
      }
    } else {
      if (selectedProgramIds.length > 0) {
        setSelectedProgramIds([]);
        previousProgramIdsRef.current = '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrato?.programas]);

  const image = (
    <button
      type="button"
      onClick={() => setIsModalUpdateFotoPerfilOpen(true)}
      className="flex items-center justify-center rounded-full border-3 border-success bg-light h-[100px] w-[100px] hover:opacity-80 transition-opacity cursor-pointer overflow-hidden"
      title="Haz clic para cambiar la foto de perfil"
    >
      <img
        src={contrato.persona?.rutaFotoUrl || toAbsoluteUrl('/media/images/default/user.svg')}
        className="w-full h-full object-cover rounded-full"
        alt="Foto de perfil"
        onError={(e) => {
          (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/images/default/user.svg');
        }}
      />
    </button>
  );

  return (
    <Fragment>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5 items-start">
            <div className="col-span-1">
              <div className="flex flex-col gap-5 lg:gap-7.5">
                <CompanyBadge title="Empresa" contrato={contrato} onSave={fetchContrato} />

                <ContractFiles
                  title="Documentos del Contrato"
                  contrato={contrato}
                  onSave={fetchContrato}
                />

                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <KeenIcon icon="information-2" className="text-lg text-primary" />
                      <h3 className="card-title">Observaciones Preocupacionales</h3>
                    </div>
                  </div>

                  <div className="card-body pt-2 pb-3 flex justify-center">
                    <button
                      onClick={() => setIsObservacionPreocupacionalOpen(true)}
                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-transparent dark:bg-transparent text-primary text-sm font-medium"
                    >
                      Ver Todas las Observaciones
                    </button>
                  </div>
                </div>

                <TrazabilityContractInterrumpido
                  title="Detalles de Interrupción del Contrato"
                  contrato={contrato}
                />

                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <KeenIcon icon="shield-tick" className="text-lg text-primary" />
                        <h3 className="card-title">Seguridad Social</h3>
                      </div>
                      <button
                        onClick={() => setIsModalUpdateSeguridadSocialOpen(true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Editar Seguridad Social"
                      >
                        <KeenIcon className="text-sm text-primary" icon="pencil" />
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">EPS</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {contrato?.salud?.nombre || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AFP (Fondo de Pensiones)</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {contrato?.pension?.nombre || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ARL (Riesgos Laborales)</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {contrato?.arl?.nombre || 'N/A'}
                        </p>
                      </div>

                      {contrato?.cajaCompensacion && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Caja de Compensación</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {contrato.cajaCompensacion.nombre || 'N/A'}
                          </p>
                        </div>
                      )}

                      {contrato?.cesantias && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cesantías</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {contrato.cesantias.nombre || 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <KeenIcon icon="check-circle" className="text-lg text-green-600 dark:text-green-400" />
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">Afiliaciones Activas</p>
                      </div>
                    </div>
                  </div>
                </div>

                <AcademicLevel contrato={contrato} onSave={fetchContrato} />

                <TrazabilityContract title="Trazabilidad del Contrato" contrato={contrato} />
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex flex-col gap-5 lg:gap-7.5">
                <AboutPerson contrato={contrato} onEdit={() => setIsModalUpdatePersonOpen(true)} />
                <AboutContract contrato={contrato} onEdit={() => setIsModalUpdateContractDataOpen(true)} />


                  <div className="card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeenIcon icon="wallet" className="text-lg text-primary" />
                          <h3 className="card-title">Datos Bancarios</h3>
                        </div>
                        <button
                          onClick={() => setIsModalUpdateBankDataOpen(true)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Editar datos bancarios"
                        >
                          <KeenIcon className="text-sm text-primary" icon="pencil" />
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Banco</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {contrato?.banco?.nombre || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de Cuenta</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {contrato?.numeroCuentaBancaria || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Cuenta</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {contrato?.tipoCuentaBancaria || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AssignedPrograms 
                    contrato={contrato} 
                    onSave={() => {
                      // Recargar el contrato en background sin mostrar loading (mejor UX)
                      fetchContrato(false);
                    }}
                    onProgramsChange={(programIds) => {
                      // Actualizar estado inmediatamente para que KnowledgeAreas reaccione al instante
                      setSelectedProgramIds(programIds);
                    }}
                  />

                  <KnowledgeAreas 
                    contrato={contrato} 
                    onSave={() => {
                      // Recargar el contrato en background sin mostrar loading (mejor UX)
                      fetchContrato(false);
                    }}
                    selectedProgramIds={selectedProgramIds}
                  />

                  <div className="card">
                    <div className="card-header" id="contract_options">
                      <h3 className="card-title">Opciones del Contrato</h3>
                    </div>
                    <div className="card-body lg:py-7.5 lg:gap-7.5 gap-5">
                      <div className="flex flex-col gap-5">
                        <div className="text-sm text-gray-800 dark:text-gray-300">
                          Puedes extender un contrato hasta 15 días antes de la fecha de
                          finalización. Si prefieres terminar el contrato, puedes hacerlo en
                          cualquier momento antes de la fecha final.
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 mt-4">
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

          <ModalUpdatePerson
            open={isModalUpdatePersonOpen}
            onClose={() => setIsModalUpdatePersonOpen(false)}
            contrato={contrato}
            onSave={handleAfterSave}
          />

          <ModalUpdateContract
            open={isModalUpdateContractDataOpen}
            onClose={() => setIsModalUpdateContractDataOpen(false)}
            contrato={contrato}
            onSave={handleAfterSave}
          />

          <ModalUpdateBankData
            open={isModalUpdateBankDataOpen}
            onClose={() => setIsModalUpdateBankDataOpen(false)}
            contrato={contrato}
            onSave={handleAfterSave}
          />

          <ModalUpdateSeguridadSocial
            open={isModalUpdateSeguridadSocialOpen}
            onClose={() => setIsModalUpdateSeguridadSocialOpen(false)}
            contrato={contrato}
            onSave={handleAfterSave}
          />

          <ModalUpdateFotoPerfil
            open={isModalUpdateFotoPerfilOpen}
            onClose={() => setIsModalUpdateFotoPerfilOpen(false)}
            contrato={contrato}
            onSave={handleAfterSave}
          />
        </Container>
      )}
    </Fragment>
  );
};

export { ContratoPage };
