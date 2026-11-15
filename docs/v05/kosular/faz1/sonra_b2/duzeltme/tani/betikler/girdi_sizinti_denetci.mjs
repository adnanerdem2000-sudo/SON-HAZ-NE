// B2 denetim (Node): örtü/perde süresince kare çalışmazsa (tani T20: örtü içinde 0 updater tiki) kilitliyken basılan tuş,
// kilit kalkınca ilk karede input.pressed() ile "yeni basılmış" görünür mü? Gerçek js/core/input.js modülü ve onun keydown
// işleyicisi kullanılır; tarayıcı nesneleri en küçük taklitle verilir. Kullanım: node girdi_sizinti.mjs <ağaç>
const kok = process.argv[2] || '/home/user/SON-HAZ-NE-b2';
const L = {};
const ekle = (on) => (t, f) => { (L[on + t] = L[on + t] || []).push(f); };
globalThis.window = { addEventListener: ekle('w:') };
globalThis.document = { addEventListener: ekle('d:'), pointerLockElement: null, hasFocus: () => true };
try { Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [] }, configurable: true }); } catch (e) { /* yok */ }
const { input } = await import('file://' + kok + '/js/core/input.js');
const canvas = { addEventListener: ekle('c:') };
input.init(canvas);
const tus = (code) => { for (const f of L['w:keydown']) f({ code, target: null, preventDefault() {}, ctrlKey: false }); for (const f of L['w:keyup']) f({ code }); };
const sonuc = {};
// A) örtü varken (kare yok): yolculuk kilidi → Tab ve E basılır → kilit kalkar → ilk kare
input.block('yolculuk');
tus('Tab'); tus('KeyE'); tus('Space');
sonuc.kilitliyken = { envanter: input.pressed('envanter'), etkilesim: input.pressed('etkilesim'), zipla: input.pressed('zipla') };
input.unblock('yolculuk'); // main.js finally: varışta, örtü kapandığı anda (aynı görevde), sonraki kareden ÖNCE
sonuc.kilitKalkincaIlkKare = { envanter: input.pressed('envanter'), etkilesim: input.pressed('etkilesim'), zipla: input.pressed('zipla') };
input.endFrame();
// B) karşılaştırma: kilit sürerken en az bir kare çalışsaydı (örtüsüz) endFrame basışları silerdi
input.block('yolculuk'); tus('Tab'); input.endFrame(); input.unblock('yolculuk');
sonuc.karsilastirma_kareCalissaydi = { envanter: input.pressed('envanter') };
console.log(JSON.stringify(sonuc));
const sizinti = sonuc.kilitKalkincaIlkKare.envanter && sonuc.kilitKalkincaIlkKare.etkilesim && sonuc.kilitKalkincaIlkKare.zipla;
console.log(sizinti ? 'SIZINTI VAR: kilitliyken basılan tuşlar kilit kalkınca ilk karede pressed() = true' : 'sızıntı yok');
