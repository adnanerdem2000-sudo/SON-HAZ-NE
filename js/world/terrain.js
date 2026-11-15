import * as THREE from 'three';
import { WORLD_SIZE, SEA_FLOOR } from './worldData.js';
import { computeHeight, islandAt as geoIslandAt, biomeAt as geoBiomeAt, rectMayHaveLand, colorSRGB, distToCavePath as geoCave } from './geo.js';
import { generate } from './terrainGen.js';
import { TEST, testParam } from '../core/testmode.js';

// Bölgesel (akışlı) arazi: dünya 160 m'lik karolara bölünür; kameraya uzaklığa göre ayrıntı düzeyi (LOD)
// seçilir ve karo geometrileri arka planda Web Worker'larda üretilir. Yakın karoların 2 m çözünürlüklü
// yükseklik ızgarası fizik/yerleşim sorguları için önbellek olarak kullanılır; diğer yerlerde analitik
// yükseklik fonksiyonu (geo.js) aynı sonucu verir.
//
// Dayanıklılık: işçi başlatılamazsa, yüklenemezse, çökerse ya da yanıt vermezse işler kaybolmaz; aynı
// üretim kodu (terrainGen.js) ana iş parçacığında kareler arasına dilimlenerek çalışır. Hiçbir istek
// sonsuza kadar beklemez: iş başına zaman aşımı, sınırlı yeniden deneme, açık hata ile sonlanma.

export const TILE = 160;
const HALF = WORLD_SIZE / 2;
const NT = WORLD_SIZE / TILE;
const HI_SEG = 80; // 2 m
const LODS = [
  { d: 380, seg: HI_SEG },
  { d: 950, seg: 32 },
  { d: 1750, seg: 16 },
  { d: 2700, seg: 8 },
];
const DEEP_VIEW = 300; // derin deniz karoları yalnızca yakında (su altı görüşü)
const DEEP_DROP = DEEP_VIEW + 200; // A-07: istenmeyen derin deniz karosu bu uzaklıkta (karo kenarına) düşer
const LOD_HIST = 0.12; // A-07: LOD histerezis bandı: kabalaşma eşiğin %12 ötesinde (incelme eşikte hemen)
const tkey = (i, j) => i * 1024 + j;
const JOB_TIMEOUT = { tile: 20000, depth: 45000, grid: 60000 }; // ms; işçi bu sürede yanıt vermezse sağlıksız sayılır
const READY_TIMEOUT = 8000;  // hazır sinyali bu sürede gelmezse işçi devre dışı kalır
const HAZIR_UYARI = 2500;    // hazır sinyali bu sürede gelmediyse teşhis kaydı (işçi beklenmeye devam eder; A-11)
const ILK_IS_SURESI = 3000;  // A-11 kısa gözetim: hazır işçinin ilk işine bu sürede yanıt gelmezse işçi devre dışı kalır
const YENIDEN_BASLAT = [2000, 8000]; // A-15: çöken işçinin yuvası en çok iki kez, bu gecikmelerle yeniden kurulur
const GECIKME_ESIK = 1000;   // yükleme metni: işçi bu süreden uzun hazır değilse ya da ilk işine yanıt vermiyorsa neden yazılır
const HATA_SINIRI = 50;      // A-05: failures en çok bu kadar kayıt tutar
const MAX_TRIES = 3;
// İşçide çalışan bir iş iptal edilince (A-08) işçinin sonucu beklenmez: söz, işçinin yanıtı bu süre içinde gelirse o anda, yoksa
// bu süre sonunda sonuçsuz (null) çözülür ve işçi yuvası o zaman boşalır (yolda olan bir yanıt yuvayı işçinin gerçek bitişiyle
// boşaltsın; iptal eden taraf ise en çok bu kadar bekler, işçinin sonucunu değil).
const IPTAL_BEKLEME = 5;
const LOCAL_BUDGET_MS = 10; // ana iş parçacığı yedeğinde dilim başına üretim süresi (yükleme ekranında artırılır)
// 0 gecikmeli makro görev: setTimeout(0) iç içe çağrılarda ≥4 ms'ye kırpılır; MessageChannel kırpılmaz
const _mc = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
const _mcQueue = [];
if (_mc) _mc.port1.onmessage = () => { const f = _mcQueue.shift(); if (f) f(); };
const schedule = (fn) => { if (_mc) { _mcQueue.push(fn); _mc.port2.postMessage(0); } else setTimeout(fn, 0); };

export function distToCavePath(x, z) { return geoCave(x, z); }

// A-17 badurl test kipi: işçi adresi gerçekten bozuk bir işçiye çevrilir. http/file adresinde var olmayan dosya (404); data: ve
// blob: adreslerinde ayrıştırılamayan betik (yükleme hatası olayı). v0.4 data: adresine '#missing' parçası ekliyordu; parça
// içeriği değiştirmediği için işçi tek dosyada yine çalışıyordu (KI-165).
const BOZUK_ISCI = '/* test kipi: badurl */ %%% bozuk işçi betiği';
function bozukIsciAdresi(u) {
  if (/^data:/i.test(u)) return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(BOZUK_ISCI);
  if (/^blob:/i.test(u)) {
    try { return URL.createObjectURL(new Blob([BOZUK_ISCI], { type: 'text/javascript' })); }
    catch (e) { return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(BOZUK_ISCI); }
  }
  return u.replace(/terrainWorker\.js(?=$|[?#])/, 'terrainWorker.missing.js');
}
const adresTuru = (u) => (/^blob:/i.test(u) ? 'blob' : /^data:/i.test(u) ? 'data' : 'modül');
// İşçi adresinin yedek adayı (A-16). Modül sürümünde yedek aday yoktur (null). Tek dosya derlemesi (tools/build-single-html.mjs) bu
// satırı, birincil adres ifadesinde olduğu gibi, derleme anında ön sözün yazdığı yedek adresle değiştirir (http'de blob: → data:,
// kökeni 'null' olan bağlamda data: → blob:). Oyun kaynağı böylece hiçbir test kancası globalini (window.__DK_*) TEST koruması dışında
// okumaz (tests/node/test_kipi.mjs K5; B1-D02). Satır derleme aracında birebir aranır: değiştirilirse derleme hata verir.
const isciYedekAdresi = () => null;

export const terrain = {
  HALF, TILE,
  tiles: new Map(),
  ready: false,
  uniforms: null,
  // canlı işçi kayıtları: _isciler hepsi (yüklenmekte olan, hazır olmayan ve sınama kipindeki dahil; ölen işçi _workerFailed'da
  // çıkarılır; ayrıntı: _isciKur). workers v0.4 anlamındadır: bütün canlı kayıtlar (testlerin değişmez örnekleyicileri, __dkDurum ve
  // stats().workers bunu okur; hazır olmayan işçinin sınama işi de bu kayıtların jobs kümesindedir; B1-D03). hazirIsciler: yalnız
  // HAZIR ve canlı olanlar (stats().isciHazir).
  _isciler: [],
  get workers() { return this._isciler.filter((r) => !r.dead); },
  get hazirIsciler() { return this._isciler.filter((r) => r.ready && !r.dead); },
  fallback: false,   // işçi kalmadı: üretim ana iş parçacığında
  failures: [],      // teşhis: işçi hataları
  // test kipleri (yalnız test kipinde, ?terrain=): '' | 'noworker' | 'crash' (her işte çöker) | 'badurl' (bozuk işçi adresi) |
  // 'ctorthrow' (Worker kurucusu hata verir) | 'noready' (hazır sinyali yok, yanıt yok) | 'hang' (hazır olur, yanıt vermez) |
  // 'crash1' (tek işçi belirli bir işte bir kez çöker)
  mode: '',
  _rid: 1,
  _karoHata: new Map(), // A-05: karo anahtarı → { n, sonraki, bozuk } (kalıcı karo hatasında üstel geri çekilme)
  _jobs: new Map(),  // id -> { id, msg, prio, tries, resolve, reject, timer, rec }
  _queue: [],
  _localBusy: false,
  localBudget: LOCAL_BUDGET_MS,
  focus: null,       // en son prepare() odağı (tanı; derinlik bastırması bunu kullanır)
  _odaklar: [],      // A-12: etkin hazırlık odakları { x, z, r, until }: kamera uzaktayken bile bu çevrelerdeki karolar korunur
  _upd: 0,
  center: { x: 0, z: 0 },

  // ---- işçiler ----
  // İşçi kaydı: { w, jobs: Map<id, job>, i (yuva), kusak, url (aday no), ready, ok, dead, olusturma, hazirAni, ilkIsAni,
  //   hazirGecikti, yanitGecikti, readyTimer, hazirUyariT, ilkIsT, sessizT, gencT }. ok: işçiden ilk iş yanıtı geldi (işçi kanıtlandı).
  // Kanıtlanmamış işçi (hazır değil ya da ilk işine henüz yanıt vermedi) sınama kipindedir (A-11): aynı anda tek iş alır ve bu iş
  // kuyruğun en düşük öncelikli karo işidir; yakındaki karolar, derinlik penceresi ve ızgaralar ona bağlanıp beklemez. Bir işçi
  // GECIKME_ESIK'ten uzun süredir hazır değilse ya da ilk işine yanıt vermiyorsa yerel şerit kuyruğu paralel işler (_yerelAktif).
  // Bu karar zamanlayıcının kendisinindir: gencT/sessizT tetiklenince kayda hazirGecikti/yanitGecikti yazar; süre yeniden ölçülmez
  // (bkz. _gecikme).
  // Hazır olan işçi ilk işine ILK_IS_SURESI içinde yanıt vermezse devre dışı kalır ("kısa gözetim"); hazır sinyali HAZIR_UYARI'da
  // gelmemişse teşhis kaydı yazılır, READY_TIMEOUT'ta işçi devre dışı kalır.
  _workerUrl() {
    // Tek dosya derlemesinde bu ifade gömülü işçi adresiyle değiştirilir (tools/build-single-html.mjs); import.meta burada kalmaz.
    return String(new URL('./terrainWorker.js', import.meta.url));
  },
  // İşçi adresi adayları (A-16): birincisi kurulamazsa (kurucu hatası ya da hazır olmadan yükleme hatası) sonraki denenir; tek
  // dosyada blob: reddedilirse data: (isciYedekAdresi: derleme anında ön sözün yazdığı adres). badurl test kipinde (A-17) her aday
  // gerçekten bozuk bir işçiye çevrilir.
  _workerUrls() {
    if (this._adresler) return this._adresler;
    const L = [this._workerUrl()];
    const yedek = isciYedekAdresi();
    if (yedek && !L.includes(String(yedek))) L.push(String(yedek));
    return (this._adresler = this.mode === 'badurl' ? L.map(bozukIsciAdresi) : L);
  },
  // İşçi adı: işçi betiği test kiplerini adından tanır (terrainWorker.js). crash1: yalnız yuva 0'ın ilk kurulumu belirli bir işte
  // (ikinci işinde) bir kez çöker; yeniden başlatılan işçi sağlıklıdır.
  _isciAdi(i, kurulum) {
    const m = this.mode;
    if (m === 'crash') return 'test-crash';
    if (m === 'hang') return 'test-hang';
    if (m === 'noready') return 'test-noready';
    if (m === 'crash1' && i === 0 && kurulum === 0) return 'test-crash1';
    return 'arazi-' + i;
  },
  _initWorkers() {
    if (this._isciler.length) return;
    if (this.mode === 'noworker') { this._setFallback('test kipi: işçi yok'); return; }
    const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
    this._yuvalar = [];
    let hata = null;
    for (let i = 0; i < n; i++) {
      this._yuvalar.push({ i, kurulum: 0, yeniden: 0, url: 0, bekliyor: null });
      const e = this._isciKur(i);
      if (e) hata = e;
    }
    // A-15: kısmi kurulum hatasında kurulabilen işçiler çalışır, yedek kip açılmaz (yalnız uyarı); hiçbiri kurulamadıysa yedek
    if (!this._isciler.length) this._setFallback('işçi oluşturulamadı: ' + hata);
    else if (hata) console.warn(`Arazi işçilerinin bir kısmı kurulamadı (${n - this._isciler.length}/${n}): ${hata}; ${this._isciler.length} işçiyle sürüyor`);
  },
  // Yuva i'ye bir işçi kur; adres adayları sırayla denenir. Başarıda null, kurulamazsa son hata iletisi döner.
  _isciKur(i) {
    const Y = this._yuvalar[i];
    const urls = this._workerUrls();
    let son = null;
    for (let u = Y.url; u < urls.length; u++) {
      let w;
      try {
        if (this.mode === 'ctorthrow') throw new DOMException('Test kipi (ctorthrow): Worker kurucusu hata verdi', 'SecurityError');
        w = new Worker(urls[u], { type: 'module', name: this._isciAdi(i, Y.kurulum) });
      } catch (e) {
        son = (e && e.message) || String(e);
        this._hataEkle(`işçi ${i} oluşturulamadı (${adresTuru(urls[u])}): ${son}`);
        continue;
      }
      Y.url = u;
      Y.kurulum++;
      const rec = { w, jobs: new Map(), i, kusak: (this._kusak = (this._kusak || 0) + 1), url: u, ready: false, ok: false, dead: false, olusturma: performance.now(), hazirAni: null, ilkIsAni: null, hazirGecikti: false, yanitGecikti: false, readyTimer: null, hazirUyariT: null, ilkIsT: null, sessizT: null, gencT: null };
      w.onmessage = (e) => this._onMsg(rec, e.data);
      w.onerror = (e) => { e.preventDefault?.(); this._workerFailed(rec, 'hata: ' + (e.message || 'yükleme/çalışma hatası'), 'cokme'); };
      w.onmessageerror = () => this._workerFailed(rec, 'mesaj çözülemedi', 'cokme');
      rec.hazirUyariT = setTimeout(() => { if (!rec.ready && !rec.dead) this._hataEkle(`işçi ${i}: hazır sinyali ${HAZIR_UYARI / 1000} sn içinde gelmedi (bekleniyor)`); }, HAZIR_UYARI);
      // GECIKME_ESIK'te hâlâ hazır değilse yerel şerit kuyruğu paralel işlemeye başlar (_yerelAktif). Karar bayrakla verilir: zamanlayıcı
      // performance.now()'a göre 1 ms'nin altında erken tetiklenebilir (Node/libuv ms saati, tarayıcıda kabalaştırılmış saat); süreyi
      // yeniden ölçen bir denetim o zaman false verir ve şerit READY_TIMEOUT'a dek başlamazdı (B1-D01).
      rec.gencT = setTimeout(() => { rec.gencT = null; if (!rec.ready && !rec.dead) { rec.hazirGecikti = true; this._pump(); } }, GECIKME_ESIK);
      rec.readyTimer = setTimeout(() => { if (!rec.ready && !rec.dead) this._workerFailed(rec, 'hazır sinyali gelmedi', 'sessiz'); }, READY_TIMEOUT);
      this._isciler.push(rec);
      return null;
    }
    return son || 'işçi kurulamadı';
  },
  _setFallback(why) {
    if (!this.fallback) console.warn('Arazi üretimi ana iş parçacığına alındı (' + why + ')');
    this.fallback = true;
    this._hataEkle(why);
  },
  // A-05: teşhis kaydı sınırlı: en çok HATA_SINIRI kayıt (ilk 10 kayıt kök neden olarak korunur, sonrası en yeni kayıtlar)
  _hataEkle(s) {
    this.failures.push(s);
    this._hataSay = (this._hataSay || 0) + 1;
    if (this.failures.length > HATA_SINIRI) this.failures.splice(10, this.failures.length - HATA_SINIRI);
  },
  // işçi öldü ya da yanıt vermiyor: sonlandır, işlerini kurtar. tur: 'cokme' (hata olayı, ileti/gönderim hatası), 'zaman' (iş
  // zaman aşımı), 'ilk' (ilk işe yanıt yok), 'sessiz' (hazır sinyali yok), 'test' (killWorkers)
  _workerFailed(rec, why, tur = 'cokme') {
    if (rec.dead) return;
    rec.dead = true;
    clearTimeout(rec.readyTimer); clearTimeout(rec.hazirUyariT); clearTimeout(rec.ilkIsT); clearTimeout(rec.sessizT); clearTimeout(rec.gencT);
    this._hataEkle(`işçi ${rec.i}: ${why}`);
    console.warn(`Arazi işçisi ${rec.i} devre dışı (${why}); ${rec.jobs.size} iş yeniden kuyruğa alınıyor`);
    try { rec.w.terminate(); } catch (e) { /* zaten kapalı */ }
    this._isciler = this._isciler.filter((r) => r !== rec);
    const jobs = [...rec.jobs.values()];
    rec.jobs.clear();
    for (const job of jobs) {
      clearTimeout(job.timer); job.timer = null; job.rec = null;
      // A-08: iptal edilmiş ya da artık istenmeyen iş (karo düşürüldü/başka çözünürlük istendi, daha yeni derinlik penceresi
      // istendi) yeniden üretilmez
      if (job.iptal || !this._hala(job)) { job.iptal = true; this._finish(job, null, null); continue; }
      // A-05: MAX_TRIES kez işçide denenmiş iş reddedilmez: yerel şeride devredilir (işçilere bir daha gönderilmez)
      if (job.tries >= MAX_TRIES) job.yerel = true;
      this._queue.unshift(job);
    }
    if (!this._isciler.some((r) => !r.dead)) this._setFallback(why);
    this._yenidenBaslat(rec, tur);
    this._pump();
  },
  // A-15: ölen işçinin yuvası en çok YENIDEN_BASLAT.length kez, gecikmeli yeniden kurulur. Yalnız çalıştığı kanıtlanmış (en az bir
  // işe yanıt vermiş) işçi, çöktüğünde ya da iş zaman aşımında yeniden başlatılır: geçici bir hata kalıcı kapasite kaybına dönmez.
  // Hiç çalışmamış işçi (yüklenemedi, hazır olmadı, ilk işine yanıt vermedi ya da ilk işinde çöktü: sistemik sorun, yeniden kurulsa
  // da aynı kalır ve sınama işlerini bekletir) ve killWorkers ile sonlandırılanlar yeniden kurulmaz. Gecikme süresince yerel şerit
  // çalışır; yeniden kurulan işçi kanıtlanana dek sınama kipindedir (tek iş, düşük öncelik).
  _yenidenBaslat(rec, tur) {
    const Y = this._yuvalar && this._yuvalar[rec.i];
    if (!Y || tur === 'test') return;
    // A-16: hazır olmadan yükleme hatası veren adres yerine sıradaki aday (tek dosyada blob: → data:) hemen denenir
    if (tur === 'cokme' && !rec.ready && rec.url + 1 < this._workerUrls().length && Y.url <= rec.url) {
      Y.url = rec.url + 1;
      Y.bekliyor = setTimeout(() => { Y.bekliyor = null; this._yuvayiKur(rec.i); }, 0);
      return;
    }
    if (!rec.ok || !(tur === 'cokme' || tur === 'zaman')) return;
    if (Y.yeniden >= YENIDEN_BASLAT.length) return;
    Y.bekliyor = setTimeout(() => { Y.bekliyor = null; this._yuvayiKur(rec.i); }, YENIDEN_BASLAT[Y.yeniden++]);
  },
  _yuvayiKur(i) {
    if (!this.ready || this._isciler.some((r) => r.i === i && !r.dead)) return;
    const e = this._isciKur(i);
    if (e) console.warn(`Arazi işçisi ${i} yeniden kurulamadı: ${e}`);
    else console.info(`Arazi işçisi ${i} yeniden başlatıldı`);
    this._pump();
  },
  // İşin sonucu hâlâ isteniyor mu? Karo işi: karo duruyor ve bu iş karonun güncel isteği; derinlik işi: en son istenen pencere.
  _hala(job) {
    const m = job.msg;
    if (m.t === 'tile') { const t = this.tiles.get(m.key); return !!t && t.job === job; }
    if (m.t === 'depth') return this._depthJob === job;
    return true;
  },
  _onMsg(rec, m) {
    // A-09: sonlandırılmış işçinin (kaydı ölü: işçi kuşağı geçti) geç iletisi yok sayılır; yeni işçideki kopyaya dokunmaz
    if (rec.dead) return;
    // A-09: yanıtlanan işin yuvası her durumda boşalır (iş _jobs'ta yoksa da: zaman aşımı/iptal sonrası geç yanıt)
    if (m.id !== undefined) rec.jobs.delete(m.id);
    if (m.t === 'ready') {
      rec.ready = true; rec.hazirAni = performance.now();
      clearTimeout(rec.readyTimer); clearTimeout(rec.hazirUyariT); clearTimeout(rec.gencT);
      if (rec.jobs.size) this._ilkIsGozetimi(rec);
      this._pump();
      return;
    }
    // işçiden yanıt geldi: işçi çalışıyor (kanıtlandı); bütün işçiler ölüp yeniden başlatılmışsa üretim işçilere döner
    if (!rec.ok) {
      rec.ok = true; clearTimeout(rec.ilkIsT); rec.ilkIsT = null; clearTimeout(rec.sessizT); rec.sessizT = null;
      if (this.fallback && this.mode !== 'noworker') { this.fallback = false; console.info('Arazi üretimi yeniden işçilerde'); }
    }
    const job = this._jobs.get(m.id);
    // iş bitmiş, iptal edilmiş ya da başka bir işçiye verilmişse yanıt yok sayılır
    if (!job || job.rec !== rec) { this._pump(); return; }
    if (m.t === 'error') {
      console.error('Arazi işçisi:', m.msg);
      if (job.iptal) { this._finish(job, null, null); this._pump(); return; }
      // A-05: işçideki üretim hatası doğrudan red olmaz: iş bir kez yerel şeritte denenir (işçi yaşamaya devam eder); yerelde de
      // hata verirse söz reddedilir (karo için geri çekilme, _requestTile)
      this._hataEkle(`işçi ${rec.i}: ${job.msg.t} işi üretim hatası, yerel yedekte yeniden deneniyor: ${String(m.msg).slice(0, 120)}`);
      clearTimeout(job.timer); job.timer = null; job.rec = null; job.yerel = true;
      this._queue.unshift(job);
    } else this._finish(job, m, null);
    this._pump();
  },
  // A-11 kısa gözetim: hazır işçinin ilk işi (sınama işi) için; ilk yanıt gelince kalkar
  _ilkIsGozetimi(rec) {
    if (rec.ilkIsT || rec.ok || rec.dead || !rec.ready) return;
    rec.ilkIsAni = performance.now();
    rec.ilkIsT = setTimeout(() => { rec.ilkIsT = null; if (!rec.ok && !rec.dead) this._workerFailed(rec, `ilk işe ${ILK_IS_SURESI / 1000} sn içinde yanıt vermedi`, 'ilk'); }, ILK_IS_SURESI);
    // GECIKME_ESIK'te hâlâ yanıt yoksa yerel şerit kuyruğu paralel işlemeye başlar (_yerelAktif; karar bayrakla, bkz. gencT)
    rec.sessizT = setTimeout(() => { rec.sessizT = null; if (!rec.ok && !rec.dead) { rec.yanitGecikti = true; this._pump(); } }, GECIKME_ESIK);
  },
  // İşi bitir: söz bir kez sonuçlanır; iş _jobs'tan ve (varsa) işçi yuvasından çıkar (A-09). İptal edilmiş işin sonucu yok
  // sayılır: söz null ile çözülür (A-08).
  _finish(job, result, err) {
    if (job.bitti) return;
    job.bitti = true;
    if (job.timer) { clearTimeout(job.timer); job.timer = null; }
    if (job.iptalT) { clearTimeout(job.iptalT); job.iptalT = null; }
    if (job.rec) { job.rec.jobs.delete(job.id); job.rec = null; }
    this._jobs.delete(job.id);
    if (job.iptal) job.resolve(null);
    else if (err) job.reject(err);
    else job.resolve(result);
  },
  _enqueue(msg, prio = 0) {
    const id = this._rid++;
    msg.id = id;
    const job = { id, msg, prio, tries: 0, resolve: null, reject: null, timer: null, rec: null, promise: null, iptal: false, bitti: false, iptalT: null, yerel: false };
    job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
    this._jobs.set(id, job);
    this._queue.push(job);
    this._pump();
    return job;
  },
  _request(msg, prio = 0) { return this._enqueue(msg, prio).promise; },
  // İşi iptal et (A-08): sonucu artık istenmiyor; söz null ile çözülür, sonuç hiçbir yerde kullanılmaz.
  //  - kuyruktaysa: kuyruktan çıkar, söz hemen çözülür;
  //  - yerel şeritteyse: şerit bir sonraki dilimin başında işi bırakır (sonuna kadar üretilmez) ve sözü çözer;
  //  - işçideyse: işçi IPTAL_BEKLEME içinde yanıtlarsa o anda, yoksa o sürenin sonunda çözülür; işçinin geç sonucu yok sayılır.
  _cancel(job) {
    if (!job || job.bitti || job.iptal) return;
    job.iptal = true;
    const qi = this._queue.indexOf(job);
    if (qi >= 0) { this._queue.splice(qi, 1); this._finish(job, null, null); return; }
    if (this._lanes.some((a) => a && a.job === job)) return;
    if (job.rec && !job.rec.dead) {
      job.iptalT = setTimeout(() => { job.iptalT = null; if (!job.bitti) { this._finish(job, null, null); this._pump(); } }, IPTAL_BEKLEME);
      return;
    }
    this._finish(job, null, null);
  },
  _pump() {
    if (this._toplu || !this._queue.length) return;
    this._queue.sort((a, b) => a.prio - b.prio);
    for (const rec of this._isciler) {
      if (rec.dead || rec.gonderimHatasi) continue;
      if (!rec.ok) {
        // sınama kipi: tek iş, kuyruğun en düşük öncelikli (en uzak) karo işi; kuyrukta karo yoksa en düşük öncelikli iş
        if (rec.jobs.size) continue;
        let k = -1, kk = -1;
        for (let q = this._queue.length - 1; q >= 0; q--) {
          const j = this._queue[q];
          if (j.yerel) continue;
          if (kk < 0) kk = q;
          if (j.msg.t === 'tile') { k = q; break; }
        }
        if (k < 0) k = kk;
        if (k >= 0) this._gonder(rec, this._queue.splice(k, 1)[0]);
        continue;
      }
      while (rec.jobs.size < 2) {
        const k = this._queue.findIndex((j) => !j.yerel);
        if (k < 0) break;
        if (!this._gonder(rec, this._queue.splice(k, 1)[0])) break;
      }
    }
    if (this._yerelIsVar()) this._localPump();
  },
  _gonder(rec, job) {
    job.tries++;
    job.rec = rec;
    rec.jobs.set(job.id, job);
    job.timer = setTimeout(() => this._workerFailed(rec, `${job.msg.t} işi ${JOB_TIMEOUT[job.msg.t] / 1000} sn içinde bitmedi`, 'zaman'), JOB_TIMEOUT[job.msg.t] || 30000);
    if (!rec.ok) this._ilkIsGozetimi(rec);
    // gönderim hatası: işçi sonraki görevde devre dışı bırakılır (iş yuvada kalır ve oradan kurtarılır); çağıran (_enqueue →
    // _requestTile/requestDepth) işi kendi kaydına bağlamadan önce _workerFailed araya girmesin
    try { rec.w.postMessage(job.msg); return true; }
    catch (e) { rec.gonderimHatasi = true; const why = 'postMessage: ' + (e.message || e); setTimeout(() => this._workerFailed(rec, why, 'cokme'), 0); return false; }
  },
  // Yerel şerit kuyruğu paralel işler mi (A-11): canlı işçi yok (yedek kip), ya da bir işçi GECIKME_ESIK'ten uzun süredir hazır
  // değil ya da hazır olup ilk işine yanıt vermiyor (kısa gözetim/hazır zaman aşımı dolana dek kuyruk beklemesin). Sağlıklı işçi bu
  // süreden çok önce hazır olup yanıt verir (ölçüm: ~50–70 ms); açılışta yerel şerit boşuna ana iş parçacığını meşgul etmez.
  // Aksi hâlde yerel şerit yalnız yerel-yalnız işleri (MAX_TRIES'ı dolduran, işçide üretim hatası veren) alır.
  _canliIsciler() { return this._isciler.filter((r) => !r.dead && !r.gonderimHatasi); },
  // İşçinin gecikme durumu: 'hazir' (GECIKME_ESIK'te hâlâ hazır değildi), 'yanit' (hazır, ilk işine GECIKME_ESIK'te hâlâ yanıt yoktu)
  // ya da null. Yalnız zamanlayıcıların yazdığı bayraklar okunur (B1-D01): _yerelAktif ve gecikmeNedeni aynı kararı verir.
  _gecikme(r) {
    if (!r.ready) return r.hazirGecikti ? 'hazir' : null;
    return !r.ok && r.yanitGecikti ? 'yanit' : null;
  },
  _yerelAktif() {
    const canli = this._canliIsciler();
    if (!canli.length) return true;
    return canli.some((r) => this._gecikme(r) !== null);
  },
  _yerelIsVar() {
    if (this._lanes[0] || this._lanes[1]) return true;
    if (!this._queue.length) return false;
    return this._yerelAktif() || this._queue.some((j) => j.yerel);
  },
  // Yerel şerit dilim bütçesi (ms): yükleme ekranında artırılır (localBudget); kuyruk uzunken en az 20 ms (v0.4 kuralı). A-06:
  // üreteçler en geç YIELD_N örnekte ya da YIELD_MS sürede bir yield eder (terrainGen.js) ve dilim her yield'de süreyi denetler;
  // dilim bütçeyi en çok bir parça (≈ YIELD_MS) ve parçanın sonunda biten işin uygulanması (_apply) kadar aşar.
  dilimButcesi() { return this._queue.length > 30 ? Math.max(this.localBudget, 20) : this.localBudget; },
  // Yedek: ana iş parçacığında, dilim başına sınırlı süreyle (üreteçler ara sıra yield eder). İki şerit vardır:
  // şerit 0 kısa işler (karo), şerit 1 uzun işler (derinlik 512², harita ızgarası 256²); böylece tek bir uzun iş
  // yakındaki karoların üretimini dakikalarca bloke etmez. Her dilimde iki şerit sırayla ilerler.
  _lanes: [null, null],
  _localPump() {
    if (this._localBusy) return;
    if (!this._yerelIsVar()) return;
    this._localBusy = true;
    schedule(this._localStep || (this._localStep = () => this._localSlice()));
  },
  _localSlice() {
    const t0 = performance.now();
    const budget = this.dilimButcesi();
    const paralel = this._yerelAktif();
    for (;;) {
      let any = false;
      for (let L = 0; L < 2; L++) {
        let a = this._lanes[L];
        if (!a) {
          const idx = this._queue.findIndex((j) => (j.msg.t !== 'tile') === (L === 1) && (paralel || j.yerel));
          if (idx < 0) continue;
          const job = this._queue.splice(idx, 1)[0];
          job.yerel = true; // yerel şeritte başlayan iş yerelde biter (işçiye geri gönderilmez)
          try { a = this._lanes[L] = { job, gen: generate(job.msg) }; }
          catch (e) { this._finish(job, null, e); continue; }
        }
        any = true;
        // A-08: iptal edilen iş şeritte bir sonraki dilimin başında bırakılır (sonuna kadar üretilmez); söz null ile çözülür
        if (a.job.iptal || a.job.bitti || !this._jobs.has(a.job.id)) { this._lanes[L] = null; if (!a.job.bitti) this._finish(a.job, null, null); continue; }
        try {
          const r = a.gen.next();
          if (r.done) { this._finish(a.job, r.value.out, null); this._lanes[L] = null; }
        } catch (e) { this._finish(a.job, null, e); this._lanes[L] = null; }
        if (performance.now() - t0 > budget) { schedule(this._localStep); return; }
      }
      if (!any) break;
    }
    this._localBusy = false;
    if (this._yerelIsVar()) this._localPump();
  },
  // test/hata ayıklama: tüm işçileri öldür (kurtarma yolu sınanır); yeniden başlatılmazlar (bekleyen yeniden kurulumlar da iptal)
  killWorkers() {
    for (const Y of this._yuvalar || []) { clearTimeout(Y.bekliyor); Y.bekliyor = null; Y.yeniden = YENIDEN_BASLAT.length; }
    for (const rec of [...this._isciler]) this._workerFailed(rec, 'test: işçi sonlandırıldı', 'test');
  },

  // ---- malzeme ----
  _material() {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.0 });
    // gelgit çizgisi, ıslak kum, kıyı köpüğü ve sığ sularda kostik ışık desenleri
    this.uniforms = { uTide: { value: 0 }, uTTime: { value: 0 }, uWet: { value: 0 }, uCaustic: { value: 1 }, uSnow: { value: 0 } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying float vSlope;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;
vec3 tWN = normalize(mat3(modelMatrix) * objectNormal);
vSlope = sqrt(max(1.0 - tWN.y*tWN.y, 0.0)) / max(tWN.y, 0.05);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos;
varying float vSlope;
uniform float uTide, uTTime, uWet, uCaustic, uSnow;
float th(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float tn(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(th(i),th(i+vec2(1,0)),f.x), mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x), f.y); }
float tWet = 0.0;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
float tnz = tn(vWPos.xz*0.9)*0.5 + tn(vWPos.xz*3.1)*0.3 + tn(vWPos.xz*0.13)*0.2;
diffuseColor.rgb *= 0.86 + 0.24*tnz;
float tAbove = vWPos.y - uTide;
// ıslak kum bandı (su çizgisinin hemen üstü, yatayda birkaç metre) ve yağmur ıslaklığı
float tSl = max(vSlope, 0.02);
float tBand = (1.0 - smoothstep(1.0, 4.5 + 2.5*tnz, tAbove / tSl)) * (1.0 - smoothstep(0.35, 0.9, tAbove)) * step(-0.6, tAbove);
tWet = clamp(max(tBand, uWet * 0.7), 0.0, 1.0);
diffuseColor.rgb *= 1.0 - 0.3 * tWet;
// kar yağışı birikintisi (buzul bölgesinde düz yüzeylere)
float tSnowK = uSnow * smoothstep(0.55, 0.25, vSlope) * smoothstep(0.8, 1.6, tAbove) * (0.75 + 0.25*tnz);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 1.0), tSnowK);
`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.3, tWet * 0.85);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float tDepth = -tAbove;
if (tDepth > 0.05 && uCaustic > 0.01) {
  vec2 cp = vWPos.xz * 0.42;
  float c1 = 1.0 - abs(tn(cp + vec2(uTTime*0.35, uTTime*0.2))*2.0 - 1.0);
  float c2 = 1.0 - abs(tn(cp*1.6 - vec2(uTTime*0.25, -uTTime*0.31) + 4.7)*2.0 - 1.0);
  float ca = pow(c1 * c2, 6.0) * smoothstep(0.05, 0.8, tDepth) * (1.0 - smoothstep(3.0, 12.0, tDepth));
  totalEmissiveRadiance += vec3(0.55, 0.85, 0.9) * ca * uCaustic;
}`);
    };
    return mat;
  },

  // ---- kurulum ----
  init(scene, quality = 'high') {
    this.scene = scene;
    this.quality = quality;
    this.group = new THREE.Group();
    this.group.name = 'terrain';
    scene.add(this.group);
    this.material = this._material();
    // A-19: kalite ölçeği (baseLod) burada yazılır; görüş mesafesi çarpanı (viewScale) settings.apply → setViewDistance'tan gelir
    // (açılışta init'ten önce çağrılır). lodScale = baseLod × viewScale. v0.4'te apply init'ten önce baseLod'u kalıcı 1 yapıyor,
    // init de görüş çarpanını siliyordu (açılışta görüş mesafesi araziye uygulanmıyor, sonraki ayar değişiminde kalite ölçeği
    // kayboluyordu).
    this.baseLod = quality === 'low' ? 0.7 : quality === 'medium' ? 0.85 : 1;
    this.lodScale = this.baseLod * this.viewScale;
    // arazi test kipleri (?terrain=… ya da window.__DK_TERRAIN_MODE) yalnız test kipinde (K9-3; K-08); bkz. mode alanı
    this.mode = TEST ? (window.__DK_TERRAIN_MODE || testParam('terrain') || '') : '';
    this._initWorkers();
    this.ready = true;
  },
  // Görüş mesafesi ayarı (0..1): akış/LOD yarıçap çarpanı 0,7 + 0,3·v (%30 → 0,79×, %100 → 1×), kalite ölçeğiyle çarpılır (A-19)
  viewScale: 1,
  setViewDistance(v) {
    this.viewScale = 0.7 + 0.3 * (Number.isFinite(v) ? v : 1);
    if (this.baseLod !== undefined) this.lodScale = this.baseLod * this.viewScale;
  },

  // eski API uyumluluğu
  build() {},
  buildMeshes(scene, quality) { this.init(scene, quality); },

  // İstenen çözünürlük. cur: karonun şimdiki ya da istenmiş çözünürlüğü. A-07 histerezis: daha ince çözünürlüğe geçiş eşikte hemen,
  // kabalaşma eşiğin LOD_HIST ötesinde (kamera LOD sınırında gidip gelirken karo yeniden üretilmez). Kara içermeyen (derin deniz)
  // karo yalnız DEEP_VIEW içinde istenir; düşürülmesi update()'te DEEP_DROP'ta.
  _wantSeg(i, j, cx, cz, cur = 0) {
    const x = -HALF + (i + 0.5) * TILE, z = -HALF + (j + 0.5) * TILE;
    const d = Math.max(0, Math.hypot(x - cx, z - cz) - TILE * 0.5);
    const land = this._land(i, j);
    if (!land) return d < DEEP_VIEW ? 8 : 0;
    let seg = 0;
    for (const L of LODS) if (d < L.d * this.lodScale) { seg = L.seg; break; }
    if (cur > seg) for (const L of LODS) if (L.seg === cur) { if (d < L.d * this.lodScale * (1 + LOD_HIST)) seg = cur; break; }
    return seg;
  },
  _land(i, j) {
    const k = tkey(i, j);
    let v = this._landCache?.get(k);
    if (v === undefined) {
      if (!this._landCache) this._landCache = new Map();
      const x0 = -HALF + i * TILE, z0 = -HALF + j * TILE;
      v = rectMayHaveLand(x0, z0, x0 + TILE, z0 + TILE);
      this._landCache.set(k, v);
    }
    return v;
  },

  // Kamera çevresindeki karoları iste / LOD değiştir / uzaktakileri boşalt
  update(cx, cz, force = false) {
    if (!this.ready) return;
    this._upd -= 1;
    if (this._upd > 0 && !force) return;
    this._upd = 12;
    this.center.x = cx; this.center.z = cz; this._centered = true;
    const R = LODS[LODS.length - 1].d * this.lodScale + TILE;
    const simdi = performance.now();
    // İstenen çözünürlük: kamera halkaları ve (varsa) hazırlık odakları — aynı karo için en YÜKSEĞİ alınır; böylece
    // odak uzaktayken kameranın çevresi düşük çözünürlüğe indirilmez, döngüler birbirinin isteğini ezmez.
    const want = new Map(); // k -> { i, j, seg, prio }
    const collect = (ox, oz, rad, circle, prioOff) => {
      const i0 = Math.max(0, Math.floor((ox - rad + HALF) / TILE)), i1 = Math.min(NT - 1, Math.floor((ox + rad + HALF) / TILE));
      const j0 = Math.max(0, Math.floor((oz - rad + HALF) / TILE)), j1 = Math.min(NT - 1, Math.floor((oz + rad + HALF) / TILE));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(-HALF + (i + 0.5) * TILE - ox, -HALF + (j + 0.5) * TILE - oz);
        if (circle && d > rad) continue;
        const k = tkey(i, j);
        const t = this.tiles.get(k);
        const seg = this._wantSeg(i, j, ox, oz, t ? (t.pending || t.seg) : 0);
        if (!seg) continue;
        const w = want.get(k);
        if (!w) want.set(k, { i, j, seg, prio: d + prioOff });
        else { if (seg > w.seg) w.seg = seg; if (d + prioOff < w.prio) w.prio = d + prioOff; }
      }
    };
    collect(cx, cz, R, false, 0);
    // A-12: etkin bütün hazırlık odakları (süresi dolan düşer); focus en son odak (tanı ve derinlik bastırması)
    if (this._odaklar.length) this._odaklar = this._odaklar.filter((F) => simdi < F.until);
    for (const F of this._odaklar) collect(F.x, F.z, F.r, true, -200);
    if (this.focus && !(simdi < this.focus.until)) this.focus = this._odaklar[this._odaklar.length - 1] || null;
    // istekler toplu kuyruklanır: kuyruk döngü sonunda bir kez sıralanıp dağıtılır (her istekte yeniden sıralanmaz; sınama
    // işleri bütün istekler arasından seçilir)
    this._toplu = true;
    try {
      for (const [k, w] of want) {
        let t = this.tiles.get(k);
        if (!t) { t = { i: w.i, j: w.j, k, x0: -HALF + w.i * TILE, z0: -HALF + w.j * TILE, seg: 0, mesh: null, heights: null, pending: 0, job: null, req: null }; this.tiles.set(k, t); }
        if (t.seg === w.seg) {
          // doğru çözünürlük zaten var: başka bir çözünürlük için bekleyen istek varsa iptal (eski sonuç yok sayılır)
          if (t.pending) { t.pending = 0; t.req = null; if (t.job) { this._cancel(t.job); t.job = null; } }
        } else if (t.pending !== w.seg) {
          // A-05: kalıcı hatalı karo geri çekilme süresince yeniden istenmez
          const h = this._karoHata.get(k);
          if (h && simdi < h.sonraki) continue;
          this._requestTile(t, w.seg, w.prio); // yeni istek bekleyen farklı isteği geçersiz kılar
        }
      }
      for (const [k, t] of this.tiles) {
        if (want.has(k)) continue;
        const d = Math.hypot(t.x0 + TILE / 2 - cx, t.z0 + TILE / 2 - cz);
        // A-07: derin deniz karosu (yalnız DEEP_VIEW içinde istenir) DEEP_DROP'ta düşer; v0.4'te genel halka yarıçapında
        // (~3,2 km) düşüyor, açık denizde yüzlerce görünmez seg-8 karo sahnede kalıyordu
        if (d > (this._land(t.i, t.j) ? R + TILE * 2 : DEEP_DROP + TILE * 0.5)) this._drop(t);
      }
    } finally { this._toplu = false; }
    this._pump();
  },

  _requestTile(t, seg, prio) {
    if (t.job) { this._cancel(t.job); t.job = null; } // bekleyen eski istek (farklı LOD) iptal (A-08: şeritte/işçide de)
    t.pending = seg;
    const myReq = { seg };
    t.req = myReq;
    const job = this._enqueue({ t: 'tile', key: t.k, x0: t.x0, z0: t.z0, size: TILE, seg, hires: seg === HI_SEG }, prio + (seg === HI_SEG ? -400 : 0));
    t.job = job;
    return job.promise.then((m) => {
      if (t.req !== myReq || !this.tiles.has(t.k)) return;
      t.pending = 0; t.job = null;
      if (m && m.pos) this._karoHata.delete(t.k);
      this._apply(t, m);
    }).catch((e) => { if (t.req === myReq) { t.pending = 0; t.job = null; } this._karoHatasi(t.k, e); });
  },
  // A-05: kalıcı karo hatası: karo başına üstel geri çekilme (1 → 2 → 4 … ≤ 30 sn) ve bozuk işareti (üçüncü hatada); geri çekilme
  // süresince update() karoyu yeniden istemez. v0.4'te karo her 12 karede yeniden isteniyor, her seferinde hata kaydı yazılıyordu.
  _karoHatasi(k, e) {
    const h = this._karoHata.get(k) || { n: 0, sonraki: 0, bozuk: false };
    h.n++;
    h.bozuk = h.n >= 3;
    const bekle = Math.min(30000, 1000 * 2 ** (h.n - 1));
    h.sonraki = performance.now() + bekle;
    this._karoHata.set(k, h);
    this._hataEkle(`karo ${k}: ${(e && e.message) || e} (${h.n}. hata${h.bozuk ? ', bozuk' : ''}; ${bekle / 1000} sn sonra yeniden)`);
  },

  _apply(t, m) {
    if (!m || !m.pos) return;
    t.seg = m.seg;
    t.maxH = m.maxH; t.minH = m.minH;
    t.heights = m.heights || null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(m.nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(m.col, 3));
    g.setIndex(new THREE.BufferAttribute(m.idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(t.x0 + TILE / 2, (m.maxH + m.minH) / 2, t.z0 + TILE / 2), Math.hypot(TILE * 0.71, (m.maxH - m.minH) / 2 + 4));
    if (t.mesh) { t.mesh.geometry.dispose(); t.mesh.geometry = g; }
    else {
      t.mesh = new THREE.Mesh(g, this.material);
      t.mesh.matrixAutoUpdate = false;
      t.mesh.receiveShadow = true;
      this.group.add(t.mesh);
    }
    t.mesh.castShadow = m.maxH > 0 && m.seg >= 32;
  },

  _drop(t) {
    if (t.mesh) { this.group.remove(t.mesh); t.mesh.geometry.dispose(); }
    if (t.job) { this._cancel(t.job); t.job = null; }
    t.req = null;
    this.tiles.delete(t.k);
  },

  // Bir noktanın çevresini hazırla (yükleme ekranı / ışınlanma): yakın karolar ve okyanus derinliği.
  // Ortak arayüz (A-11): Promise<'ok' | 'timeout'>; asla reddedilmez, asla asılı kalmaz.
  //  'ok'      : bölgedeki bütün karo istekleri (başarıyla ya da hatayla) ve derinlik penceresi bitti;
  //  'timeout' : opts.timeout ms (varsayılan 45 sn) doldu; eksik karolar arka planda tamamlanır (odak 12 sn daha korunur).
  //  terrain.ready false iken (init çağrılmadan) iş açılmaz; söz hemen 'ok' ile çözülür (beklenecek iş yok).
  async prepare(x, z, opts = {}) {
    if (!this.ready) return 'ok';
    const r = opts.radius || 700;
    const sinir = opts.timeout || 45000;
    // A-12: her hazırlığın kendi odağı: hazırlık süresince ve sonrasında 12 sn bu çevre korunur (kamera gelene kadar
    // düşürülmez); örtüşen başka bir hazırlığın bitişi bu odağın süresini değiştirmez (v0.4: tek this.focus, biten eski çağrı
    // yeni odağı 12 sn'ye kısaltıyordu)
    const F = { x, z, r, until: performance.now() + 90000 };
    this._odaklar.push(F);
    this.focus = F;
    let to = null, iv = null, sonuc = 'ok';
    try {
      // kamera merkezi korunur (mevcut çevre düşürülmez); odak uzak bölgeyi isteklere ekler
      this.update(this._centered ? this.center.x : x, this._centered ? this.center.z : z, true);
      const bekle = [];
      for (const t of this.tiles.values()) {
        const d = Math.hypot(t.x0 + TILE / 2 - x, t.z0 + TILE / 2 - z);
        if (t.pending && d < r) bekle.push(t);
      }
      const karolar = new Promise((res) => {
        const bitti = () => bekle.every((t) => !t.pending || !this.tiles.has(t.k));
        if (bitti()) { res(); return; }
        iv = setInterval(() => { if (bitti()) { clearInterval(iv); iv = null; res(); } }, 30);
      });
      const derinlik = this.requestDepth(x, z, true);
      const sure = new Promise((res) => {
        to = setTimeout(() => { to = null; console.warn(`terrain.prepare: ${sinir / 1000} sn zaman aşımı; eksik karolar arka planda tamamlanacak`); res('timeout'); }, sinir);
      });
      sonuc = await Promise.race([Promise.all([karolar, derinlik]).then(() => 'ok'), sure]);
    } catch (e) {
      console.error('terrain.prepare:', e);
      sonuc = 'timeout';
    } finally {
      if (to) clearTimeout(to);
      if (iv) clearInterval(iv);
      F.until = performance.now() + 12000;
    }
    return sonuc;
  },
  // Açılış/yükleme metni için arazi üretimindeki gecikmenin nedeni (A-11; game.buildWorld yükleme metnine yazar); sorun yoksa null.
  // "yedek üretim devrede" yalnız _yerelAktif'in de true verdiği durumda yazılır (aynı işçi kümesi, aynı bayraklar; B1-D01).
  gecikmeNedeni() {
    if (!this.ready) return null;
    const canli = this._canliIsciler();
    if (!canli.length) return this.fallback ? 'arazi işçisi yok; arazi ana iş parçacığında (yedek) üretiliyor' : null;
    const g = canli.map((r) => this._gecikme(r));
    if (g.includes('hazir')) return 'arazi işçileri hazır değil; yedek üretim devrede';
    if (g.includes('yanit')) return 'arazi işçileri yanıt vermiyor; yedek üretim devrede';
    return null;
  },

  // ---- okyanus derinlik penceresi (kamerayla birlikte kayar) ----
  depthWin: null,
  requestDepth(x, z, force = false) {
    const size = 2400, res = 512;
    const w = this.depthWin;
    if (!force && w && Math.hypot(x - (w.x0 + size / 2), z - (w.z0 + size / 2)) < 520) return Promise.resolve();
    // hazırlık odağı etkinken (ışınlanma/hızlı yolculuk) kamera henüz gelmemiş olabilir: odaktan uzak istekler penceresini ezmesin
    const F = this.focus;
    if (!force && F && performance.now() < F.until && Math.hypot(x - F.x, z - F.z) > 520) return Promise.resolve();
    if (this._depthPending && !force) return this._depthPending;
    // A-05: derinlik işi hata verdiyse geri çekilme süresince kameranın (zorunsuz) isteği yeni iş açmaz (v0.4: her karede)
    if (!force && this._derinlikSonraki && performance.now() < this._derinlikSonraki) return Promise.resolve();
    const x0 = Math.round((x - size / 2) / 40) * 40, z0 = Math.round((z - size / 2) / 40) * 40;
    const seq = (this._depthSeq = (this._depthSeq || 0) + 1);
    // A-08: yeni pencere istenince eski derinlik işi iptal edilir (kuyrukta, şeritte ya da işçide); yalnız son pencere hesaplanır
    const eski = this._depthJob;
    const job = this._enqueue({ t: 'depth', x0, z0, size, res }, force ? -1000 : 50);
    this._depthJob = job;
    if (eski && eski !== job) this._cancel(eski);
    const p = job.promise.then((m) => {
      if (seq !== this._depthSeq) return; // daha yeni bir pencere istendi (ışınlanma): eski yanıt yeniyi ezmesin
      this._depthPending = null;
      if (!m) return;
      this._derinlikHata = 0; this._derinlikSonraki = 0;
      this.depthWin = { x0: m.x0, z0: m.z0, size: m.size };
      this.onDepth?.(m);
    }).catch((e) => {
      if (seq === this._depthSeq) {
        this._depthPending = null;
        this._derinlikHata = (this._derinlikHata || 0) + 1;
        this._derinlikSonraki = performance.now() + Math.min(30000, 1000 * 2 ** (this._derinlikHata - 1));
      }
      this._hataEkle('derinlik: ' + (e?.message || e));
    });
    this._depthPending = p;
    return p;
  },

  // harita/minimap ızgarası (yükseklik + biyom). A-13: önbellek yalnız BEKLEYEN sözleri tutar (aynı ızgaranın eşzamanlı istekleri
  // tek işte birleşir); söz sonuçlanınca kayıt silinir. Çözülmüş ızgaraları mapArt boyanmış tuval olarak zaten önbelleğe alıyor;
  // v0.4'te 24'e kadar çözülmüş ham ızgara (~35 MB'a kadar) tutuluyordu.
  _gridCache: new Map(),
  requestGrid(x0, z0, size, res, prio = 200) {
    const key = `${x0},${z0},${size},${res}`;
    let p = this._gridCache.get(key);
    if (p) return p;
    const sil = () => { if (this._gridCache.get(key) === p) this._gridCache.delete(key); };
    p = this._request({ t: 'grid', x0, z0, size, res }, prio).then((m) => { sil(); return m; }, (e) => { sil(); throw e; });
    this._gridCache.set(key, p);
    return p;
  },

  // ---- sorgular ----
  heightAt(x, z) {
    const fi = (x + HALF) / TILE, fj = (z + HALF) / TILE;
    const i = Math.floor(fi), j = Math.floor(fj);
    const t = this.tiles.get(tkey(i, j));
    if (t && t.heights) {
      const n = t.seg + 1;
      const u = (fi - i) * t.seg, v = (fj - j) * t.seg;
      let a = Math.floor(u), b = Math.floor(v);
      if (a >= t.seg) a = t.seg - 1;
      if (b >= t.seg) b = t.seg - 1;
      const tx = u - a, tz = v - b;
      const H = t.heights;
      const h00 = H[b * n + a], h10 = H[b * n + a + 1], h01 = H[(b + 1) * n + a], h11 = H[(b + 1) * n + a + 1];
      // çizilen ağla aynı üçgenleme (köşegen b–d: tx + tz = 1): dik yamaçta çizilen yüzeyle fizik yüzeyi aynıdır
      if (tx + tz <= 1) return h00 + (h10 - h00) * tx + (h01 - h00) * tz;
      return h11 + (h01 - h11) * (1 - tx) + (h10 - h11) * (1 - tz);
    }
    if (x < -HALF || z < -HALF || x > HALF || z > HALF) return SEA_FLOOR;
    return computeHeight(x, z);
  },

  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 1.5;
    const hl = this.heightAt(x - e, z), hr = this.heightAt(x + e, z);
    const hd = this.heightAt(x, z - e), hu = this.heightAt(x, z + e);
    return out.set(hl - hr, 2 * e, hd - hu).normalize();
  },

  islandAt(x, z, margin = 1.25) { return geoIslandAt(x, z, margin); },
  biomeAt(x, z) { return geoBiomeAt(x, z); },

  colorAt(x, z, h, ny, out = new THREE.Color()) {
    const c = colorSRGB(x, z, h, ny, [0, 0, 0]);
    return out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
  },

  stats() {
    let meshes = 0, hires = 0, tris = 0;
    for (const t of this.tiles.values()) { if (t.mesh) { meshes++; tris += t.mesh.geometry.index.count / 3; } if (t.heights) hires++; }
    return { tiles: this.tiles.size, meshes, hires, tris: Math.round(tris), queue: this._queue.length, jobs: this._jobs.size, workers: this.workers.length, fallback: this.fallback, failures: this.failures.length, mode: this.mode, isciKurulu: this._isciler.length, isciHazir: this.hazirIsciler.length, isciKanit: this._isciler.filter((r) => r.ok).length, hataToplam: this._hataSay || 0 };
  },
};
