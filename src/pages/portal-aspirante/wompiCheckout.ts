import type { IniciarPagoPortalResponse } from './portalAspiranteApi';

const WOMPI_WIDGET_SCRIPT = 'https://checkout.wompi.co/widget.js';

export interface WompiCustomerData {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
}

declare global {
  interface Window {
    WidgetCheckout?: new (config: Record<string, unknown>) => {
      open: (callback?: (result: { transaction: Record<string, unknown> }) => void) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function cargarScriptWompi(): Promise<void> {
  if (window.WidgetCheckout) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WOMPI_WIDGET_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el checkout de Wompi.')));
      return;
    }

    const script = document.createElement('script');
    script.src = WOMPI_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el checkout de Wompi.'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function abrirCheckoutWompi(
  checkout: IniciarPagoPortalResponse,
  customerData?: WompiCustomerData
): Promise<void> {
  await cargarScriptWompi();

  if (!window.WidgetCheckout) {
    throw new Error('El widget de Wompi no está disponible.');
  }

  const widget = new window.WidgetCheckout({
    currency: checkout.currency,
    amountInCents: checkout.amountInCents,
    reference: checkout.reference,
    publicKey: checkout.publicKey,
    signature: { integrity: checkout.integritySignature },
    redirectUrl: checkout.redirectUrl,
    ...(customerData && (customerData.email || customerData.fullName || customerData.phoneNumber)
      ? {
          customerData: {
            ...(customerData.email ? { email: customerData.email } : {}),
            ...(customerData.fullName ? { fullName: customerData.fullName } : {}),
            ...(customerData.phoneNumber ? { phoneNumber: customerData.phoneNumber } : {})
          }
        }
      : {})
  });

  widget.open();
}
