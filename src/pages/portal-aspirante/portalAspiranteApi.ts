import axios from 'axios';

export interface IniciarPagoPortalResponse {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  integritySignature: string;
  redirectUrl: string;
  companyName: string;
  habilitarPSE: boolean;
  habilitarTarjetas: boolean;
}

export type MetodoPagoPortal = 'PSE' | 'CARD';

export async function iniciarPagoPortalAspirante(
  token: string,
  metodo: MetodoPagoPortal
): Promise<IniciarPagoPortalResponse> {
  const res = await axios.post<IniciarPagoPortalResponse>(
    `portal-aspirante/${token}/iniciar-pago`,
    { metodo }
  );
  return res.data;
}
