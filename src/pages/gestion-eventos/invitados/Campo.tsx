import clsx from 'clsx';
import { KeenIcon } from '@/components';

interface CampoProps {
  label: string;
  name: string;
  type?: string;
  options?: string[];
  colSpan?: boolean;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  placeholder?: string;
  icon?: string;
  hint?: string;
  required?: boolean;
  textarea?: boolean;
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
  setForm,
  placeholder,
  icon,
  hint,
  required,
  textarea
}) => {
  const val = form?.[name];

  const handleChange = (value: string) => {
    if (NUMERICOS_STRING.includes(name)) {
      const limpio = value.replace(/[^0-9]/g, '');
      setForm((p: any) => ({ ...p, [name]: limpio }));
      return;
    }

    if (NUMERICOS_REALES.includes(name)) {
      const limpio = value.replace(/[^0-9]/g, '');
      setForm((p: any) => ({ ...p, [name]: limpio === '' ? '' : Number(limpio) }));
      return;
    }

    setForm((p: any) => ({ ...p, [name]: value }));
  };

  const formatCOP = (value: number) => new Intl.NumberFormat('es-CO').format(value);

  const inputClasses =
    'w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-zinc-700/80 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-300 dark:placeholder:text-zinc-600';

  const inputWithIconClasses =
    'w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 dark:border-zinc-700/80 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 placeholder:text-gray-300 dark:placeholder:text-zinc-600';

  return (
    <div className={clsx('flex flex-col gap-1.5', colSpan && 'sm:col-span-2')}>
      <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
        {label}
        {required && <span className="text-rose-400 text-xs">*</span>}
      </label>

      {options ? (
        <div className="relative">
          {icon && (
            <KeenIcon
              icon={icon}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
            />
          )}
          <select
            value={val ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            className={clsx(
              icon ? inputWithIconClasses : inputClasses,
              'appearance-none cursor-pointer pr-8'
            )}
          >
            {options.map((o: string) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <KeenIcon
            icon="down"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"
          />
        </div>
      ) : textarea ? (
        <textarea
          value={val ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={clsx(inputClasses, 'resize-none')}
        />
      ) : (
        <div className="relative">
          {icon && (
            <KeenIcon
              icon={icon}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
            />
          )}
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
            placeholder={placeholder}
            className={icon ? inputWithIconClasses : inputClasses}
          />
        </div>
      )}

      {hint && (
        <p className="text-[10px] text-gray-400 leading-snug mt-0.5">{hint}</p>
      )}
    </div>
  );
};
