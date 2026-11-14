// Sürüm ve derleme damgası (Faz 9 tasarımı Y3, K9-4; window.__dkDurum bunları okur).
// Damga index.html'deki <meta name="dk-build" content="…"> etiketinden okunur. Etiket Y5'te eklenir; tek HTML ve _site
// derlemeleri onu commit kimliğiyle değiştirir (Y4, Y6). Etiket yoksa ya da boşsa 'gelistirme' döner.
export const SURUM = '0.5.0';
export function derleme() {
  try {
    const m = document.querySelector('meta[name="dk-build"]');
    const v = m ? String(m.getAttribute('content') || '').trim() : '';
    return v || 'gelistirme';
  } catch (e) { return 'gelistirme'; }
}
