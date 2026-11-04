import { QRCodeCanvas } from 'qrcode.react';

interface Hermano {
  id: number;
  nombre: string;
  celularContacto: string;
  edad: number;
  nombreContactoF: string;
  celularContactoF: string;
  pago: number;
  saldo: number;
  formaPago: string;
  email: string;
  celularEmergencia: string;
  parentesco: string;
  observacion: string;
  qr_token: string | null;
}

interface QRCardProps {
  hermano: Hermano;
  captureRef: React.RefObject<HTMLDivElement>;
}

const API_URL = window.location.origin;

export const QRCard: React.FC<QRCardProps> = ({ hermano, captureRef }) => {
  const qrValue = hermano.qr_token ? `${API_URL}/invitado/${hermano.qr_token}` : ``;

  return (
    <div
      ref={captureRef}
      style={{
        background: '#fff',
        padding: '28px 24px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        width: '280px',
        fontFamily: 'sans-serif',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)'
      }}
    >
      <div style={{ fontSize: '17px', fontWeight: 700, color: '#111827', textAlign: 'center' }}>
        {hermano.nombre}
      </div>
      <QRCodeCanvas value={qrValue} size={190} level="H" />
      <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
        {hermano.email && <div>{hermano.email}</div>}
        {hermano.celularContacto && <div>{hermano.celularContacto}</div>}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: '#9ca3af',
          textAlign: 'center',
          borderTop: '1px solid #f3f4f6',
          paddingTop: '10px',
          width: '100%'
        }}
      >
        Escanea para verificar asistencia
      </div>
    </div>
  );
};
