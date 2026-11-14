// Test kancaları (Faz 9 tasarımı §5.4; K-07). YALNIZ test kipinde (js/core/testmode.js: ?test=1 VE yerel köken) js/main.js'ten
// if (TEST) arkasındaki dinamik import() ile yüklenir. Dışarıya yalnız install ve işaret dizgesi MARK verilir; oyun kodu bu modülü
// statik içe aktarmaz ve window.DK'yi okumaz (tests/node/test_kipi.mjs denetler). Üretim yapıtlarında bu dosya saplanır (Y4, Y6).
import * as shop from '../economy/shop.js';
import * as items from '../economy/items.js';
import * as treasure from '../treasure/treasure.js';
import * as props from '../world/props.js';
import * as ports from '../world/ports.js';
import * as menu from '../ui/menu.js';
import * as panels from '../ui/panels.js';
import * as seagear from '../wildlife/seagear.js';
import * as shipModel from '../ship/shipModel.js';
import * as nearfade from '../core/nearfade.js';
import * as worldData from '../world/worldData.js';
import * as quests from '../game/quests.js';
import * as assets from '../core/assets.js';
import * as audio from '../core/audio.js';

export const MARK = 'dk-test-kancalari-v1';

// DK.mod kayıt defteri (§4.4): senaryolardaki import('./js/<ad>.js') yerine DK.mod('<ad>'). Modüller statik içe aktarıldığı için
// modüler sürümde import() ile aynı modül örneği (aynı ad alanı nesnesi) döner; tek HTML'de de pakete girerler. Hepsi oyunun
// kendi içe aktarma grafında zaten var (bu dosya yeni bir modül değerlendirmesi başlatmaz).
const MODULLER = Object.freeze({
  'economy/shop': shop, 'economy/items': items, 'treasure/treasure': treasure, 'world/props': props, 'world/ports': ports,
  'ui/menu': menu, 'ui/panels': panels, 'wildlife/seagear': seagear, 'ship/shipModel': shipModel, 'core/nearfade': nearfade,
  'world/worldData': worldData, 'game/quests': quests, 'core/assets': assets, 'core/audio': audio,
});

// api: main.js'in verdiği nesne — v0.4'teki window.DK'nin 49 alanı (aynı sıra) + audio
export function install(api) {
  const { post, engine, game, hud, net, input } = api;
  // 1. Bugünkü 49 alan birebir + audio
  window.DK = { ...api };
  // 2. Yardımcılar: v0.4 (44d548c) main.js:136-152 gövdeleri AYNEN. Faz 3 DK.sim'i değiştirecekse burayı değiştirir.
  // Test: yalnız 3B tuvali yakala (HUD hariç) — yazılımsal GPU'da sayfa ekran görüntüsünden daha kararlı
  window.DK.snap = (q = 0.85) => { post.render(); return engine.renderer.domElement.toDataURL('image/jpeg', q); };
  // belirli bir bakış açısından yakala (test): from/to = [x,y,z]
  window.DK.snapFrom = (from, to, q = 0.85) => {
    const cam = engine.camera;
    cam.position.set(...from); cam.lookAt(...to); cam.updateMatrixWorld(true);
    post.render();
    return engine.renderer.domElement.toDataURL('image/jpeg', q);
  };
  // Test/hata ayıklama yardımcıları: oyunu render etmeden ileri sar
  window.DK.sim = (seconds, dt = 1 / 30) => {
    const n = Math.round(seconds / dt);
    for (let i = 0; i < n; i++) { game.update(dt); hud.update(dt); net.update(dt); input.endFrame(); }
    return n;
  };
  window.DK.tap = (code) => { input.pressedSet.add(code); input.down.add(code); setTimeout(() => input.down.delete(code), 150); };
  // eşzamanlı tuş basışı (test): basılı tut, simüle et, bırak
  window.DK.press = (code, dur = 0.1) => { input.pressedSet.add(code); input.down.add(code); window.DK.sim(dur); input.down.delete(code); window.DK.sim(1 / 30); };
  // 3. Çağrı sayacı (§6.1 tür alanı): yukarıdaki gövdeler değiştirilmeden sarılır; sarmalayıcı yalnız sayar, dönüş değeri ve
  //    davranış aynıdır. press içindeki window.DK.sim çağrıları da sayılır (koşucunun v0.4'te kurduğu sayaçla aynı kural).
  //    'update' anahtarı yoktur: DK.game.update'in döngü dışı çağrılarını koşucu kendisi sayar.
  const sayac = { sim: 0, adim: 0, press: 0, tap: 0 };
  window.DK.__sayac = sayac;
  sayacla('sim', (n) => { sayac.sim++; if (typeof n === 'number' && Number.isFinite(n)) sayac.adim += n; });
  sayacla('press', () => { sayac.press++; });
  sayacla('tap', () => { sayac.tap++; });
  // 4. Modül kayıt defteri: bilinmeyen adda açık hata
  window.DK.mod = (ad) => {
    if (typeof ad !== 'string' || !Object.prototype.hasOwnProperty.call(MODULLER, ad)) {
      throw new Error(`DK.mod: bilinmeyen modül '${ad}' (kayıtlı: ${Object.keys(MODULLER).join(', ')})`);
    }
    return MODULLER[ad];
  };
  // 5. İşaret (koşucu ve üretim yapıtı taraması için)
  window.__DK_TEST_KIPI = MARK;
}

function sayacla(ad, say) {
  const asil = window.DK[ad];
  window.DK[ad] = function () { const r = asil.apply(this, arguments); say(r); return r; };
}
