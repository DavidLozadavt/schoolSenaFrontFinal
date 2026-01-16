import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { NovedadesModal } from './NovedadesModal';
import Spinner from '@/components/loaders/Spinner';
import { NovedadesAprobadasModal } from './NovedadesAprobadasModal';
import { ModalResumenIncapcacidades } from './ModalResumenIncapcacidades';

interface ContentProps {
  reload?: boolean;
  onExportReady: (fn: () => void) => void;
  onExportAPReady: (fn: () => void) => void;
}

interface NovedadesData {
  persona?: any;
  contratoId?: number;
}

const NominasContent = ({ reload, onExportReady, onExportAPReady }: ContentProps) => {
  const storageFilterId = 'tu-nomina-filter';
  const [nominas, setNominas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isModalOpenNovedades, setIsModalOpenNovedades] = useState(false);
  const [isModalOpenNovedadesAprobadas, setIsModalOpenNovedadesAprobadas] = useState(false);
  const [isModalResumenIncapacidad, setIsModalResumenIncapacidad] = useState(false);

  const [tarifa, setTarifa] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();

  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const location = useLocation();
  const { id, fecha, fechaInicialPeriodo, fechaFinalPeriodo } = location.state || {};
  const [selectedArea, setSelectedArea] = useState('');

  const [novedadesData, setNovedadesData] = useState<NovedadesData | null>(null);

  const fetchAreas = async () => {
    try {
      const response = await axios.get('all_areas');
      setAreas(response.data);
    } catch (err) {
      setError(`Error al cargar las areas: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleOpenNovedades = (contrato: any, persona: any) => {
    setNovedadesData({
      persona,
      contratoId: contrato?.id
    });
    setIsModalOpenNovedades(true);
  };

  const handleOpenNovedadesAprobadas = (contrato: any, persona: any) => {
    setNovedadesData({
      persona,
      contratoId: contrato?.id
    });
    setIsModalOpenNovedadesAprobadas(true);
  };

  const fetchTuNomina = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`get_nominas_by_liquidacion/${id}`);
      setNominas(response.data);
    } catch (error) {
      setError('Error al cargar la nómina');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleLiquidar = useCallback(
    async (idContrato: string) => {
      try {
        setLoading(true);

        await axios.post('ejecutar_nomina_procedure_individual', {
          idContrato,
          idL: id
        });

        await fetchTuNomina();
      } catch (error) {
        console.error('Error al reliquidar:', error);
      } finally {
        setLoading(false);
      }
    },
    [id, fetchTuNomina]
  );

  const handleClickLiquidar = useCallback(
    (id?: any) => {
      confirmAction('¿Estás seguro de reliquidar este contrato?', () => handleLiquidar(id));
    },
    [confirmAction, handleLiquidar]
  );

  const exportAp = useCallback(() => {
    // Línea 01 - Encabezado
    const tipoRegistro = '01';
    const consecutivo = '00001';
    const nombreEmpresa = 'COOPERATIVA INTEGRAL DE TRANSPORTES RAPIDO TAMBO';
    const tipoDoc = 'NI';
    const nit = '891500194';
    const extra =
      '       9E                    U                                                  ';
    const rango = '14-29 ';
    const periodo = '2025-06';
    const periodoPago = '2025-07';
    const espaciosFinales = '                    ';
    const codigoPlanilla = '003080004461019890100';

    const encabezado =
      tipoRegistro +
      consecutivo +
      nombreEmpresa.padEnd(100, ' ') +
      tipoDoc +
      nit +
      extra +
      rango +
      periodo +
      periodoPago +
      espaciosFinales +
      codigoPlanilla +
      '\r\n';

    // Líneas 02 - Detalle
    let detalle = '';

    // Mapeo de tipos de novedad a códigos del archivo plano
    const mapeoNovedades = {
      INGRESO: { campo: 'ING', valor: 'X' },
      RETIRO: { campo: 'RET', valor: 'R' },
      'TRASLADO DESDE OTRA EPS O EOC': { campo: 'TDE', valor: 'X' },
      'TRASLADO A OTRA EPS O EOC': { campo: 'TAE', valor: 'X' },
      'TRASLADO DESDE OTRA ADMINISTRADORA DE PENSIONES': { campo: 'TDP', valor: 'X' },
      'TRASLADO A OTRA ADMINISTRADORA DE PENSIONES': { campo: 'TAP', valor: 'X' },
      'VARIACION PERMANENTE DE SALARIO': { campo: 'VSP', valor: 'X' },
      CORRECCIONES: { campo: 'CORRECCIONES', valor: 'A' },
      'VARIACION TRANSITORIA DEL SALARIO': { campo: 'VST', valor: 'X' },
      'SUSPENSION TEMPORAL DEL CONTRATO DE TRABAJO O LICENCIA NO REMUNERADA O COMISION DE SERVICIOS':
        { campo: 'SLN', valor: 'X' },
      'INCAPACIDAD TEMPORAL POR ENFERMEDAD GENERAL': { campo: 'IGE', valor: 'X' },
      'LICENCIA DE MATERNIDAD O DE PATERNIDAD': { campo: 'LMA', valor: 'X' },
      'VACACIONES, LICENCIA REMUNERADA': { campo: 'VAC', valor: 'X' },
      'APORTE VOLUNTARIO': { campo: 'AVP', valor: 'X' },
      'VARIACION CENTROS DE TRABAJO': { campo: 'VCT', valor: 'X' }
    };

    nominas.forEach((nomina, index) => {
      const tipoRegistroDetalle = '02'; // (1-2)
      const consecutivoDetalle = (index + 1).toString().padStart(5, '0'); // (3-7)

      // Campo 3: Tipo documento del cotizante (8-9)
      const tipoIdentificacion = (nomina.contrato.persona.tipo_identificacion?.codigo || '').padEnd(
        2,
        ' '
      );

      // Campo 4: Número de identificación (10-25) - 16 posiciones
      const identificacion = (nomina.contrato.persona.identificacion || '').padEnd(16, ' ');

      // Campo 5: Tipo cotizante (26-27) - Solo 2 dígitos
      const tipoCotizante =
        nomina.contrato.tipoCotizante?.codigo?.toString().padStart(2, '0') || '00';

      // Campo 6: Subtipo cotizante (28-29) - Solo 2 dígitos
      const subtipoCotizante =
        nomina.contrato.subTipoCotizante?.codigo?.toString().padStart(2, '0') || '00';

      // Campos 9-10: Código departamento y municipio (32-36)
      const codigoCompleto = nomina.contrato.persona?.ciudad_ubicacion?.codigo || '';
      const codigoDepartamento = codigoCompleto.substring(0, 2).padEnd(2, ' '); // (32-33)
      const codigoMunicipio = codigoCompleto.substring(2, 5).padEnd(3, ' '); // (34-36)

      // Campos de nombres (37-136)
      const apellido1 = (nomina.contrato.persona.apellido1 || '').padEnd(20, ' '); // (37-56)
      const apellido2 = (nomina.contrato.persona.apellido2 || '').padEnd(30, ' '); // (57-86)
      const nombre1 = (nomina.contrato.persona.nombre1 || '').padEnd(20, ' '); // (87-106)
      const nombre2 = (nomina.contrato.persona.nombre2 || '').padEnd(30, ' '); // (107-136)

      // Posiciones 30-31 no están documentadas en tus screenshots - se dejan en blanco
      const colombianoExterior = '  ';

      // Campos de novedades (137-151) - Inicialmente en blanco
      let novedades = {
        ING: ' ', // 137
        RET: ' ', // 138
        TDE: ' ', // 139
        TAE: ' ', // 140
        TDP: ' ', // 141
        TAP: ' ', // 142
        VSP: ' ', // 143
        CORRECCIONES: ' ', // 144
        VST: ' ', // 145
        SLN: ' ', // 146
        IGE: ' ', // 147
        LMA: ' ', // 148
        VAC: ' ', // 149
        AVP: ' ', // 150
        VCT: ' ' // 151
      };

      // Procesar novedades del contrato
      // if (nomina.contrato.novedades && nomina.contrato.novedades.length > 0) {
      //   nomina.contrato.novedades.forEach((novedad) => {
      //     const mapeo = mapeoNovedades[novedad.tipo];
      //     if (mapeo) {
      //       novedades[mapeo.campo] = mapeo.valor;
      //     }
      //   });
      // }

      // Campo 30: IRL - Días de incapacidad por accidente de trabajo o enfermedad laboral (152-153)
      const diasIncapacidad = '00'; // Aquí debes poner el valor real de días

      // Campos 31-35: Códigos de administradoras (154-183)
      const codigoPensionActual = (nomina.contrato.pension?.codigo || '').padEnd(6, ' '); // 154-159
      const codigoPensionTraslado = (nomina.contrato.pensionTraslado?.codigo || '').padEnd(6, ' '); // 160-165
      const codigoSaludActual = (nomina.contrato.salud?.codigo || '').padEnd(6, ' '); // 166-171
      const codigoSaludTraslado = (nomina.contrato.saludMovilidad?.codigo || '').padEnd(6, ' '); // 172-177
      const codigoCCF = (nomina.contrato.cajaCompensacion?.codigo || '').padEnd(6, ' '); // 178-183

      // Construir sección de novedades (137-151)
      const seccionNovedades =
        novedades.ING + // 137
        novedades.RET + // 138
        novedades.TDE + // 139
        novedades.TAE + // 140
        novedades.TDP + // 141
        novedades.TAP + // 142
        novedades.VSP + // 143
        novedades.CORRECCIONES + // 144
        novedades.VST + // 145
        novedades.SLN + // 146
        novedades.IGE + // 147
        novedades.LMA + // 148
        novedades.VAC + // 149
        novedades.AVP + // 150
        novedades.VCT; // 151

      const lineaDetalle =
        tipoRegistroDetalle + // 1-2
        consecutivoDetalle + // 3-7
        tipoIdentificacion + // 8-9
        identificacion + // 10-25
        tipoCotizante + // 26-27
        subtipoCotizante + // 28-29
        colombianoExterior + // 30-31 (Colombiano en el exterior)
        codigoDepartamento + // 32-33
        codigoMunicipio + // 34-36
        apellido1 + // 37-56
        apellido2 + // 57-86
        nombre1 + // 87-106
        nombre2 + // 107-136
        seccionNovedades + // 137-151
        diasIncapacidad + // 152-153 (IRL)
        codigoPensionActual + // 154-159
        codigoPensionTraslado + // 160-165
        codigoSaludActual + // 166-171
        codigoSaludTraslado + // 172-177
        codigoCCF + // 178-183
        '\r\n';

      detalle += lineaDetalle;
    });

    const contenidoCompleto = encabezado + detalle;

    const blob = new Blob([contenidoCompleto], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'ap2506.txt');

    console.log('Archivo generado:\n', contenidoCompleto);
  }, [nominas]);

  useEffect(() => {
    if (onExportAPReady) {
      onExportAPReady(exportAp);
    }
  }, [onExportAPReady, exportAp]);

  const exportToExcel = useCallback(() => {
    const formatoCOP = (valor: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(valor ?? 0);

    const dataToExport = nominas.map((item) => {
      const persona = item.contrato?.persona || {};
      const deducciones = (item.salud || 0) + (item.pension || 0) + (item.fsp || 0);

      return {
        Trabajador: `${persona.nombre1 ?? ''} ${persona.apellido1 ?? ''}`,
        Identificación: persona.identificacion ?? '',
        Salario: formatoCOP(item.salarioBasico ?? 0),
        'Aux. Transporte': formatoCOP(item.auxTransporte ?? 0),
        'H. Extras': formatoCOP(item.valorHorasExtras ?? 0),
        Incapacidades: formatoCOP(item.incapacidades ?? 0),
        'Total Devengado': formatoCOP(item.devengado ?? 0),
        Salud: formatoCOP(item.salud ?? 0),
        Pensión: formatoCOP(item.pension ?? 0),
        FSP: formatoCOP(item.fsp ?? 0),
        Deducciones: formatoCOP(deducciones ?? 0),
        'Neto Pagado': formatoCOP(item.netoPagado ?? 0)
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nóminas');

    const columnWidths = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = columnWidths;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const fecha = new Date().toISOString().split('T')[0];
    saveAs(excelBlob, `nominas_${fecha}.xlsx`);

    const headers = Object.keys(dataToExport[0] || {}).join('\t');
    const rows = dataToExport.map((row) => Object.values(row).join('\t')).join('\n');
    const txtContent = `${headers}\n${rows}`;

    const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    saveAs(txtBlob, `nominas_${fecha}.txt`);
  }, [nominas]);

  useEffect(() => {
    if (onExportReady) {
      onExportReady(exportToExcel);
    }
  }, [onExportReady, exportToExcel]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'trabajador',
        header: () => 'Trabajador',
        cell: ({ row }: any) => {
          const contrato = row.original?.contrato;
          const persona = contrato?.persona;

          const tieneNotificaciones =
            contrato?.horasExtra?.length > 0 ||
            contrato?.vacaciones?.length > 0 ||
            contrato?.solicitudIncLicPersonas?.length > 0;

          return (
            <div className="flex flex-col items-center relative">
              <img
                src={persona?.rutaFotoUrl}
                alt="Foto"
                className="object-cover w-10 h-10 mb-2 rounded-full"
              />
              <span className="font-medium text-center text-gray-700">
                {persona?.nombre1} {persona?.apellido1}
              </span>

              {tieneNotificaciones && (
                <div
                  className="absolute -top-3 -right-3 cursor-pointer"
                  onClick={() => handleOpenNovedades(contrato, persona)}
                >
                  <div className="relative btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500">
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                    <KeenIcon icon="notification" />
                  </div>
                </div>
              )}
            </div>
          );
        }
      },

      {
        id: 'identificacion',
        header: () => 'Identificación',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.contrato?.persona?.identificacion}
          </span>
        ),
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'salario',
        header: () => 'Salario',
        enableSorting: true,
        cell: ({ row }: any) => {
          const valor = row.original.salarioBasico ?? 0;
          return (
            <span className="text-gray-700 text-right block pr-2">
              {valor.toLocaleString('es-CO')}
            </span>
          );
        },
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'auxTransporte',
        header: () => 'Aux. Transporte',
        enableSorting: true,
        cell: ({ row }: any) => {
          const valor = row.original.auxTransporte ?? 0;
          return (
            <span className="text-gray-700 text-right block pr-2">
              {valor.toLocaleString('es-CO')}
            </span>
          );
        },
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'horasExtras',
        header: () => 'H. Extras',
        enableSorting: true,
        cell: ({ row }: any) => {
          const valor = row.original.valorHorasExtras ?? 0;
          return (
            <span className="text-gray-700 text-right block pr-2">
              {valor.toLocaleString('es-CO')}
            </span>
          );
        },
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'incapacidades',
        header: () => 'Incapacidades',
        enableSorting: true,
        cell: ({ row }: any) => {
          const valor = row.original.valorIncapcidadesLicencias ?? 0;
          const formatoCOP = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(valor);

          return (
            <div className="relative flex items-center justify-end pr-2">
              <div
              onClick={()=> setIsModalResumenIncapacidad(true)}
                className="absolute -top-10 -right-1 btn btn-icon btn-icon-lg size-8 rounded-full hover:bg-primary-light hover:text-primary text-gray-500 cursor-pointer"
                title="Incapacidades"
              >
                <KeenIcon icon="information-1" />
              </div>

              <span className="text-gray-700 text-right block min-w-[90px]">{formatoCOP}</span>
            </div>
          );
        },
        meta: { className: 'min-w-[140px] text-right relative' }
      },

      {
        id: 'devengado',
        header: () => 'Total Devengado',
        enableSorting: true,
        cell: ({ row }: any) => {
          const valor = row.original.devengado ?? 0;
          return (
            <span className="text-gray-700 text-right block pr-2">
              {valor.toLocaleString('es-CO')}
            </span>
          );
        },
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'salud',
        header: () => 'Salud',
        cell: ({ row }: any) => (
          <span className="text-gray-700 text-right block pr-2">
            {(row.original.salud ?? 0).toLocaleString('es-CO')}
          </span>
        ),
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'pension',
        header: () => 'Pensión',
        cell: ({ row }: any) => (
          <span className="text-gray-700 text-right block pr-2">
            {(row.original.pension ?? 0).toLocaleString('es-CO')}
          </span>
        ),
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'fsp',
        header: () => 'FSP',
        cell: ({ row }: any) => (
          <span className="text-gray-700 text-right block pr-2">
            {(row.original.fsp ?? 0).toLocaleString('es-CO')}
          </span>
        ),
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'deducciones',
        header: () => 'Deducciones',
        cell: ({ row }: any) => (
          <span className="text-gray-700 text-right block pr-2">
            {(row.original.valorDeducciones ?? 0).toLocaleString('es-CO')}
          </span>
        ),
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'netoPagado',
        header: () => 'Neto Pagado',
        cell: ({ row }: any) => (
          <span className="text-gray-700 text-right block pr-2 font-semibold">
            {(row.original.netoPagado ?? 0).toLocaleString('es-CO')}
          </span>
        ),
        meta: { className: 'min-w-[120px] text-right' }
      },

      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const contrato = row.original?.contrato?.id;
          const contratoData = row.original?.contrato;
          const persona = contratoData?.persona;
          return (
            <div className="flex justify-center items-center">
              <button
                className="p-1"
                title="Reliquidar"
                onClick={() => handleClickLiquidar(contrato)}
              >
                <KeenIcon icon="arrows-loop" className="text-xl" />
              </button>

              <button
                className="p-1"
                title="Novedades aprobadas"
                onClick={() => handleOpenNovedadesAprobadas(contratoData, persona)}
              >
                <KeenIcon icon="calendar-tick" className="text-xl" />
              </button>
            </div>
          );
        },
        meta: { className: 'w-[100px] text-center' }
      }
    ],
    [handleClickLiquidar]
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchTuNomina();
  }, [fetchTuNomina, reload]);

  const handleAfterSave = () => {
    fetchTuNomina();
  };
  const filteredData = useMemo(() => {
    return nominas.filter((dat) => {
      const contrato = dat.contrato;

      const matchesArea = selectedArea ? contrato?.idArea === Number(selectedArea) : true;

      const search = searchTerm.toLowerCase();
      const matchesSearch = search
        ? contrato?.persona?.nombre1?.toLowerCase().includes(search) ||
          contrato?.persona?.apellido1?.toLowerCase().includes(search) ||
          contrato?.persona?.identificacion?.toLowerCase().includes(search)
        : true;

      return matchesArea && matchesSearch;
    });
  }, [nominas, selectedArea, searchTerm]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      {loading && <Spinner />}
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Contratos</h3>

        <div className="flex items-center gap-4">
          <select
            className="select select-sm w-40"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="">Seleccionar área</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>

          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-md"
            />
            <input
              type="text"
              placeholder="Buscar Nóminas"
              className="pl-8 input input-sm w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={JSON.stringify(filteredData)}
          columns={columns}
          data={filteredData}
          pagination={{ size: 10 }}
        />

        {/* <div className="w-1/2 p-2 mt-4">
          <table className="w-full text-left border border-collapse border-gray-300 table-auto">
            <thead></thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Numero de Trabajadores</td>
                <td className="px-4 py-2 border border-gray-300">22</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Total Nomina</td>
                <td className="px-4 py-2 border border-gray-300">$20.000.000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Parcial</td>
                <td className="px-4 py-2 border border-gray-300">$10.000.000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Deducciones</td>
                <td className="px-4 py-2 border border-gray-300">$10.000.000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Parafiscales</td>
                <td className="px-4 py-2 border border-gray-300">$10.000.000</td>
              </tr>
            </tbody>
          </table>
        </div> */}

        <NovedadesModal
          open={isModalOpenNovedades}
          data={novedadesData}
          onClose={() => setIsModalOpenNovedades(false)}
          onSave={handleAfterSave}
        />

        <ModalResumenIncapcacidades
          open={isModalResumenIncapacidad}
          onClose={() => setIsModalResumenIncapacidad(false)}
        />

        <NovedadesAprobadasModal
          open={isModalOpenNovedadesAprobadas}
          data={novedadesData}
          onClose={() => setIsModalOpenNovedadesAprobadas(false)}
          onSave={handleAfterSave}
        />
      </div>
    </div>
  );
};

export { NominasContent };
