import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { KeenIcon, Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components';
import { enqueueSnackbar } from 'notistack';
import Select from 'react-select';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User } from 'lucide-react';
import SolicitudInstructorDetalles from './SolicitudInstructorDetalles';

interface Props {
    reload: boolean;
}

const SolicitudInstructorContent = ({ reload }: Props) => {
    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalAccept, setModalAccept] = useState(false);
    const [modalReject, setModalReject] = useState(false);
    const [modalDetails, setModalDetails] = useState(false);
    const [materias, setMaterias] = useState<any[]>([]);
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);

    // datos para aprobar solicitud
    const [instructores, setInstructores] = useState<any[]>([]);
    const [loadingInstructores, setLoadingInstructores] = useState(false);

    useEffect(() => {
        fetchSolicitudes();
    }, [reload]);

    const fetchSolicitudes = async () => {
        setLoading(true);
        try {
            const res = await axios.get('solicitud-materia');
            setSolicitudes(res.data.data || res.data || []);
        } catch (error) {
            enqueueSnackbar('Error al cargar las solicitudes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchInstructores = async (idMateria: number) => {
        setLoadingInstructores(true);
        try {
            const res = await axios.get('materias/instructores', { params: { idMateria } });
            setInstructores(res.data.data || []);
        } catch (error: any) {
            setInstructores([]);
            enqueueSnackbar(error.response?.data?.message || 'Error al cargar los instructores', { variant: 'error' });
        } finally {
            setLoadingInstructores(false);
        }
    };

    const fetchMateriasByFicha = async (idFicha: number, idPrograma?: number) => {
        setLoadingInstructores(true);
        try {
            const res = await axios.get('materias-programa', { params: { idFicha, idPrograma } });
            setMaterias(res.data || res || []);
        } catch (error: any) {
            setMaterias([]);
            enqueueSnackbar(error.response?.data?.message || 'Error al cargar las materias', { variant: 'error' });
        } finally {
            setLoadingInstructores(false);
        }
    };

    const handleAcceptClick = (solicitud: any) => {
        setSelectedSolicitud(solicitud);
        setInstructores([]);
        fetchMateriasByFicha(solicitud.idFicha, solicitud.ficha?.asignacion?.idPrograma);
        acceptFormik.resetForm({
            values: {
                idMateria: '',
                idContrato: '',
                fechaInicio: solicitud.fechaInicio || '',
                fechaFin: solicitud.fechaFin || '',
                observacion: ''
            }
        });
        setModalAccept(true);
    };

    const handleRejectClick = (solicitud: any) => {
        setSelectedSolicitud(solicitud);
        rejectFormik.resetForm();
        setModalReject(true);
    };

    const acceptFormik = useFormik({
        initialValues: {
            idMateria: '',
            idContrato: '',
            fechaInicio: '',
            fechaFin: '',
            observacion: ''
        },
        validationSchema: Yup.object({
            idMateria: Yup.string().required('Debe seleccionar una materia'),
            idContrato: Yup.string().required('Debe asignar un instructor'),
            fechaInicio: Yup.string().required('La fecha de inicio es obligatoria'),
            fechaFin: Yup.string().nullable().optional(),
            observacion: Yup.string().optional()
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await axios.post(`solicitud-materia/aceptar/${selectedSolicitud.id}`, values);
                enqueueSnackbar('Solicitud aceptada', { variant: 'success' });
                setModalAccept(false);
                fetchSolicitudes();
            } catch (error: any) {
                enqueueSnackbar(error.response?.data?.message || 'Error al aceptar la solicitud', { variant: 'error' });
            } finally {
                setSubmitting(false);
            }
        }
    });

    const rejectFormik = useFormik({
        initialValues: {
            observacion: ''
        },
        validationSchema: Yup.object({
            observacion: Yup.string().required('La observación es obligatoria para rechazar')
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await axios.post(`solicitud-materia/rechazar/${selectedSolicitud.id}`, values);
                enqueueSnackbar('Solicitud rechazada', { variant: 'success' });
                setModalReject(false);
                fetchSolicitudes();
            } catch (error: any) {
                enqueueSnackbar(error.response?.data?.message || 'Error al rechazar la solicitud', { variant: 'error' });
            } finally {
                setSubmitting(false);
            }
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="card border-0 shadow-sm overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-auto w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b">
                                <tr>
                                    <th className="p-4">Ficha</th>
                                    <th className="p-4">Solicitante</th>
                                    <th className="p-4">Periodo</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {solicitudes.length > 0 ? solicitudes.map((solicitud) => (
                                    <tr key={solicitud.id} className="hover:bg-gray-200 dark:hover:bg-gray-50/10 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">{solicitud.ficha?.codigo}</span>
                                                <span className="text-xs text-gray-500">{solicitud.ficha?.asignacion?.programa?.nombrePrograma}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col-2 md:flex-row">
                                                <div>
                                                    {solicitud.solicitante.persona?.rutaFotoUrl ? (
                                                        <img src={`${solicitud.solicitante.persona?.rutaFotoUrl}`} alt="" className='w-12 h-12 rounded-full object-cover' />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-xl">
                                                            {solicitud.solicitante.persona.nombre1[0]} {solicitud.solicitante.persona.apellido1[0]}
                                                        </div>
                                                    )
                                                    }
                                                </div>
                                                <div className='ml-2 grid'>
                                                    <span className="text-sm font-medium text-gray-700 truncate">
                                                        {solicitud.solicitante.persona?.nombre1 + ' ' + solicitud.solicitante.persona?.apellido1}
                                                    </span>
                                                    <span className='text-xs text-gray-500'>
                                                        Cel: {solicitud.solicitante.persona?.celular}
                                                    </span>
                                                    <span className='text-xs text-gray-500 truncate' title={solicitud.solicitante.persona?.correo}>
                                                        Correo: {solicitud.solicitante.persona?.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className='text-xs text-gray-500'>
                                                {solicitud.fechaInicio} - {solicitud.fechaFin}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge text-[10px] font-bold ${solicitud.estado === 'PENDIENTE' ? 'badge-warning' :
                                                solicitud.estado === 'ACEPTADO' ? 'badge-success' :
                                                    'badge-danger'
                                                }`}>
                                                {solicitud.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-90">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSolicitud(solicitud);
                                                        setModalDetails(true);
                                                    }}
                                                    className="btn btn-sm btn-icon btn-primary"
                                                    title="Ver Solicitud"
                                                >
                                                    <KeenIcon icon="eye" />
                                                </button>
                                                {solicitud.estado === 'PENDIENTE' &&
                                                    <div className='flex items-center gap-2'>
                                                        <button
                                                            onClick={() => handleAcceptClick(solicitud)}
                                                            className="btn btn-sm btn-icon btn-success"
                                                            title="Aceptar"
                                                        >
                                                            <KeenIcon icon="check" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(solicitud)}
                                                            className="btn btn-sm btn-icon btn-danger"
                                                            title="Rechazar"
                                                        >
                                                            <KeenIcon icon="cross" />
                                                        </button>
                                                    </div>
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic text-sm">
                                            No hay solicitudes registradas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Aceptar */}
            <Modal open={modalAccept} onClose={() => setModalAccept(false)}>
                <ModalContent className="max-w-[600px] p-4">
                    <ModalHeader>
                        <ModalTitle>Aceptar Solicitud</ModalTitle>
                        <button
                            type="button"
                            onClick={() => setModalAccept(false)}
                            className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
                        >
                            <i className="ki-outline ki-cross"></i>
                        </button>
                    </ModalHeader>
                    <ModalBody>
                        <form onSubmit={acceptFormik.handleSubmit} className="space-y-6">
                            {selectedSolicitud?.solicitante?.persona && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-gray-600">
                                    <div className="flex-shrink-0">
                                        {selectedSolicitud.solicitante.persona.rutaFotoUrl ? (
                                            <img
                                                src={selectedSolicitud.solicitante.persona.rutaFotoUrl}
                                                alt="Solicitante"
                                                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                                                {selectedSolicitud.solicitante.persona.nombre1[0]}{selectedSolicitud.solicitante.persona.apellido1[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Solicitante</span>
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            {selectedSolicitud.solicitante.persona.nombre1} {selectedSolicitud.solicitante.persona.apellido1}
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:gap-4 mt-0.5">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                <KeenIcon icon="sms" className="text-xs" /> {selectedSolicitud.solicitante.persona.email}
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                <KeenIcon icon="phone" className="text-xs" /> {selectedSolicitud.solicitante.persona.celular}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                        Fecha Inicio <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaInicio"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        onChange={acceptFormik.handleChange}
                                        value={acceptFormik.values.fechaInicio}
                                    />
                                    {acceptFormik.touched.fechaInicio && acceptFormik.errors.fechaInicio && (
                                        <p className="text-danger text-xs mt-1 font-semibold">{acceptFormik.errors.fechaInicio}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                        Fecha Fin (Opcional)
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaFin"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        onChange={acceptFormik.handleChange}
                                        value={acceptFormik.values.fechaFin}
                                    />
                                    {acceptFormik.touched.fechaFin && acceptFormik.errors.fechaFin && (
                                        <p className="text-danger text-xs mt-1 font-semibold">{acceptFormik.errors.fechaFin}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                    Seleccionar Competencia <span className="text-danger">*</span>
                                </label>
                                <Select
                                    options={materias.filter(mat => mat.idCategoriaFormacion == 1 && mat.estado != 'FINALIZADO').map(mat => ({
                                        value: mat.id,
                                        label: mat.nombreMateria
                                    }))}
                                    isLoading={loadingInstructores && materias.length === 0}
                                    placeholder="Seleccione una materia..."
                                    value={acceptFormik.values.idMateria ? (() => {
                                        const mat = materias.find(m => m.id === Number(acceptFormik.values.idMateria) || m.id === acceptFormik.values.idMateria);
                                        if (!mat) return null;
                                        return {
                                            value: mat.id,
                                            label: mat.nombreMateria
                                        };
                                    })() : null}
                                    onChange={(opt) => {
                                        acceptFormik.setFieldValue('idMateria', opt ? opt.value : '');
                                        acceptFormik.setFieldValue('idContrato', ''); // Limpiar instructor seleccionado
                                        if (opt) {
                                            fetchInstructores(opt.value);
                                        } else {
                                            setInstructores([]);
                                        }
                                    }}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                                {acceptFormik.touched.idMateria && acceptFormik.errors.idMateria && (
                                    <p className="text-danger text-xs mt-1 font-semibold">{acceptFormik.errors.idMateria}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                    Asignar Instructor <span className="text-danger">*</span>
                                </label>
                                <Select
                                    options={instructores.filter(inst => inst.asignacionCategoriaFormacionContrato.some((cat:any) => cat.idCategoriaFormacion == 1)).map(inst => ({
                                        value: inst.id,
                                        label: (
                                            <div className="flex flex-row items-center gap-2">
                                                {inst.persona?.rutaFotoUrl ? (
                                                    <img
                                                        src={inst.persona.rutaFotoUrl}
                                                        alt={inst.persona.nombre1}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <i className="ki-duotone ki-profile text-primary w-8 h-8"></i>
                                                    </div>
                                                )}
                                                <span className="font-medium">{inst.persona?.nombre1 || ''} {inst.persona?.apellido1 || ''}</span>
                                            </div>
                                        )
                                    }))}
                                    isLoading={loadingInstructores && instructores.length === 0}
                                    placeholder={acceptFormik.values.idMateria ? "Seleccione un instructor..." : "Debe seleccionar una competencia primero"}
                                    isDisabled={!acceptFormik.values.idMateria}
                                    value={acceptFormik.values.idContrato ? (() => {
                                        const inst = instructores.find(i => i.id === Number(acceptFormik.values.idContrato) || i.id === acceptFormik.values.idContrato);
                                        if (!inst) return null;
                                        return {
                                            value: inst.id,
                                            label: (
                                                <div className="flex flex-row items-center gap-2">
                                                    {inst.persona?.rutaFotoUrl ? (
                                                        <img
                                                            src={inst.persona.rutaFotoUrl}
                                                            alt={inst.persona.nombre1}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <i className="ki-duotone ki-profile text-primary w-8 h-8"></i>
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{inst.persona?.nombre1 || ''} {inst.persona?.apellido1 || ''}</span>
                                                </div>
                                            )
                                        };
                                    })() : null}
                                    onChange={(opt) => acceptFormik.setFieldValue('idContrato', opt ? opt.value : '')}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                                {acceptFormik.touched.idContrato && acceptFormik.errors.idContrato && (
                                    <p className="text-danger text-xs mt-1 font-semibold">{acceptFormik.errors.idContrato}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                    Observación (Opcional)
                                </label>
                                <textarea
                                    name="observacion"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                                    onChange={acceptFormik.handleChange}
                                    value={acceptFormik.values.observacion}
                                    placeholder="Añada una nota sobre la aceptación..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" className="btn btn-light" onClick={() => setModalAccept(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-success" disabled={acceptFormik.isSubmitting}>
                                    {acceptFormik.isSubmitting ? 'Procesando...' : 'Aceptar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modal Rechazar */}
            <Modal open={modalReject} onClose={() => setModalReject(false)}>
                <ModalContent className="max-w-[500px] top-[15%] p-4">
                    <ModalHeader>
                        <ModalTitle>Rechazar Solicitud</ModalTitle>
                        <button
                            type="button"
                            onClick={() => setModalReject(false)}
                            className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
                        >
                            <i className="ki-outline ki-cross"></i>
                        </button>
                    </ModalHeader>
                    <ModalBody>
                        <form onSubmit={rejectFormik.handleSubmit} className="space-y-6">
                            <div className="bg-danger/5 p-4 rounded-xl border border-danger/20 mb-4">
                                <p className="text-xs text-danger-active font-medium">
                                    Por favor indique el motivo del rechazo para la solicitud de la ficha <span className="font-bold">{selectedSolicitud?.ficha?.codigo}</span>.
                                </p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                    Motivo de Rechazo <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    name="observacion"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger transition-all resize-none"
                                    onChange={rejectFormik.handleChange}
                                    value={rejectFormik.values.observacion}
                                    placeholder="Explique el motivo del rechazo..."
                                />
                                {rejectFormik.touched.observacion && rejectFormik.errors.observacion && (
                                    <p className="text-danger text-xs mt-1 font-semibold">{rejectFormik.errors.observacion}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" className="btn btn-light" onClick={() => setModalReject(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-danger" disabled={rejectFormik.isSubmitting}>
                                    {rejectFormik.isSubmitting ? 'Procesando...' : 'Rechazar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <SolicitudInstructorDetalles open={modalDetails} onClose={() => setModalDetails(false)} solicitud={selectedSolicitud} />
        </Fragment>
    );
};

export default SolicitudInstructorContent;
