// B2-D2 (Node, birim): gerçek js/core/input.js modülü ve onun pencere/tuval dinleyicileriyle oyun girdisi kilidinin anlamı.
// Kullanım: node girdi_kilit_birim.mjs <ağaç>. Tarayıcı nesneleri en küçük taklitle verilir (denetçinin girdi_sizinti.mjs'i gibi).
const kok = process.argv[2] || '/home/user/SON-HAZ-NE-b2';
const L = {};
const ekle = (on) => (t, f) => { (L[on + t] = L[on + t] || []).push(f); };
globalThis.window = { addEventListener: ekle('w:') };
globalThis.document = { addEventListener: ekle('d:'), pointerLockElement: null, hasFocus: () => true };
try { Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [] }, configurable: true }); } catch (e) { /* yok */ }
const { input } = await import('file://' + kok + '/js/core/input.js');
const canvas = { addEventListener: ekle('c:') };
input.init(canvas);
const bas = (code) => { for (const f of L['w:keydown']) f({ code, target: null, preventDefault() {}, ctrlKey: false }); };
const birak = (code) => { for (const f of L['w:keyup']) f({ code }); };
const tus = (code) => { bas(code); birak(code); };
const fare = (dx, dy) => { input.pointerLocked = true; for (const f of L['w:mousemove']) f({ movementX: dx, movementY: dy }); };
const sonuc = []; let gecen = 0;
const kontrol = (ad, ok, deger) => { sonuc.push({ ad, ok: !!ok, deger }); if (ok) gecen++; console.log((ok ? 'GECTI ' : 'KALDI ') + ad + ' → ' + JSON.stringify(deger)); };
// G01: kilitliyken basılan tuşlar kilitliyken okunmaz, kilit kalkınca (kare çalışmadan) ilk okumada da "yeni basılmış" sayılmaz
input.block('yolculuk'); tus('Tab'); tus('KeyE'); tus('Space'); fare(30, -20);
const kilitli = { envanter: input.pressed('envanter'), etkilesim: input.pressed('etkilesim'), zipla: input.pressed('zipla'), bakis: input.lookDelta() };
input.unblock('yolculuk');
const ilkKare = { envanter: input.pressed('envanter'), etkilesim: input.pressed('etkilesim'), zipla: input.pressed('zipla'), mouseDX: input.mouseDX, mouseDY: input.mouseDY };
kontrol('G01 kilitliyken basılan Tab/E/Boşluk ve fare hareketi kilit kalkınca ilk karede işlenmez', !kilitli.envanter && !kilitli.etkilesim && !kilitli.zipla && kilitli.bakis.dx === 0 && !ilkKare.envanter && !ilkKare.etkilesim && !ilkKare.zipla && ilkKare.mouseDX === 0 && ilkKare.mouseDY === 0, { kilitli, ilkKare });
input.endFrame();
// G02: Esc (duraklat) kilitliyken de okunur ve kilit kalkışında silinmez
input.block('yolculuk'); tus('Escape');
const escKilitli = input.pressed('duraklat'); input.unblock('yolculuk');
kontrol('G02 Esc kilitliyken okunur, kilit kalkışında korunur', escKilitli && input.pressed('duraklat'), { escKilitli, sonra: input.pressed('duraklat') });
input.endFrame();
// G03: iç içe kilit: biri kalkınca öbürü sürüyor; kenar durumu yalnız SON kilit kalkınca temizlenir, kilit sürerken girdi kapalı
input.block('yolculuk'); input.block('uyanis'); tus('Tab'); input.unblock('yolculuk');
const icIce = { kilitli: input.isBlocked(), envanter: input.pressed('envanter') }; input.unblock('uyanis');
kontrol('G03 iç içe kilitte biri kalkınca girdi hâlâ kilitli; son kilit kalkınca kilitliyken basılan Tab işlenmez', icIce.kilitli && !icIce.envanter && !input.isBlocked() && !input.pressed('envanter'), { icIce, sonra: input.pressed('envanter') });
input.endFrame();
// G04: basılı tutulan tuş (down) kilit kalkınca basılı kalır (yürüme sürer), ama "yeni basılmış" sayılmaz
input.block('yolculuk'); bas('KeyW'); input.unblock('yolculuk');
const w = { isDown: input.isDown('ileri'), pressed: input.pressed('ileri'), eksen: input.moveAxis() };
kontrol('G04 kilit sırasında basılıp tutulan W kilit kalkınca basılı (hareket ekseni 1), yeni basış değil', w.isDown && !w.pressed && w.eksen.y === 1, w);
birak('KeyW'); input.endFrame();
// G05: kilit yokken normal girdi (gerileme koruması): Tab basışı okunur, kare sonunda silinir
tus('Tab'); const normal = input.pressed('envanter'); input.endFrame();
kontrol('G05 kilit yokken Tab okunur, kare sonunda silinir', normal && !input.pressed('envanter'), { normal, kareSonu: input.pressed('envanter') });
// G06: clearBlocks (game.stop) de kenar durumunu temizler; kilit yokken clearBlocks kilitsiz basışlara dokunmaz
input.block('uyanis'); tus('KeyM'); input.clearBlocks();
const stopSonra = { kilit: input.isBlocked(), harita: input.pressed('harita') };
tus('KeyM'); input.clearBlocks(); const kilitsiz = input.pressed('harita'); input.endFrame();
kontrol('G06 clearBlocks kilitliyken basılanı siler; kilit yokken çağrılırsa yeni basışa dokunmaz', !stopSonra.kilit && !stopSonra.harita && kilitsiz, { stopSonra, kilitsiz });
// G07: olmayan bir nedeni kaldırmak (unblock) kilit yokken kenar durumunu silmez
tus('KeyJ'); input.unblock('yok'); const defter = input.pressed('defter'); input.endFrame();
kontrol('G07 kilit yokken unblock(\'yok\') yeni basışı silmez', defter, { defter });
console.log(JSON.stringify({ gecen, toplam: sonuc.length }));
process.exitCode = gecen === sonuc.length ? 0 : 1;
