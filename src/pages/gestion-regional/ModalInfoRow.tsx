import React from 'react';

interface Props {
  icon: string;
  label: string;
  value?: string | null;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  multiline?: boolean;
  isEmpty?: boolean;
}

const ModalInfoRow: React.FC<Props> = ({
  icon,
  label,
  value,
  color,
  multiline = false,
  isEmpty = false
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/10',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10'
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <i className={`ki-outline ki-${icon} text-sm`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p
          className={`
            font-bold leading-snug
            ${multiline ? 'line-clamp-2 break-words' : 'truncate'}
            ${
              isEmpty
                ? 'text-gray-400 dark:text-gray-500 italic'
                : 'text-gray-700 dark:text-gray-200'
            }
          `}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default ModalInfoRow;
