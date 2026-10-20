import React, { useLayoutEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, MapPin } from 'lucide-react';

export type PlantillaEscarapela = 'clasica' | 'moderna';

/** Respuesta del formulario que el diseño imprime además del nombre y la identificación */
export interface CampoEscarapelaExtra {
  etiqueta: string | null;
  valor: string;
}

export interface EscarapelaDatos {
  codigo: string;
  nombre: string | null;
  identificacion: string | null;
  evento: { nombre: string; fechaInicial: string | null; hora: string | null };
  empresa: { razonSocial: string | null };
  /** Color principal: cabecera, acentos y marco del QR */
  color: string;
  urlVerificacion: string;
  // Diseño del formulario (pestaña "Escarapelas"); sin ellos sale la clásica por defecto
  plantilla?: PlantillaEscarapela;
  colorFondo?: string;
  colorTexto?: string;
  mensaje?: string | null;
  ubicacion?: string | null;
  /** Logo y fondo como data URL */
  logo?: string | null;
  fondoImagen?: string | null;
  /** Foto que el inscrito subió en el formulario, si el diseño la muestra */
  fotoUrl?: string | null;
  campos?: CampoEscarapelaExtra[];
}

export const MENSAJE_ESCARAPELA = 'Presenta este código en el ingreso. Es personal e intransferible.';

/** Tamaño de diseño de la tarjeta: 10 x 14 cm. Se escala entera para otros anchos. */
export const ANCHO_ESCARAPELA = 320;
export const ALTO_ESCARAPELA = 448;

const fechaLarga = (fecha: string | null): string => {
  if (!fecha) return '';
  const d = new Date(`${fecha.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** "30 octubre 2026": cabe en una línea junto al QR de la plantilla moderna. */
const fechaCorta = (fecha: string | null): string => fechaLarga(fecha).replace(/ de /g, ' ');

const iniciales = (nombre: string | null): string => {
  const palabras = (nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return '?';
  return (palabras.length > 1 ? palabras[0][0] + palabras[palabras.length - 1][0] : palabras[0][0]).toUpperCase();
};

// Las tarjetas se exportan con html2canvas: colores en línea (hex) y sin
// object-fit, line-clamp ni filtros, que esa librería no dibuja.
const imagen = (url: string, modo: 'contain' | 'cover'): React.CSSProperties => ({
  backgroundImage: `url("${url}")`,
  backgroundSize: modo,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
});

interface Partes {
  datos: EscarapelaDatos;
  primario: string;
  texto: string;
  tenue: string;
  mensaje: string;
  fecha: string;
}

/**
 * Zona de alto fijo cuyo contenido se encoge entero cuando no cabe: la tarjeta
 * mide siempre 10 x 14 cm y con foto, campos extra o nombres largos el
 * contenido puede pasarse.
 */
const Ajustado: React.FC<{ arriba?: boolean; relleno?: string; children: React.ReactNode }> = ({ arriba = false, relleno, children }) => {
  const zona = useRef<HTMLDivElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);

  // Sin dependencias: se vuelve a medir en cada render (cambia con cada dato).
  // `offsetHeight` no incluye la escala, así que la medida no se realimenta.
  useLayoutEffect(() => {
    if (!zona.current || !contenido.current) return;
    const estilo = getComputedStyle(zona.current);
    const disponible = zona.current.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
    const necesaria = contenido.current.offsetHeight;
    const nueva = necesaria > disponible && necesaria > 0 ? Math.max(0.55, disponible / necesaria) : 1;
    if (Math.abs(nueva - escala) > 0.005) setEscala(nueva);
  });

  return (
    <div
      ref={zona}
      style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: arriba ? 'flex-start' : 'center', padding: relleno }}
    >
      <div
        ref={contenido}
        style={{
          flexShrink: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: escala === 1 ? undefined : `scale(${escala})`,
          transformOrigin: arriba ? 'top center' : 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Qr: React.FC<{ url: string; lado: number; primario: string; relleno: number }> = ({ url, lado, primario, relleno }) => (
  <div style={{ padding: relleno, background: '#ffffff', border: `2px solid ${primario}`, borderRadius: relleno + 6, lineHeight: 0 }}>
    <QRCodeCanvas value={url} size={lado} level="M" />
  </div>
);

const Campos: React.FC<{ campos?: CampoEscarapelaExtra[]; texto: string; tenue: string }> = ({ campos, texto, tenue }) => (
  <>
    {(campos || []).map((campo, i) => (
      <div key={i} style={{ marginTop: 6, maxWidth: '100%' }}>
        {campo.etiqueta && (
          <p style={{ margin: 0, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: tenue }}>{campo.etiqueta}</p>
        )}
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, lineHeight: '15px', maxHeight: 30, overflow: 'hidden', color: texto, wordBreak: 'break-word' }}>{campo.valor}</p>
      </div>
    ))}
  </>
);

const Clasica: React.FC<Partes> = ({ datos, primario, texto, tenue, mensaje, fecha }) => (
  <>
    <div style={{ position: 'relative', background: primario, color: '#ffffff', padding: '14px 18px 12px' }}>
      {datos.logo ? (
        <div style={{ height: 34, marginBottom: 6, ...imagen(datos.logo, 'contain') }} />
      ) : (
        datos.empresa.razonSocial && (
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.9 }}>
            {datos.empresa.razonSocial}
          </p>
        )
      )}
      <h1 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 900, lineHeight: '21px', maxHeight: 42, overflow: 'hidden' }}>{datos.evento.nombre}</h1>
      {fecha && (
        <p style={{ margin: '5px 0 0', fontSize: 11 }}>
          {fecha}
          {datos.evento.hora ? ` · ${datos.evento.hora}` : ''}
        </p>
      )}
      {datos.ubicacion && (
        <p style={{ margin: '3px 0 0', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <MapPin size={11} color="#ffffff" />
          <span>{datos.ubicacion}</span>
        </p>
      )}
    </div>

    <Ajustado relleno="6px 18px">
      {datos.fotoUrl && (
        <div style={{ width: 54, height: 54, flexShrink: 0, marginBottom: 6, borderRadius: '50%', border: `2px solid ${primario}`, ...imagen(datos.fotoUrl, 'cover') }} />
      )}
      <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: tenue }}>Asistente</p>
      <p style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 900, lineHeight: '23px', maxHeight: 46, overflow: 'hidden', color: texto, maxWidth: '100%', wordBreak: 'break-word' }}>
        {datos.nombre || 'Asistente'}
      </p>
      {datos.identificacion && (
        <>
          <p style={{ margin: '8px 0 0', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: tenue }}>Identificación</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 900, color: texto }}>{datos.identificacion}</p>
        </>
      )}
      <Campos campos={datos.campos} texto={texto} tenue={tenue} />
      <div style={{ marginTop: 12 }}>
        <Qr url={datos.urlVerificacion} lado={datos.fotoUrl || datos.campos?.length ? 96 : 116} primario={primario} relleno={8} />
      </div>
    </Ajustado>

    <p style={{ position: 'relative', margin: 0, padding: '0 18px 10px', fontSize: 9.5, lineHeight: '12px', color: tenue }}>{mensaje}</p>
    <div style={{ position: 'relative', height: 5, background: primario }} />
  </>
);

const Moderna: React.FC<Partes> = ({ datos, primario, texto, tenue, mensaje }) => (
  <>
    {!datos.fondoImagen && (
      <>
        <div style={{ position: 'absolute', left: -70, top: -60, width: 190, height: 190, borderRadius: '50%', background: `${primario}1f` }} />
        <div style={{ position: 'absolute', right: -90, top: 130, width: 220, height: 220, borderRadius: '50%', background: `${primario}14` }} />
        <div style={{ position: 'absolute', left: -60, bottom: -70, width: 170, height: 170, borderRadius: '50%', background: `${primario}1a` }} />
      </>
    )}

    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px 10px' }}>
      <Ajustado arriba relleno="0 0 6px">
        {datos.logo ? (
          <div style={{ width: 190, height: 40, flexShrink: 0, ...imagen(datos.logo, 'contain') }} />
        ) : (
          datos.empresa.razonSocial && (
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: primario }}>
              {datos.empresa.razonSocial}
            </p>
          )
        )}

        <h1 style={{ margin: '8px 0 0', fontSize: 17, fontWeight: 900, lineHeight: '19px', maxHeight: 38, overflow: 'hidden', textTransform: 'uppercase', color: texto }}>
          {datos.evento.nombre}
        </h1>
        {datos.ubicacion && (
          <p style={{ margin: '5px 0 0', fontSize: 11, fontWeight: 600, color: texto, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color={primario} />
            <span>{datos.ubicacion}</span>
          </p>
        )}

        <div
          style={{
            marginTop: 10,
            width: datos.fotoUrl ? 72 : 64,
            height: datos.fotoUrl ? 72 : 64,
            flexShrink: 0,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            ...(datos.fotoUrl ? imagen(datos.fotoUrl, 'cover') : {}),
            border: `3px solid ${primario}66`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 23,
            fontWeight: 900,
            color: primario,
          }}
        >
          {!datos.fotoUrl && iniciales(datos.nombre)}
        </div>

        <p style={{ margin: '8px 0 0', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: tenue }}>Participante</p>
        <p style={{ margin: '2px 0 0', fontSize: 21, fontWeight: 900, lineHeight: '23px', maxHeight: 46, overflow: 'hidden', color: texto, maxWidth: '100%', wordBreak: 'break-word' }}>
          {datos.nombre || 'Asistente'}
        </p>
        {datos.identificacion && (
          <p style={{ margin: '7px 0 0', padding: '5px 16px', borderRadius: 999, background: primario, color: '#ffffff', fontSize: 10, fontWeight: 800, letterSpacing: '0.15em' }}>
            {datos.identificacion}
          </p>
        )}
        <Campos campos={datos.campos} texto={texto} tenue={tenue} />
      </Ajustado>

      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {datos.evento.fechaInicial && (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px 8px',
              borderRadius: 12,
              background: '#ffffff',
              border: `1px solid ${primario}40`,
              color: '#18181b',
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <Calendar size={15} color={primario} style={{ flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span>{fechaCorta(datos.evento.fechaInicial)}</span>
              {datos.evento.hora && <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }}>{datos.evento.hora}</span>}
            </span>
          </div>
        )}
        <Qr url={datos.urlVerificacion} lado={78} primario={primario} relleno={4} />
      </div>

      <div style={{ width: '100%', height: 1, margin: '8px 0 5px', background: `${primario}33` }} />
      <p style={{ margin: 0, fontSize: 8.5, lineHeight: '11px', color: tenue }}>{mensaje}</p>
    </div>
  </>
);

interface Props {
  datos: EscarapelaDatos;
  /** Versión reducida para la pantalla de registro exitoso */
  compacta?: boolean;
  /** Sin sombra ni esquinas redondeadas: así se exporta a PDF o PNG */
  plana?: boolean;
}

/** Tarjeta de la escarapela: la usan la página del QR, el registro exitoso, el editor de diseño y la exportación. */
export const EscarapelaCard: React.FC<Props> = ({ datos, compacta = false, plana = false }) => {
  const ancho = compacta ? 250 : ANCHO_ESCARAPELA;
  const escala = ancho / ANCHO_ESCARAPELA;
  const texto = datos.colorTexto || '#18181b';
  const partes: Partes = {
    datos,
    primario: datos.color,
    texto,
    tenue: `${texto}99`,
    mensaje: datos.mensaje || MENSAJE_ESCARAPELA,
    fecha: fechaLarga(datos.evento.fechaInicial),
  };

  return (
    <div
      className={plana ? '' : 'mx-auto rounded-3xl shadow-2xl overflow-hidden border border-neutral-200'}
      style={{ width: ancho, height: ALTO_ESCARAPELA * escala, boxSizing: 'content-box' }}
    >
      <div
        style={{
          position: 'relative',
          width: ANCHO_ESCARAPELA,
          height: ALTO_ESCARAPELA,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          background: datos.colorFondo || '#ffffff',
          color: texto,
          transform: escala === 1 ? undefined : `scale(${escala})`,
          transformOrigin: 'top left',
        }}
      >
        {datos.fondoImagen && <div style={{ position: 'absolute', inset: 0, ...imagen(datos.fondoImagen, 'cover') }} />}
        {datos.plantilla === 'moderna' ? <Moderna {...partes} /> : <Clasica {...partes} />}
      </div>
    </div>
  );
};
