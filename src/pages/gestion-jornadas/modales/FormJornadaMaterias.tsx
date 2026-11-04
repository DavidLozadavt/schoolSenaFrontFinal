import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';

interface Jornada {
    id?: number;
    nombreJornada: string;
    descripcion: string;
    horaInicial: string;
    horaFinal: string;
    dias: any[];
}

interface JornadaMateriasModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    jornada?: Jornada | null;
}

const FormJornadaMaterias: React.FC<JornadaMateriasModalProps> = ({ open, onClose, onSuccess, jornada }) => {
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuthContext();
    const [diasDisponibles, setDiasDisponibles] = useState<any[]>([]);

    const formik = useFormik({
        initialValues: {
            nombreJornada: '',
            descripcion: '',
            dias: [] as any[],
            horaInicial: '',
            horaFinal: '',
            idCentroFormacion: user?.idCentroFormacion || ''
        },
        validationSchema: Yup.object().shape({
            nombreJornada: Yup.string().required('El nombre es requerido'),
            descripcion: Yup.string().nullable(),
            dias: Yup.array().min(1, 'Selecciona al menos un día').required('Los días son requeridos'),
            horaInicial: Yup.string().required('Hora inicial requerida'),
            horaFinal: Yup.string().required('Hora final requerida'),
            idCentroFormacion: Yup.number().required()
        }),
        onSubmit: async (values) => {
            try {
                const url = jornada ? 'jornadas/actualizar' : 'jornadas/crear_jornada_materias';
                const method = jornada ? 'put' : 'post';

                const payload = {
                    ...values,
                    nombreJornada: values.nombreJornada.toUpperCase(),
                    descripcion: values.descripcion?.toUpperCase() || '',
                    ...(jornada && { id: jornada.id })
                };

                const res = await axios[method](url, payload);
                enqueueSnackbar(res.data?.message ?? `Jornada ${jornada ? 'actualizada' : 'creada'} correctamente`, { variant: 'success' });
                onSuccess();
                onClose();
            } catch (error: any) {
                enqueueSnackbar(error?.response?.data?.message ?? 'Error al procesar la jornada', { variant: 'error' });
            }
        }
    });

    const getDias = async () => {
        try {
            const res = await axios.get('dias');
            setDiasDisponibles(res.data);
        } catch (error) {
            enqueueSnackbar('Error al obtener los días', { variant: 'error' });
        }
    };

    useEffect(() => {
        if (open) {
            getDias();
            if (!jornada) formik.resetForm();
        }
    }, [open, jornada]);

    useEffect(() => {
        if (jornada && diasDisponibles.length > 0) {
            const diasMapped = diasDisponibles.filter(d =>
                jornada.dias.some(jd => typeof jd === 'string' ? jd === d.dia : jd.id === d.id)
            );
            formik.setValues({
                nombreJornada: jornada.nombreJornada.toUpperCase(),
                descripcion: jornada.descripcion?.toUpperCase() || '',
                dias: diasMapped,
                horaInicial: jornada.horaInicial.slice(0, 5),
                horaFinal: jornada.horaFinal.slice(0, 5),
                idCentroFormacion: user?.idCentroFormacion || ''
            });
        }
    }, [jornada, diasDisponibles]);

    const toggleDia = (dia: any) => {
        const exists = formik.values.dias.find((d: any) => d.id === dia.id);
        if (exists) {
            formik.setFieldValue('dias', formik.values.dias.filter((d: any) => d.id !== dia.id));
        } else {
            formik.setFieldValue('dias', [...formik.values.dias, dia]);
        }
    };

    const calcularHoras = () => {
        const { horaInicial, horaFinal, dias } = formik.values;
        if (!horaInicial || !horaFinal) return null;
        const [hIni, mIni] = horaInicial.split(':').map(Number);
        const [hFin, mFin] = horaFinal.split(':').map(Number);
        let inicio = hIni * 60 + mIni;
        let fin = hFin * 60 + mFin;
        const cruzaMedianoche = fin <= inicio;
        if (cruzaMedianoche) fin += 24 * 60;
        const horasPorDia = (fin - inicio) / 60;
        let tipoJornada = 'Mañana', icono = 'sun', color = 'text-yellow-600';
        if (cruzaMedianoche || hIni >= 18) {
            tipoJornada = 'Nocturna'; icono = 'moon'; color = 'text-indigo-500';
        } else if (hIni >= 12) {
            tipoJornada = 'Tarde'; icono = 'sunset'; color = 'text-orange-500';
        }
        return {
            horasPorDia: Number(horasPorDia.toFixed(2)),
            horasTotales: Number((horasPorDia * dias.length).toFixed(2)),
            tipoJornada, icono, color, cruzaMedianoche
        };
    };

    const resumen = calcularHoras();

    return (
        <Modal open={open} onClose={onClose}>
            <ModalContent className="max-w-[650px] top-[10%] p-4">
                <ModalHeader>
                    <ModalTitle>{jornada ? 'Editar' : 'Crear'} Jornada de Materias</ModalTitle>
                    <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}><KeenIcon icon="cross" /></button>
                </ModalHeader>
                <ModalBody className="px-0 py-5">
                    <form onSubmit={formik.handleSubmit} className="grid gap-5">
                        <div>
                            <label className="block mb-1 text-sm font-medium">Nombre de la jornada</label>
                            <input type="text" {...formik.getFieldProps('nombreJornada')} className={`input w-full p-2 border rounded-md uppercase ${formik.touched.nombreJornada && formik.errors.nombreJornada ? 'border-red-500' : ''}`} />
                            {formik.touched.nombreJornada && formik.errors.nombreJornada && <span className="text-red-500 text-xs">{formik.errors.nombreJornada}</span>}
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium">Descripción (opcional)</label>
                            <textarea {...formik.getFieldProps('descripcion')} rows={2} className="input w-full p-2 border rounded-md resize-none uppercase" />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium">Días de la jornada</label>
                            <div className="grid grid-cols-3 gap-2">
                                {diasDisponibles.map((dia) => (
                                    <button key={dia.id} type="button" onClick={() => toggleDia(dia)} className={`px-3 py-2 rounded-md border text-sm transition ${formik.values.dias.some((d: any) => d.id === dia.id) ? 'bg-primary-light text-primary border-primary' : 'bg-gray-100 dark:bg-zinc-900 border-gray-300'}`}>{dia.dia}</button>
                                ))}
                            </div>
                            {formik.touched.dias && formik.errors.dias && <span className="text-red-500 text-xs">{formik.errors.dias as string}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium">Hora inicio</label>
                                <input type="time" {...formik.getFieldProps('horaInicial')} className={`input w-full p-2 border rounded-md ${formik.touched.horaInicial && formik.errors.horaInicial ? 'border-red-500' : ''}`} />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium">Hora fin</label>
                                <input type="time" {...formik.getFieldProps('horaFinal')} className={`input w-full p-2 border rounded-md ${formik.touched.horaFinal && formik.errors.horaFinal ? 'border-red-500' : ''}`} />
                            </div>
                        </div>
                        {resumen && formik.values.dias.length > 0 && (
                            <div className="p-4 rounded-md border bg-gray-50 dark:bg-zinc-900 text-sm space-y-2">
                                <div className={`flex items-center gap-2 font-semibold ${resumen.color}`}><KeenIcon icon={resumen.icono} /> Jornada {resumen.tipoJornada}</div>
                                <p className="flex items-center gap-2"><KeenIcon icon="time" /> Horas por día: <strong>{resumen.horasPorDia} h</strong></p>
                                <p className="flex items-center gap-2"><KeenIcon icon="calendar" /> Total ({formik.values.dias.length} días): <strong>{resumen.horasTotales} h</strong></p>
                                {resumen.cruzaMedianoche && <p className="text-xs text-orange-600 flex items-center gap-1"><KeenIcon icon="warning-2" /> La jornada cruza medianoche</p>}
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-sm btn-primary" disabled={formik.isSubmitting}>{formik.isSubmitting ? 'Procesando...' : (jornada ? 'Actualizar' : 'Crear') + ' jornada'}</button>
                        </div>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default FormJornadaMaterias;
