import React from 'react';

/**
 * Logo de la empresa o colegio en la cabecera del formulario. Va dentro de un
 * marco blanco para que cualquier imagen (cuadrada, horizontal, con o sin fondo)
 * quede enmarcada igual; el marco se ensancha con los logos horizontales.
 */
const LogoFormulario: React.FC<{ url: string; color: string }> = ({ url, color }) => (
  <div
    className="h-20 min-w-[5rem] max-w-[150px] sm:max-w-[190px] shrink-0 p-2.5 rounded-2xl bg-white flex items-center justify-center overflow-hidden"
    style={{ border: `1px solid ${color}30`, boxShadow: `0 10px 25px -10px ${color}55` }}
  >
    <img src={url} alt="Logo" className="max-h-full max-w-full object-contain rounded-lg" />
  </div>
);

export default LogoFormulario;
