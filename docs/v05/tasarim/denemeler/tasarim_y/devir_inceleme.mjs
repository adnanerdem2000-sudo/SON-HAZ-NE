// Faz 5 karşıt inceleme denemesi (salt-okur): faz5_tasarim.md §6.4 seçim kuralının iki varsayımını sınar.
// Bölüm 1 — Algılama kayması: hayatta kalanlar host kaybını farklı anlarda görür (kanal kapanışı ~0 sn, ICE 'failed' ~30 sn,
//   elle "Dümeni devral"). Belgedeki kural saat güdümlü turlardır: tur r = floor((t - algılama_i)/6)+1, aday c_r, dönem e+r.
//   Öneri (B): olay güdümlü oy kirası. Seçmen ulaşabildiği en öndeki adaya dönem E için oy verir (dönem başına tek oy);
//   aday reddederse (canlı host'a bağlı / algılamamış) seçmen beklemeden sıradakine geçer; aday Q oya ulaşınca host olur;
//   seçilmiş bir host'a ulaşan herkes katılır. Tüm düğümler tam bağlantılı, host ölü (belgenin "kendiliğinden sürmeli" dediği durum).
// Bölüm 2 — Canlı host: belgenin taraması host'u her durumda ölü varsayar (election_sim2.mjs). Burada host canlıdır ve
//   konuk–host bağları ya da konuğun kendi sinyal bağlantısı kopar. Belgedeki kural (A): bağı kopan konuk 3 sn sonra seçim başlatır;
//   tek hayatta kalan Q=1 ile kendini seçer; sinyale bağlı olmayan konuk yalnız kendini sayar. Öneri (B): seçim yalnız kendi sinyal
//   bağlantısı açıkken; tek hayatta kalan yalnız host kimliği sinyalde 'yok' (peer-unavailable) ise; çoğunlukta yalnız bağı kopanlar oy verir.
const STEP = 0.5, ROUND = 6, HORIZON = 120;

function simSkew(n, det, variant) {
  // det[i]: i. hayatta kalanın host kaybını gördüğü an (sn). S sırası 0..n-1. Q = floor(n/2)+1 (hepsi canlı, tanık kuralı etkisiz).
  const Q = Math.floor(n / 2) + 1;
  const joined = new Array(n).fill(-1); // katıldığı host (dizin) ya da -1
  const hosts = new Set();
  const voted = new Map(); // `${i}:${E}` -> aday
  for (let t = 0; t <= HORIZON; t += STEP) {
    // seçilmiş bir host varsa onu gören (algılamış) herkes katılır
    for (let i = 0; i < n; i++) if (joined[i] < 0 && t >= det[i] && hosts.size) { joined[i] = [...hosts][0]; }
    if (variant === 'A') {
      const roundOf = (i) => (t >= det[i] ? Math.floor((t - det[i]) / ROUND) + 1 : 0);
      for (let c = 0; c < n; c++) {
        if (joined[c] >= 0 || roundOf(c) === 0) continue;
        const r = roundOf(c); if (r > n || r - 1 !== c) continue; // c yalnız kendi turunda adaydır
        const E = r; const votes = [c];
        for (let v = 0; v < n; v++) {
          if (v === c || joined[v] >= 0) continue;
          if (roundOf(v) !== r) continue; // seçmen kendi saatine göre başka turdaysa başka adaya oy vermeye çalışır
          const k = `${v}:${E}`; if (voted.has(k) && voted.get(k) !== c) continue;
          voted.set(k, c); votes.push(v);
        }
        if (votes.length >= Q) { hosts.add(c); for (const v of votes) joined[v] = c; }
      }
    } else {
      // B: her seçmen, algılamış ve katılmamışsa, algılamış adaylar içinde en öndekine oy verir (aday algılamamışsa reddeder → sıradaki)
      const tally = new Map();
      for (let v = 0; v < n; v++) {
        if (joined[v] >= 0 || t < det[v]) continue;
        let c = -1; for (let k = 0; k < n; k++) if (t >= det[k] && joined[k] < 0) { c = k; break; }
        if (c < 0) continue;
        tally.set(c, (tally.get(c) || 0) + 1);
      }
      for (const [c, k] of tally) if (k >= Q && !hosts.size) { hosts.add(c); for (let v = 0; v < n; v++) if (t >= det[v] && joined[v] < 0) joined[v] = c; }
    }
  }
  const all = joined.every((j) => j >= 0);
  return { all, hosts: hosts.size, when: null };
}

function partSkew() {
  const offs = [0, 1, 2, 4, 7, 13, 25];
  const rows = [];
  for (const n of [2, 3]) {
    let tot = 0, okA = 0, okB = 0, splitA = 0, splitB = 0;
    const idx = Array(n).fill(0);
    const rec = (i) => {
      if (i === n) {
        const det = idx.map((k) => offs[k]); tot++;
        const a = simSkew(n, det, 'A'), b = simSkew(n, det, 'B');
        if (a.all && a.hosts === 1) okA++; if (a.hosts > 1) splitA++;
        if (b.all && b.hosts === 1) okB++; if (b.hosts > 1) splitB++;
        return;
      }
      for (let k = 0; k < offs.length; k++) { idx[i] = k; rec(i + 1); }
    };
    rec(0);
    rows.push({ hayattaKalan: n, durum: tot, belge_A_kendiliginden: okA, belge_A_ciftHost: splitA, oneri_B_kendiliginden: okB, oneri_B_ciftHost: splitB });
  }
  console.log('--- Bölüm 1: tam bağlantılı, host ölü, algılama anları {0,1,2,4,7,13,25} sn tüm birleşimleri');
  console.table(rows);
}

function partLiveHost() {
  // Host durumu: 'canli' (sinyalde kayıtlı), 'kapandi' (sekme kapandı: sinyal kimliği hemen siler → peer-unavailable),
  // 'sessiz' (ağı koptu: sinyal kimliği alive_timeout ≈ 60–90 sn boyunca tutar). Her konuk: sinyal açık/kopuk × host bağı
  // sağlam/kopuk (host ölüyse bağ zaten kopuk). Konuk–konuk bağları sağlam; sinyali kopuk düğüm yeni bağlantı kuramaz.
  // A (belge): Q = floor(|S'|/2)+1, S' yalnız konuklar; host'a bağlı konuk oy vermez; sinyali kopuk düğüm yalnız kendini sayar.
  // C (öneri): nüfus P = S' ∪ {host, sinyal 'peer-unavailable' demedikçe}; host ve ona bağlı konuklar "hayır" sayılır;
  //            seçime yalnız sinyali açık düğümler girer; Q = floor(|P|/2)+1.
  const rows = [];
  for (const hs of ['canli', 'kapandi', 'sessiz']) for (const n of [1, 2, 3]) {
    let tot = 0; const r = { A: { secim: 0, ikiEtkin: 0, haksiz: 0 }, C: { secim: 0, ikiEtkin: 0, haksiz: 0 } };
    for (let m = 0; m < 1 << (2 * n); m++) {
      const sig = [], link = [];
      for (let i = 0; i < n; i++) { sig.push((m >> (2 * i)) & 1); link.push(hs === 'canli' ? (m >> (2 * i + 1)) & 1 : 0); }
      if (hs !== 'canli' && ((m >> 1) & 0x55555555 & ((1 << (2 * n)) - 1))) continue; // ölü host'ta bağ biti anlamsız: tekrarları at
      if (hs === 'canli' && link.every((l) => l === 1)) continue;
      tot++;
      for (const V of ['A', 'C']) {
        const hostInPop = V === 'C' && hs !== 'kapandi';
        const P = n + (hostInPop ? 1 : 0); const Q = Math.floor(P / 2) + 1;
        let elected = false;
        for (let c = 0; c < n && !elected; c++) {
          if (link[c] === 1) continue;
          if (V === 'C' && !sig[c]) continue;
          let votes = 1;
          for (let v = 0; v < n; v++) { if (v === c || link[v] === 1) continue; if (!sig[c] || !sig[v]) continue; votes++; }
          if (votes >= Q) elected = true;
        }
        if (elected) {
          r[V].secim++;
          if (hs === 'canli') { r[V].haksiz += n === 1 ? 1 : 0; if (link.some((l) => l === 1)) r[V].ikiEtkin++; }
        }
      }
    }
    rows.push({ host: hs, konuk: n, durum: tot, A_devir: r.A.secim, A_ikiEtkinHost: r.A.ikiEtkin, A_tekKonukHaksiz: r.A.haksiz, C_devir: r.C.secim, C_ikiEtkinHost: r.C.ikiEtkin, C_tekKonukHaksiz: r.C.haksiz });
  }
  console.log("--- Bölüm 2: host durumu × konuk sinyali × konuk–host bağı (host 'canli' iken en az bir bağ kopuk)");
  console.table(rows);
  console.log("Okuma: host 'canli' satırlarında her devir bir çataldır (eski host da sürer). A_ikiEtkinHost: eski host'a bağlı konuk varken");
  console.log("ikinci host seçilir. Host 'sessiz' satırlarında C'nin eksik devirleri, sinyal sunucusu kimliği düşürünce (alive_timeout) tamamlanır.");
}

partSkew();
partLiveHost();
