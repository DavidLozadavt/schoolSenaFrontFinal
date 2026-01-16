import { useState, useEffect, forwardRef } from 'react';
import { KeenIcon } from '../keenicons';

interface IModalTitleEditProps {
  title?: string;
  className?: string;
  onSave?: (newTitle: string) => void;
}

const ModalTitleEdit = forwardRef<HTMLHeadingElement, IModalTitleEditProps>(
  ({ title = '', className = '', onSave }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableTitle, setEditableTitle] = useState(title);

    useEffect(() => {
      setEditableTitle(title);
    }, [title]);

    const handleSave = () => {
      setIsEditing(false);
      if (onSave) onSave(editableTitle);
    };

    return (
      <h3
        ref={ref}
        className={`modal-title ${className}`}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            className="input  border border-gray-300 rounded-md w-full"
          />
        ) : (
          <span
            className="flex items-center gap-2 cursor-pointer hover:text-primary transition"
            onClick={() => setIsEditing(true)}
          >
            <span>{editableTitle || 'Sin título'}</span>
            <KeenIcon className="-mt-1.3 opacity-70 hover:opacity-100" icon="pencil" />
          </span>
        )}
      </h3>
    );
  }
);

export { ModalTitleEdit };
