import clsx from 'clsx';

interface CampoProps {
  label: string;
  name: string;
  type?: string;
  options?: string[];
  colSpan?: boolean;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

const NUMERICOS_REALES = ['edad', 'pago', 'saldo'];
const NUMERICOS_STRING = ['celularContacto', 'celularEmergencia', 'celularContactoF'];

export const Campo: React.FC<CampoProps> = ({
  label,
  name,
  type = 'text',
  options,
  colSpan,
  form,
  setForm
}) => {
  const val = form?.[name];

  const handleChange = (value: string) => {
    if (NUMERICOS_STRING.includes(name)) {
      const limpio = value.replace(/[^0-9]/g, '');
      setForm((p: any) => ({
        ...p,
        [name]: limpio
      }));
      return;
    }

    if (NUMERICOS_REALES.includes(name)) {
      const limpio = value.replace(/[^0-9]/g, '');
      setForm((p: any) => ({
        ...p,
        [name]: limpio === '' ? '' : Number(limpio)
      }));
      return;
    }

    setForm((p: any) => ({
      ...p,
      [name]: value
    }));
  };

  const formatCOP = (value: number) => new Intl.NumberFormat('es-CO').format(value);

  return (
    <div className={clsx('flex flex-col gap-1.5', colSpan && 'sm:col-span-2')}>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </label>

      {options ? (
        <select
          value={val ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none"
        >
          {options.map((o: string) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type === 'number' ? 'text' : type}
          value={
            NUMERICOS_REALES.includes(name)
              ? val === 0 || val === '' || val == null
                ? ''
                : formatCOP(Number(val))
              : (val ?? '')
          }
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none"
        />
      )}
    </div>
  );
};
