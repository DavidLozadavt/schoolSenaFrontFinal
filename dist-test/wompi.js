// src/pages/portal-aspirante/wompiCheckout.ts
var WOMPI_WEB_CHECKOUT_URL = "https://checkout.wompi.co/p/";
function soloDigitos(valor) {
  if (!valor) return void 0;
  const limpio = valor.replace(/\D/g, "");
  return limpio || void 0;
}
function agregarCampo(form, name, value) {
  if (!value) return;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}
function abrirCheckoutWompi(checkout, customerData) {
  if (!checkout.publicKey?.startsWith("pub_")) {
    throw new Error("La llave p\xFAblica de Wompi no es v\xE1lida.");
  }
  if (!checkout.reference || !checkout.integritySignature) {
    throw new Error("Faltan datos para iniciar el pago (referencia o firma).");
  }
  if (!checkout.amountInCents || checkout.amountInCents < 1) {
    throw new Error("El monto a pagar no es v\xE1lido.");
  }
  const form = document.createElement("form");
  form.method = "GET";
  form.action = WOMPI_WEB_CHECKOUT_URL;
  form.style.display = "none";
  agregarCampo(form, "public-key", checkout.publicKey);
  agregarCampo(form, "currency", checkout.currency || "COP");
  agregarCampo(form, "amount-in-cents", String(checkout.amountInCents));
  agregarCampo(form, "reference", checkout.reference);
  agregarCampo(form, "signature:integrity", checkout.integritySignature);
  agregarCampo(form, "redirect-url", checkout.redirectUrl);
  if (customerData) {
    agregarCampo(form, "customer-data:email", customerData.email?.trim());
    agregarCampo(form, "customer-data:full-name", customerData.fullName?.trim());
    agregarCampo(form, "customer-data:phone-number", soloDigitos(customerData.phoneNumber));
    agregarCampo(form, "customer-data:legal-id", soloDigitos(customerData.legalId));
    agregarCampo(form, "customer-data:legal-id-type", customerData.legalIdType?.trim());
  }
  document.body.appendChild(form);
  form.submit();
}
export {
  abrirCheckoutWompi
};
