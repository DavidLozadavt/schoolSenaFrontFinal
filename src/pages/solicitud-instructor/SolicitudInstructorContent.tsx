import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { KeenIcon, Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components';
import { enqueueSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import SolicitudInstructorDetalles from './SolicitudInstructorDetalles';
import SolicitudInstructorAceptar from './SolicitudInstructorAceptar';

interface Props {
    reload: boolean;
}

const SolicitudInstructorContent = ({ reload }: Props) => {
    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalAccept, setModalAccept] = useState(false);
    const [modalReject, setModalReject] = useState(false);
    const [modalDetails, setModalDetails] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);

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

    const handleAcceptClick = (solicitud: any) => {
        setSelectedSolicitud(solicitud);
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
            <SolicitudInstructorAceptar
                modalAccept={modalAccept}
                setModalAccept={setModalAccept}
                acceptFormik={acceptFormik}
                selectedSolicitud={selectedSolicitud}
            />

            {/* Modal Rechazar */}
            <Modal open={modalReject} onClose={() => setModalReject(false)}>
                <ModalContent className="w-full max-w-xl p-4">
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
