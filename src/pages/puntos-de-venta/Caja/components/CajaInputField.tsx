import React from 'react';
import { NumericFormat } from 'react-number-format';
import { KeenIcon } from '@/components';

interface CajaInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  showInfoButton?: boolean;
  onInfoClick?: () => void;
  infoTitle?: string;
}

const CajaInputField: React.FC<CajaInputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  showInfoButton = false,
  onInfoClick,
  infoTitle
}) => {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 text-sm font-medium">
        {label}
      </label>
      <div className="relative flex items-center">
        <NumericFormat
          id={id}
          value={value}
          onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
          className="w-full p-2 border border-gray-300 rounded-md input"
          thousandSeparator
          prefix="$"
          disabled={disabled}
        />
        {showInfoButton && onInfoClick && (
          <button
            type="button"
            onClick={onInfoClick}
            className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold border rounded-full right-2 hover:opacity-80 transition-opacity"
            title={infoTitle || 'Más información'}
          >
            <KeenIcon icon="information-2" className="w-3 h-5 mt-2 " />
          </button>
        )}
      </div>
    </div>
  );
};

export default CajaInputField;
