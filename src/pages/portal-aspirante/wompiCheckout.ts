import type { IniciarPagoPortalResponse } from './portalAspiranteApi';

const WOMPI_WEB_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

export interface WompiCustomerData {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  legalId?: string;
  legalIdType?: string;
}

function soloDigitos(valor?: string): string | undefined {
  if (!valor) return undefined;
  const limpio = valor.replace(/\D/g, '');
  return limpio || undefined;
}

function esUrlLocal(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return false;
  }
}

function agregarParametro(params: URLSearchParams, name: string, value: string | undefined): void {
  if (!value) return;
  params.set(name, value);
}

/**
 * Redirige al Web Checkout de Wompi.
 * Wompi solo lee parámetros vía GET (query string); POST no funciona en /p/.
 * En local omitimos redirect-url porque CloudFront bloquea GET con localhost (403).
 */
export function abrirCheckoutWompi(
  checkout: IniciarPagoPortalResponse,
  customerData?: WompiCustomerData
): { omitioRedirectLocal: boolean } {
  if (!checkout.publicKey?.startsWith('pub_')) {
    throw new Error('La llave pública de Wompi no es válida.');
  }
  if (!checkout.reference || !checkout.integritySignature) {
    throw new Error('Faltan datos para iniciar el pago (referencia o firma).');
  }
  if (!checkout.amountInCents || checkout.amountInCents < 1) {
    throw new Error('El monto a pagar no es válido.');
  }

  const params = new URLSearchParams();
  agregarParametro(params, 'public-key', checkout.publicKey.trim());
  agregarParametro(params, 'currency', (checkout.currency || 'COP').trim());
  agregarParametro(params, 'amount-in-cents', String(checkout.amountInCents));
  agregarParametro(params, 'reference', checkout.reference.trim());
  agregarParametro(params, 'signature:integrity', checkout.integritySignature.trim());

  let omitioRedirectLocal = false;
  const redirect = checkout.redirectUrl?.trim();
  if (redirect) {
    if (esUrlLocal(redirect)) {
      omitioRedirectLocal = true;
    } else {
      agregarParametro(params, 'redirect-url', redirect);
    }
  }

  if (customerData) {
    agregarParametro(params, 'customer-data:email', customerData.email?.trim());
    agregarParametro(params, 'customer-data:full-name', customerData.fullName?.trim());
    agregarParametro(params, 'customer-data:phone-number', soloDigitos(customerData.phoneNumber));
    agregarParametro(params, 'customer-data:legal-id', soloDigitos(customerData.legalId));
    agregarParametro(params, 'customer-data:legal-id-type', customerData.legalIdType?.trim());
  }

  const url = `${WOMPI_WEB_CHECKOUT_URL}?${params.toString()}`;
  window.location.assign(url);

  return { omitioRedirectLocal };
}
