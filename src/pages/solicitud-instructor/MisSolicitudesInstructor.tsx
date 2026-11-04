import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import SolicitudInstructorForm from './SolicitudInstructorForm';
import SolicitudInstructorDetalles from './SolicitudInstructorDetalles';
import { KeenIcon } from '@/components';

const MisSolicitudesInstructorPage = () => {
    const { currentLayout } = useLayout();
    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [modalDetails, setModalDetails] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);

    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const fetchSolicitudes = async () => {
        setLoading(true);
        try {
            const res = await axios.get('solicitud-materia?mine=true'); 
            setSolicitudes(res.data.data || res.data || []);
        } catch (error) {
            enqueueSnackbar('Error al cargar tus solicitudes', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Fragment>
            {currentLayout?.name === 'demo1-layout' && (
                <Container>
                    <Toolbar>
                        <ToolbarHeading>
                            <ToolbarPageTitle />
                            <ToolbarDescription>Consulta el estado de tus solicitudes</ToolbarDescription>
                        </ToolbarHeading>
                        <ToolbarActions>
                            <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}>
                                Nueva Solicitud
                            </button>
                        </ToolbarActions>
                    </Toolbar>
                </Container>
            )}
            <Container>
                <div className="card border-0 shadow-sm overflow-hidden">
                    <SolicitudInstructorForm 
                        open={open} 
                        onClose={() => setOpen(false)} 
                        onSave={() => {
                            setOpen(false);
                            fetchSolicitudes();
                        }} 
                    />
                    
                    <SolicitudInstructorDetalles 
                        open={modalDetails} 
                        onClose={() => setModalDetails(false)} 
                        solicitud={selectedSolicitud} 
                    />

                    <div className="card-header bg-transparent border-b py-5">
                        <h3 className="card-title text-base font-bold text-gray-800">
                            Mis Solicitudes
                        </h3>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-auto w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b">
                                        <tr>
                                            <th className="p-4">Ficha</th>
                                            <th className="p-4">Instructor Asignado</th>
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
                                                    {solicitud.contrato?.persona ? (
                                                        <div className="flex items-center gap-3">
                                                            {solicitud.contrato.persona.rutaFotoUrl ? (
                                                                <img src={solicitud.contrato.persona.rutaFotoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                                            ) : (
                                                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                                    {solicitud.contrato.persona.nombre1[0]}{solicitud.contrato.persona.apellido1[0]}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-gray-800">
                                                                    {solicitud.contrato.persona.nombre1} {solicitud.contrato.persona.apellido1}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    Cel: {solicitud.contrato.persona.celular}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    Correo: {solicitud.contrato.persona.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-400 italic">
                                                            <KeenIcon icon="user" className="text-sm" />
                                                            <span className="text-xs">Sin asignar</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`badge text-[10px] font-bold ${
                                                        solicitud.estado === 'PENDIENTE' ? 'badge-warning' :
                                                        solicitud.estado === 'ACEPTADO' ? 'badge-success' :
                                                        'badge-danger'
                                                    }`}>
                                                        {solicitud.estado}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSolicitud(solicitud);
                                                            setModalDetails(true);
                                                        }}
                                                        className="btn btn-sm btn-icon btn-primary"
                                                        title="Ver detalles"
                                                    >
                                                        <KeenIcon icon="eye" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="p-10 text-center text-gray-500 italic text-sm">
                                                    Aún no has realizado ninguna solicitud
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </Fragment>
    );
};

export default MisSolicitudesInstructorPage;
