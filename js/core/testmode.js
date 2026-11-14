// Test kipi (Faz 9 tasarımı §5.1, K9-3; K-07, K-08): YALNIZ ?test=1 VE yerel köken (localhost, 127.0.0.1, [::1], file:).
// Üretim yapıtlarında (Pages _site ve üretim tek HTML) bu dosya saplamayla değişir: TEST=false, testParam()=null.
// Bu modül hiçbir şey içe aktarmaz (tests/node/test_kipi.mjs onu node:vm ile, location taklidiyle yükleyip doğruluk tablosunu sınar).
const YEREL = new Set(['localhost', '127.0.0.1', '[::1]']);
function tespit() {
  try {
    if (new URLSearchParams(location.search).get('test') !== '1') return false;
    return location.protocol === 'file:' || YEREL.has(location.hostname);
  } catch (e) { return false; }
}
export const TEST = tespit();
// Test URL parametreleri (?peerhost, ?terrain, ?turn…, ?dongu): test kipi kapalıyken her zaman null
export function testParam(ad) {
  if (!TEST) return null;
  try { return new URLSearchParams(location.search).get(ad); } catch (e) { return null; }
}
