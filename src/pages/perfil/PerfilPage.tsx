import { useLayout } from '@/providers';

import { Container } from '@/components/container';
import { toAbsoluteUrl } from '@/utils';
import { UserProfileHero } from '@/partials/heros';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useState } from 'react';
import { ModalUpdatePerfil } from './ModalUpdatePerfil';

const PerfilPage = () => {
  const authContext = useAuthContext();
  const { persona } = authContext;

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Container>
      <style>
        {`
            .hero-bg {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-1.png')}');
            }
            .dark .hero-bg {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-1-dark.png')}');
            }
          `}
      </style>

      <div className="bg-center bg-cover bg-no-repeat hero-bg">
        <Container>
          <div className="flex flex-col items-center gap-2 lg:gap-3 py-4 lg:py-5">
            <img
              src={persona?.rutaFotoUrl}
              className="w-[120px] h-[120px] rounded-full border-4 border-success object-cover"
            />

            <div className="flex items-center gap-1.5">
              <div className="text-lg leading-5 font-semibold text-gray-800">
                {persona?.nombre1} {persona?.nombre2} {persona?.apellido1} {persona?.apellido2}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1 lg:gap-3 text-sm">
              <div className="flex gap-1 items-center">
                <a
                  href="mailto: {{ persona.email }}"
                  target="_blank"
                  className="text-gray-600 hover:text-primary"
                  rel="noreferrer"
                >
                  {persona?.email}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className=" rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Identificación', value: persona?.identificacion },
              { label: 'Nombre', value: `${persona?.nombre1 || ''} ${persona?.nombre2 || ''}` },
              {
                label: 'Apellido',
                value: `${persona?.apellido1 || ''} ${persona?.apellido2 || ''}`
              },
              { label: 'Fecha de Nacimiento', value: persona?.fechaNac },
              {
                label: 'Lugar de Nacimiento',
                value: `${persona?.ciudad_nac?.descripcion || ''}, ${persona?.ciudad_nac?.departamento?.descripcion || ''}`
              },
              {
                label: 'Lugar de Ubicación',
                value: `${persona?.ciudad_ubicacion?.descripcion || ''}, ${persona?.ciudad_ubicacion?.departamento?.descripcion || ''}`
              },
              { label: 'Dirección', value: persona?.direccion },
              { label: 'Email', value: persona?.email },
              { label: 'Teléfono', value: persona?.telefonoFijo },
              { label: 'Celular', value: persona?.celular },
              { label: 'Sexo', value: persona?.sexo },
              { label: 'RH', value: persona?.rh }
            ].map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {item.label}
                </label>
                <p className="text-gray-800 font-medium">{item.value || '—'}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              Actualizar Perfil
            </button>
          </div>
        </div>
      </Container>

      <ModalUpdatePerfil open={modalOpen} onClose={() => setModalOpen(false)} />
    </Container>
  );
};

export { PerfilPage };
