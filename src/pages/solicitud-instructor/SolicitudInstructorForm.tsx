import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from "@/components";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useEffect, useState } from "react";
import Select from "react-select";
import { enqueueSnackbar } from "notistack";

interface Props {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
    ficha?: any;
    programa?: string | null;
}

const SolicitudInstructorForm = ({ open, onClose, onSave, ficha, programa }: Props) => {
    const [fichas, setFichas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && !ficha) {
            fetchData();
        }
    }, [open, ficha]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fichasRes = await axios.get('instructor-lider');
            setFichas(fichasRes.data.data || fichasRes.data || []);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Error al cargar fichas', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    interface FormValues {
        idFicha: string | null;
        fechaInicio: string;
    }

    const formik = useFormik<FormValues>({
        initialValues: {
            idFicha: ficha?.id || null,
            fechaInicio: ''
        },
        validationSchema: Yup.object({
            idFicha: Yup.string().required('Debe seleccionar una ficha'),
            fechaInicio: Yup.date().min((new Date(new Date().setHours(0, 0, 0, 0))), 'La fecha de inicio no puede ser menor a la fecha actual').required('La fecha de inicio es obligatoria')
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                await axios.post('solicitud-materia', values);
                enqueueSnackbar('Solicitud creada exitosamente', { variant: 'success' });
                resetForm();
                if (onSave) {
                    onSave();
                }
            } catch (error: any) {
                enqueueSnackbar(error.response?.data?.message || 'Error al crear la solicitud', { variant: 'error' });
            } finally {
                setSubmitting(false);
            }
        }
    });

    const fichasOptions = fichas.map(f => ({
        value: f.id,
        label: `${f.codigo} - ${f.asignacion?.programa?.nombrePrograma.toUpperCase() || ''}`
    }));

    return (
        <Modal open={open} onClose={onClose}>
            <ModalContent className="w-full max-w-xl p-4">
                <ModalHeader>
                    <ModalTitle>Nueva Solicitud de Instructor</ModalTitle>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
                    >
                        <i className="ki-outline ki-cross"></i>
                    </button>
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={formik.handleSubmit} className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                Ficha <span className="text-danger">*</span>
                            </label>
                            {/* SI LLEGA EL IDFICHA DESDE EL PROP MOSTRAMOS LA FICHA SELECCIONADA, SI NO SE OBTIENE LA LISTA DE FICHAS DEL INSTRUCTOR */}
                            {ficha ?
                                <span className="font-bold">{ficha.codigo} - {programa?.toUpperCase()}</span>
                                :
                                <div>
                                    <Select
                                        options={fichasOptions}
                                        isLoading={loading}
                                        onChange={(opt) => {
                                            formik.setFieldValue('idFicha', opt?.value);
                                        }}
                                        placeholder="Seleccione una ficha"
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        isClearable
                                    />
                                    {formik.touched.idFicha && formik.errors.idFicha && (
                                        <p className="text-danger text-xs mt-1 font-semibold">{formik.errors.idFicha as string}</p>
                                    )}
                                </div>
                            }
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                                Fecha Inicio <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                name="fechaInicio"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.fechaInicio}
                            />
                            {formik.touched.fechaInicio && formik.errors.fechaInicio && (
                                <p className="text-danger text-xs mt-1 font-semibold">{formik.errors.fechaInicio as string}</p>
                            )}
                        </div>

                        <div className="flex justify-around pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                className="px-6 py-2.5 text-xs font-black uppercase tracking-wider border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 text-xs font-black uppercase tracking-wider bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={formik.isSubmitting}
                            >
                                {formik.isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : null}
                                {formik.isSubmitting ? 'Enviando...' : 'Crear Solicitud'}
                            </button>
                        </div>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default SolicitudInstructorForm;