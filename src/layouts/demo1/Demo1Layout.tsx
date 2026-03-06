import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo1LayoutProvider, Main } from './';
import { useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuthContext } from '@/auth';

const Demo1Layout = () => {
  // Using the useBodyClasses hook to set background styles for light and dark modes
  useBodyClasses(`
    [--tw-page-bg:#fefefe] 
    [--tw-page-bg-dark:var(--tw-coal-500)] 
    bg-[--tw-page-bg] 
    dark:bg-[--tw-page-bg-dark]
  `);

  const { persona } = useAuthContext();

  useEffect(() => {
    const verificarRapsPendientes = async () => {

      try {
        if (!persona || !persona.contrato) return;
        const yaSeMostro = sessionStorage.getItem('sofia_plus_alert_shown');
        if (yaSeMostro) return;
        const response = await axios.get(`raps/evaluar/contrato`, {
          params: {
            contratos: persona.contrato
          }
        });
        const rapsPendientes = response.data || [];

        if (Array.isArray(rapsPendientes) && rapsPendientes.length > 0) {
          
          Swal.fire({
            title: '<span class="text-lg font-black uppercase">Pendientes en Sofia Plus</span>',
            html: `
              <div class="text-sm">
                <p>Usted tiene <b>${rapsPendientes.length}</b> resultados de aprendizaje por evaluar.</p>
                <p class="mt-2 text-xs text-gray-500">Por favor, ingrese a la plataforma para ponerse al día.</p>
                <p class="mt-2 text-xs text-blue-500 text-start">A evaluar</p>
                <ul class="mt-2 text-xs text-gray-500">
                  ${rapsPendientes.map((rap: any) => `<li class="mt-1 text-start decoration-clone">${rap.nombreMateria}</li>`).join('')}
                </ul>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'ENTENDIDO',
            customClass: {
              confirmButton: 'btn btn-primary px-10'
            },
            buttonsStyling: false,
          }).then(() => {
            sessionStorage.setItem('sofia_plus_alert_shown', 'true');
          });
        }
      } catch (error) {
        //console.error("Error al verificar RAPs",error);
      }
    };

    const timeout = setTimeout(verificarRapsPendientes, 500);
    
    return () => clearTimeout(timeout);
  }, [persona]);


  return (
    <Demo1LayoutProvider>
      <Main />
    </Demo1LayoutProvider>
  );
};

export { Demo1Layout };
