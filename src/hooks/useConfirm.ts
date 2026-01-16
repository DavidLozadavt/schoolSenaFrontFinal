import { useCallback } from 'react';
import Swal from 'sweetalert2';

export const useConfirm = () => {
  const confirmAction = useCallback(
    (message: string, onConfirm: () => void) => {
      const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;

      const isDarkMode = theme === 'dark';
      const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
      const color = isDarkMode ? 'white' : '#4B5675';
      const iconColor = isDarkMode ? 'white' : '#4B5675';

      Swal.fire({
        title: '¿Estás seguro?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Confirmar',
        cancelButtonText: 'Cancelar',
        customClass: {
          confirmButton: 'btn btn-sm btn-danger',
          cancelButton: 'btn btn-sm btn-light'
        },
        background,
        color,     
        iconColor, 
      }).then((result:any) => {
        if (result.isConfirmed) {
          onConfirm();
          Swal.fire({
            title: '¡Hecho!',
            text: 'La acción ha sido realizada.',
            icon: 'success',
            background,
            color,       
            iconColor,
            customClass: {
              confirmButton: 'btn btn-sm btn-success', 
            },
            showConfirmButton: true,
            confirmButtonText: 'Aceptar',
          });
        }
      });
    },
    []
  );

  return { confirmAction };
};