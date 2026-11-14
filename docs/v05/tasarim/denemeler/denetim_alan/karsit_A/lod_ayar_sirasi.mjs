// Karşıt denetim (A): açılış sırası main.js:97 settings.apply() → main.js:106 buildWorld → game.js:45 terrain.init(quality)
// Görüş mesafesi / kalite ölçeğinin terrain.lodScale'e etkisi. Salt-okur: modüller içe aktarılır, motor nesnesi bellekte taklit edilir.
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.document = globalThis.document || { documentElement: { style: { setProperty() {} } }, body: { classList: { toggle() {} } } };
const { settings } = await import(ROOT + '/js/core/settings.js');
const { engine } = await import(ROOT + '/js/core/engine.js');
const { post } = await import(ROOT + '/js/core/post.js');
const { audio } = await import(ROOT + '/js/core/audio.js');
const { terrain } = await import(ROOT + '/js/world/terrain.js');
console.warn = () => {};
engine.renderer = { shadowMap: {} }; engine.setRenderScale = () => {}; engine.scene = { traverse() {} }; engine.camera = { updateProjectionMatrix() {} };
post.setQuality = () => {}; audio.applyVolumes = () => {};
const out = {};
// kullanıcı: kalite 'low', görüş mesafesi %30 kaydetmiş
settings.v = { ...settings.v, quality: 'low', viewDistance: 0.3 };
settings.apply();                                   // main.js:97 (terrain.init'ten önce)
out.applySonrasi_initOncesi = { baseLod: terrain.baseLod, lodScale: terrain.lodScale };
terrain.init(new THREE.Scene(), settings.v.quality); // game.js:45
out.acilisSonrasi = { lodScale: terrain.lodScale, beklenen: +(0.7 * (0.7 + 0.3 * 0.3)).toFixed(3), hiresYaricapM: Math.round(380 * terrain.lodScale) };
// oyun içinde herhangi bir ayar değişince (settingsPanel.js:12 commit → apply)
settings.v.viewDistance = 1; settings.apply();
out.ayarDegisinceVd1 = { lodScale: terrain.lodScale, beklenen_low: 0.7, hiresYaricapM: Math.round(380 * terrain.lodScale) };
console.log(JSON.stringify(out, null, 1));
process.exit(0);
