/**
 * Convierte el texto de inputs de texto y textareas a MAYÚSCULAS (valor enviado + lo que se ve).
 * Usa el setter nativo del valor + evento `input` para que funcione con inputs controlados de React.
 *
 * Excluye: password, email, url, number, fechas, etc.
 * Para desactivar en un campo o contenedor: `data-no-uppercase` en el elemento o un ancestro.
 */

function shouldSkipInput(el: HTMLInputElement): boolean {
  const t = (el.type || 'text').toLowerCase();
  const skip = new Set([
    'password',
    'email',
    'url',
    'tel',
    'number',
    'range',
    'date',
    'datetime-local',
    'month',
    'week',
    'time',
    'color',
    'file',
    'hidden',
    'checkbox',
    'radio',
    'submit',
    'button',
    'image',
    'reset'
  ]);
  if (skip.has(t)) return true;
  return t !== 'text' && t !== 'search';
}

function applyUppercase(el: HTMLInputElement | HTMLTextAreaElement): void {
  const upper = el.value.toLocaleUpperCase('es');
  if (el.value === upper) return;

  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  const start = el.selectionStart;
  const end = el.selectionEnd;

  if (desc?.set) {
    desc.set.call(el, upper);
  } else {
    el.value = upper;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));

  if (start !== null && end !== null && typeof el.setSelectionRange === 'function') {
    try {
      el.setSelectionRange(start, end);
    } catch {
      /* ignore */
    }
  }
}

function onInputCapture(ev: Event): void {
  const target = ev.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
    return;
  }
  const el = target;
  if (el.readOnly || el.disabled) return;
  if (el.closest('[data-no-uppercase]')) return;
  if (el.closest('[data-preserve-case]')) return;

  if (el instanceof HTMLInputElement && shouldSkipInput(el)) {
    return;
  }

  applyUppercase(el);
}

/**
 * Registra el listener en fase de captura sobre `document` (o el nodo raíz indicado).
 * Devuelve función para desinstalar (útil en useEffect de React).
 */
export function installGlobalFormUppercase(root: Document | HTMLElement = document): () => void {
  root.addEventListener('input', onInputCapture, true);
  return () => root.removeEventListener('input', onInputCapture, true);
}
