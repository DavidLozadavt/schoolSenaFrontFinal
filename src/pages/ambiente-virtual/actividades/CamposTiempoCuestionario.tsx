import { useErroresFormulario } from './useErroresFormulario';

type Validacion = ReturnType<typeof useErroresFormulario>;
interface Props {
  base: string;
  horas: string;
  minutos: string;
  onChange: (valores: { horas: string; minutos: string }) => void;
  validacion: Validacion;
}

export function CamposTiempoCuestionario({ base, horas, minutos, onChange, validacion }: Props) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
      <legend className="px-1 text-sm font-semibold text-gray-800 dark:text-white">Tiempo límite (opcional)</legend>
      <div className="grid grid-cols-2 gap-4">
        {(['horas', 'minutos'] as const).map((unidad) => (
          <div key={unidad} className="min-w-0">
            <label htmlFor={validacion.campo(`${base}.${unidad}`).id} className="mb-1 block text-sm text-gray-700 dark:text-white">
              {unidad === 'horas' ? 'Horas' : 'Minutos'}
            </label>
            <input
              {...validacion.campo(`${base}.${unidad}`)}
              type="number" min={0} max={unidad === 'horas' ? 168 : 59} step={1}
              className="input w-full min-w-0 p-2 text-sm dark:text-white"
              placeholder="0" value={unidad === 'horas' ? horas : minutos}
              onChange={(e) => {
                validacion.limpiarCampo(base);
                onChange({ horas, minutos, [unidad]: e.target.value });
              }}
            />
            {validacion.mensaje(`${base}.${unidad}`)}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-white">Deja ambos campos vacíos o en 0 para realizarlo sin límite. El tiempo se aplica únicamente a esta asignación, desde que el aprendiz inicia cada intento.</p>
    </fieldset>
  );
}
