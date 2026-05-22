import { KeenIcon } from '@/components';
import html2canvas from 'html2canvas';
import { Modal } from './Modal';
import { QRCard } from './QRCard';

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

interface ModalQRProps {
  open: boolean;
  onClose: () => void;
  hermano: Hermano | null;
  captureRef: React.RefObject<HTMLDivElement>;
  notif: (msg: string, tipo?: 'ok' | 'err') => void;
}

export const ModalQR: React.FC<ModalQRProps> = ({
  open,
  onClose,
  hermano,
  captureRef,
  notif
}) => {
  if (!hermano) return null;

  const imprimirQr = async () => {
    try {
      if (!captureRef.current) throw new Error('Ref vacío');
      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const w = window.open('', '_blank');
      if (!w) return;

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>Imprimir QR</title>
          <style>
            html,body{height:100%;margin:0;background:#ffffff;-webkit-print-color-adjust:exact}
            .wrap{display:flex;align-items:center;justify-content:center;height:100%;padding:20mm}
            .card{background:#ffffff;padding:0;border-radius:8px;box-shadow:none;display:flex;align-items:center;justify-content:center}
            img{width:280px;height:auto;display:block}
            @media print{
              @page{margin:6mm}
              body{background:#ffffff}
              .wrap{padding:0}
              img{width:100%;max-width:280px}
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <img id="qrimg" src="${dataUrl}" alt="QR" />
            </div>
          </div>
          <script>
            (function(){
              const img = document.getElementById('qrimg');
              function doPrint(){
                setTimeout(function(){
                  try { window.focus(); window.print(); }
                  catch(e){ console.error(e); }
                }, 200);
              }
              if (img.complete) doPrint();
              else { img.onload = doPrint; img.onerror = doPrint; }
            })();
          </script>
        </body>
        </html>
      `;

      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (err) {
      notif('Error al preparar impresión', 'err');
      console.error(err);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Código QR del invitado"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={imprimirQr}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            <KeenIcon icon="printer" className="text-base" />
            Imprimir
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 py-2">
        {hermano.qr_token ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Este invitado ya tiene token QR. Puedes guardar la imagen del QR actual o imprimirla.
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
            Este invitado no tiene token QR. El QR se generará con su ID. Para crear un token
            permanente, usa <strong>"Generar QRs sin token"</strong>.
          </p>
        )}

        <div className="p-3 rounded-2xl bg-white shadow-lg">
          <QRCard hermano={hermano} captureRef={captureRef} />
        </div>

        <p className="text-xs text-gray-400 text-center max-w-xs">
          Haz clic en <strong>Guardar QR</strong> para capturar la imagen y subirla al servidor.
        </p>
      </div>
    </Modal>
  );
};
