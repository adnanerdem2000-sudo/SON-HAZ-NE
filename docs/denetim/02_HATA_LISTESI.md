# 2. Tespit Edilen Hatalar ve Öncelik Sıralaması

Sıralama: doğrulanmış hatalar önce, sonra tartışmalı, belirsiz ve tek merceğin eklediği bulgular; her blok önem derecesine göre. Çürütülen iddialar ekte (3. bölüm) kayıt altında tutulur. Dosya:satır değerleri `762f1c7` sürümüne göredir.

## 1. Doğrulanan hatalar (33)

### F-01 — Co-op: konuk Kraken dokunaçlarını vuramıyor (clientUpdate hedefleri öldürüyor)
- **Önem:** Yüksek · **Grup:** F_dusman · **Yer:** `js/game/bosses.js:373` · **Güven:** 0.95
- Kod: `this._updateTentacles(0, null);  // 302: ten.state = this.alive ? 'idle' : 'dead';  354: ten.target.alive = ... && ten.state !== 'idle' ...`
- Açıklama: Konuk tarafında Kraken.clientUpdate dokunaç durumunu 'net' yapıp ardından _updateTentacles'ı ship=null ile çağırıyor; `!ship` dalı durumu 'idle'a çeviriyor ve döngü sonunda ten.target.alive=false oluyor. combat._meleeHit, raycast ve _softLock `!t.alive` hedefleri atladığı için konuklar dokunaçlara hiç vuramaz; baş evre 1'de (headY<-3) hasar almadığından konuk Kraken savaşına yalnızca açık başa topla katkı verebilir. Koşu 1-F: 6 dokunaç alive=[false×6], state=['idle'×6], işaret halkası 0.
- Kök neden: Konuk yolu, ev sahibi için yazılmış _updateTentacles içindeki `!this.alive || !ship` dalını tetikliyor; ağdan gelen tn[i][3] (canlı/kopuk) bilgisi target.alive'a yansıtılmıyor.
- Yeniden üretme: Solo sayfada: DK.G.online=true; DK.G.isHost=false; DK.bosses.applySnapshot({id:'kraken',hp:3000,max:3000,x,y:-0.5,z,ph:2,a:1,tn:[6×[x,3,z,1]],hy:-0.5,ex:0}); DK.bosses.update(1/30)×3 → DK.bosses.active.tentacles.map(t=>t.target.alive) hepsi false.
- Önerilen düzeltme: clientUpdate'te dokunaç durumunu ağdan koru: `_updateTentacles` yerine yalnız eğri çizimini yapan bir yardımcı çağır ya da `_updateTentacles(0, G.ship)` sonrasında `ten.target.alive = this.alive && !!ten.netTip?.[3] && ten.target.pos.y > -1` ile üzerine yaz; işaret halkalarını (markers) netExtra ile konuğa da gönder.
- Statik mercek: bosses.js:369 clientUpdate her karede `t.state = t.netTip[3] ? 'net' : 'gone'` yapıp :373 `this._updateTentacles(0, null)` çağırır. ship=null olduğundan :301-302 `else if (!this.alive || !ship) { ...; ten.state = this.alive ? 'idle' : 'dead'; }` dalı çalışır; :354 `ten.target.alive = this.alive && ten.state !== 'gone' && ten.state !== 'idle' && ten.target.pos.y > -1` → her dokunaç için false. Vuruş yolları combat.js:185 (_meleeHit), :266 (raycast), :164 (_softLock), :47 (explosion), :56 (projectileTest) hepsi `!t.alive` hedefi atlar → konuk dokunaca hiç vuramaz; _hurtTentacle'ın konuk dalı (:212 netHurtBoss ten) ölü koddur. İşaret halkaları yalnız :311 'rise/grabRise' dalında görünür olur, konukta bu dal hiç çalışmaz. Baş :205 `if (this.headY < -3) return info.kind === 'explosion' ? 0.2 : 0` → evre 1'de ilerleme yalnız dokunaç kopmasıyla (:219 applyDamage 260) olur; konuk katkısı sıfır. Not: önerilen düzeltmede tn[i][3] yalnız gone/değil bilgisi taşır (:359); ev sahibinde 'idle' dokunaç da vurulamaz, bu yüzden snapshot'a dokunaç durumunun eklenmesi gerekir.

### F-02 — Co-op: güverte düşmanları uzak oyuncuları asla ulaşılabilir saymıyor (RemotePlayer.ship yok)
- **Önem:** Yüksek · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:853` · **Güven:** 0.9
- Kod: `if (this.ship) return tgt.ref?.ship === this.ship && (tgt.mode === 'deck' || tgt.mode === 'helm' || tgt.mode === 'cannon');`
- Açıklama: Bordalama olayı (events.js:230) ve Lanetli Amiral tayfası (bosses.js:924-926) gemi güvertesinde doğar. _reachable uzak oyuncu için tgt.ref.ship'i okur; net.js RemotePlayer sınıfında `ship` alanı yok (yalnız anlık görüntüde t.ship kimliği var) → her zaman false → _meleeOrStrafe 'ulaşılamaz' dalına girer: yalnız alay eder ve yürür, hiç saldırmaz. Ev sahibi güvertedeyse ona saldırır; konuk güvertede tamamen güvendedir, ev sahibi aşağıdayken Amiral savaşı tıkanır. Koşu 2-H: remoteOnDeckReachable=false, localOnDeckReachable=true.
- Kök neden: Yerel Player nesnesinin alanına (ship referansı) göre yazılmış kontrol; RemotePlayer.update() t.ship/t.mode'u this.ship'e kopyalamıyor.
- Yeniden üretme: Güvertede DK.enemies.spawn('haydut', s.x, s.z, {ship:s, lx:0, lz:0}); de._reachable({ref:{pos,mode:'deck',hp:100,downed:false}, mode:'deck'}, 0) → false; aynı çağrı ref:{ship:s} ile → true.
- Önerilen düzeltme: RemotePlayer.update'te `this.ship = t.ship ? G.ships.find(s=>s.id===t.ship) : null` ata; ya da _reachable'da kimlik karşılaştır: `const sid = tgt.ref?.ship?.id ?? tgt.ref?.target?.ship; return sid === this.ship.id && ...`.
- Statik mercek: enemies.js:853 `if (this.ship) return tgt.ref?.ship === this.ship && (tgt.mode === 'deck' || ...)`. net.js:44-61 RemotePlayer alanları: id, name, color, app, char, pos, yaw, target, hp, mode, vel, downed, label — `ship` yok; update() (:74-108) t.ship'i yalnız konum hesabında kullanır, this.ship'e yazmaz → `undefined === shipObj` false. _meleeOrStrafe :864-870 `if (!reachable) { ... taunt ...; return; }` → _startMelee'ye ulaşılmaz; _resolveMelee yalnız 'attack' durumunda (:805) çağrılır. Düzeltmeler: (1) Menzilli tayfa (haydut_nisanci, events.js:228) etkilenmez — _startRanged :817 reachable kontrolünden ÖNCE çalışır ve konuğa ateş eder. (2) Ev sahibine yönelen saldırının yayı/AoE'si (hitOne :984 tüm oyuncuları tarar) güvertedeki konuğu da vurabilir; 'tamamen güvende' abartılı. (3) 'Amiral savaşı tıkanır' yanlış: konuk Amiral'e vurabilir (hurt :354 → netHurtEnemy → net.js:237 applyDamage) ve CursedAdmiral :952 admiral ölünce boss ölür → savaş tıkanmaz, konuk için tehditsiz biter. Ana iddia (güverte yakın dövüş düşmanları uzak oyuncuya asla saldırmaz) doğru.

### A1 — Gemi direk/top/bölüm hasarı kaydediliyor ama yüklemede sıfırlanıyor
- **Önem:** Orta · **Grup:** A_motor · **Yer:** `js/game/shipControl.js:25` · **Güven:** 1
- Kod: `const ship = new Ship(scene, data?.typeId || 'sloop', { id: ..., hp: data?.hp, water: data?.water, holes: data?.holes, hold: data?.hold, upg: data?.upg, cannonballs: data?.cannonballs, planks: data?.planks });`
- Açıklama: Ship.serialize() (ship.js:687-694) parts, mastHp ve cannonHp alanlarını yazar; Ship kurucusu bunları opts üzerinden kabul eder (ship.js:41-43) ancak createPlayerShip bu üç alanı geçirmez. Kayıt yüklendiğinde direk/top/bölüm hasarı tam sağlığa döner (ucuz tamir hilesi; görsel hasar kaybolur).
- Kök neden: serialize ile createPlayerShip arasındaki alan listesi eşitlenmemiş.
- Yeniden üretme: Koşu r1: mastHp[0]=40, parts.pruva=50, cannonHp[0]=30 → saveNow → kayıtta 40/50/30 → toMenu → startGame(data) → 100/100/100 (gemi hp 60 doğru geldi).
- Önerilen düzeltme: createPlayerShip'te `parts: data?.parts, mastHp: data?.mastHp, cannonHp: data?.cannonHp` ekle (anchorState 'down' varsayılanı da data'dan gelsin).
- Statik mercek: js/game/shipControl.js:25-30 createPlayerShip yalnız `hp, water, holes, hold, upg, cannonballs, planks` geçiriyor; Ship kurucusu js/ship/ship.js:41-43 `opts.parts / opts.mastHp / opts.cannonHp` kabul ediyor ve serialize (ship.js:692) bu üç alanı yazıyor. Başka hiçbir yükleme yolu bu alanları geri koymuyor (grep: mastHp/cannonHp/parts okuyan yerler hud.js:289, shipControl.js:106-118, net.js:488-489 — hiçbiri kayıt uygulamıyor). Çalıştırma r1: kayıtta mastHp[0]=40, parts.pruva=50, cannonHp[0]=30, hp=60 → yüklemede 100/100/100, gemi hp 60 (yalnız hp korunuyor). Tersane tamir bedeli direk/top/bölüm hasarını da sayıyor (economy/shop.js:170) → kaydet/yükle ücretsiz tamir hilesi; görsel direk kırığı kayboluyor.

### A2 — Duraklatma menüsü dünyayı durdurmuyor (solo dahil)
- **Önem:** Orta · **Grup:** A_motor · **Yer:** `js/game/game.js:172` · **Güven:** 0.95
- Kod: `update(dt) {     input.endFrame && null;     if (G.state === 'menu') { this.menuUpdate(dt); return; }     if (G.state !== 'playing' || !G.player) return;`
- Açıklama: menu.pause (menu.js:343) yalnız bir panel açar; ui.open G.uiOpen=true yapar (ui.js:45). game.update'te duraklatma durumu yok, engine.js:16 `paused` alanı hiçbir yerde kullanılmıyor. 'Duraklatıldı' yazısı görünürken sistemler (düşman AI, gemi sürüklenmesi, zaman, zehir, oksijen) ve 120 s otomatik kayıt çalışmaya devam eder; oyuncu girişleri kilitli olduğu için savunmasızdır.
- Kök neden: Duraklatma yalnız UI katmanında modellenmiş; simülasyon durumu (G.state/engine.paused) değişmiyor.
- Yeniden üretme: Koşu r1: kind:'pause' paneli açıkken DK.sim(3) → playTime +3,00 s, sky.hour +0,05, G.state 'playing'.
- Önerilen düzeltme: Solo'da (G.online değilken) pause açılışında G.state='paused' ya da engine.paused=true yap; game.update/hud dışındaki güncellemeleri atla, kapanışta geri al. Çevrimiçi modda mevcut davranış korunabilir.
- Statik mercek: js/ui/menu.js:343-357 pause() yalnız ui.open(…, {kind:'pause'}) çağırıyor; js/ui/ui.js:45 sadece `G.uiOpen = true` yapıyor. js/game/game.js:172-205 update() içinde duraklatma/uiOpen kapısı yok: shipControl, player, gemiler, interact, tüm sistemler ve otomatik kayıt (203-204) çalışmaya devam ediyor; js/core/engine.js:16 `paused` alanı depoda tek geçiş (hiç okunmuyor). enemies.js/bosses.js/animals.js G.uiOpen'a hiç bakmıyor (grep 0); combat.js:82 yalnız oyuncunun saldırı girişini kesiyor → oyuncu panel açıkken saldırıya açık. Çalıştırma r1: Escape ile gerçek duraklatma menüsü açık (ui.stack üstü 'pause', uiOpen=true) iken DK.sim(3) → playTime +3.00 s, sky.hour +0.05, G.state 'playing', engine.paused=false, autosaveT artıyor.

### F-03 — Sersemlemiş düşmana hafif vuruş sersemliği iptal ediyor; kalkan kırma (guard-break) poise düşmanlarda 0.45 sn sürüyor; ✦ simgesi takılı kalıyor
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:399` · **Güven:** 0.95
- Kod: `else if (this.state !== 'attack' || !this.T.poise) {   if (!(this.T.boss && this.state === 'attack' && Math.random() < 0.7)) {     this._setState('hit');`
- Açıklama: applyDamage'ın tepki dalı 'stunned' durumunu dışlamıyor: parry sonrası stun(1.7) ya da guard-break stun(1.3) alan düşmana atılan ilk hafif vuruş durumu 'hit' yapar; _act 'hit' 0.45 sn sonra 'chase'e geçer, stunT boşa kalır ve 'stunned' bitişindeki `alert=0` hiç çalışmaz → dönen ✦ simgesi chase/attack boyunca ekranda kalır. Böylece 'sersemken ×1.25 hasar' tasarımı yalnız ilk vuruşa uygulanır, parry→cezalandırma döngüsü ve ağır vuruşla kalkan kırma (tam da poise/kalkanlı düşmanlar için tasarlanmış) fiilen işlemez. Koşu 1-A (haydut_agir, Math.random=0): hurt(guardBreak) → state 'hit' (stunned değil), alert 3; 0.6 sn sonra 'chase', alert 3; 1.6 sn sonra 'chase', alert 3. Koşu 1-B (iskelet): stun(1.7) + 5 hasar → 'hit' → 0.6 sn sonra 'chase', alert 3 kalıcı.
- Kök neden: Tepki seçimi mevcut 'stunned' durumunu ve kalan stunT'yi hesaba katmıyor; alert sıfırlama yalnız 'stunned' dalının doğal bitişinde.
- Yeniden üretme: e=DK.enemies.spawn('iskelet',...); e.target=...; e._setState('chase'); e.stun(1.7,'parry'); e.hurt(5,{kind:'melee',pos:p.pos,by:DK.G.myId}) → e.state==='hit'; DK.sim(0.6) → 'chase', e.alert===3.
- Önerilen düzeltme: applyDamage'da `if (this.state === 'stunned') { /* sersemlik sürsün */ this.char.play('HitRecieve', ...) ; return; }` benzeri erken çıkış (counter/heavy için mevcut stun uzatması kalsın); _setState içinde önceki durum 'stunned' ise `this.alert = 0`; guard-break'te stun'dan sonra 'hit'e geçilmesin.
- Statik mercek: enemies.js:397-406 tepki dalı: `heavyHit = heavy||counter||finisher; if (info.counter || (heavyHit && !poise && !boss)) stun(...) else if (state !== 'attack' || !poise) { if (!(boss && state === 'attack' && rand < 0.7)) { _setState('hit'); ... } }` — 'stunned' dışlanmıyor. Parry → player.js:181 `attacker.stun(1.7, 'parry')` → enemies.js:441-443 state='stunned', alert=3. Sonraki hafif vuruş :380 `if (this.state === 'stunned') dmg *= 1.25` sonra :401 `_setState('hit')` → :799 `case 'hit': if (this.stateT > 0.45) this._setState('chase')`. :796 `if (this.stunT <= 0) { this.alert = 0; ... }` hiç çalışmaz; alert=3 → _updateHud :319-321 's' simgesi döner; alert'i sıfırlayan yerler (:607 yalnız alert===2, :673/:675/:678 investigate/return/patrol, :454 die) chase/attack sırasında tetiklenmez. Guard-break: hurt :340 `stun(1.3, 'guardbreak'); dmg *= 0.6` ardından :359 applyDamage(heavy=true) → haydut_agir poise → stun yok → :401 'hit' → fiilen 0.45 sn. Poise'siz kalkanlılarda (iskelet_altin) :398 stun(1.0) ile 1.3 sn stun 1.0'a kısalır.

### F-04 — Co-op: konuk vuruşlarında kalkan/kaçınma/dokunulmazlık kararı asimetrik — konukta bayat durumla yerel zar, ev sahibinde hiç kontrol yok
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:354` · **Güven:** 0.9
- Kod: `if (!G.isHost && G.online) {   G.emit('netHurtEnemy', { id: this.id, dmg, ... });   return null; }  // net.js:237: case 'hurtEnemy': ... e.applyDamage(m.dmg, {...})`
- Açıklama: Konukta hurt() önce _canBlock/_dodge'u konuk-yerel state/awareness/yaw ile çalıştırır; konuk tarafında update() hiç çalışmadığından state 'patrol'da kalır, ancak konuğun kendi 'noise' olayı (adım/tabanca) hear() ile durumu 'suspicious/investigate' yapar ve _aggro ile 'chase'e sabitler → sonraki vuruşlar %85 (haydut_agir) olasılıkla yerelde 'blocked' sayılıp ev sahibine hiç gönderilmez; düşman ev sahibinde sersemlemiş ya da arkası dönük olsa bile. Ev sahibi ise 'hurtEnemy' mesajını doğrudan applyDamage ile uygular: kalkan/parry zarı, kaçınma, rise ve phased dokunulmazlığı (337) atlanır → konuk dirilen iskelete ve görünmez hayalete hasar verir, kalkan hiç bloklamaz. Koşu 2-G2: noise öncesi hurt → null/sent 1; noise sonrası state 'suspicious', iki hurt → 'blocked','blocked', sent 1 (gönderilmedi), state 'chase', stateT 0.
- Kök neden: Karar mantığı iki uçta farklı yerlerde ve farklı veriyle çalışıyor; ev sahibi hurt() yerine applyDamage() çağırıyor.
- Yeniden üretme: Sayfada G.online=true,G.isHost=false; enemies.applySnapshot([[id,'haydut_agir',x,y,z,yaw(oyuncuya),'Idle',250,1,0,0,250]]); enemies.update×60; G.emit('noise',{x,y,z,radius:6,kind:'step'}); Math.random=()=>0; e.hurt(10,{kind:'melee',pos:p.pos,by:G.myId}) → 'blocked', netHurtEnemy sayacı artmaz.
- Önerilen düzeltme: Konukta: online ve konuksa blok/kaçınma kontrollerini atlayıp her vuruşu gönder (yalnız yerel efekt). Ev sahibinde 'hurtEnemy' için `e.hurt(m.dmg, {...})` çağır (block/dodge/rise/phased dahil) ve sonucu ('blocked'/'dodged'/'hit') konuğa `hitResult` mesajıyla geri bildir; hear() konukta çalışmasın (G.isHost || !G.online şartı).
- Statik mercek: Konuk: hurt :339 `_canBlock(info)` ve :350 dodge, konuk-yerel state/awareness/yaw ile; :354-358 ancak bunlardan sonra netHurtEnemy gönderir. Konukta e.update() çalışmaz (enemies.js:1570 `if (G.isHost || !G.online) e.update(edt); else this._interp(e, edt)`), fakat :1281 `G.on('noise', (e) => { for (const en of this.list) en.hear(e); })` her uçta kayıtlı ve combat.js:157 (_attack → noise 9 m), :89 (adım), :245 (tabanca) konukta da emit eder → hear :576-581 awareness ≥ 0.45, state 'suspicious/investigate' → _canBlock :365-366 engeli kalkar (yalnız `state === 'patrol' && awareness < 0.5` dışlanır), yaw :1591 ile ev sahibinin gerçek yaw'ı → :370 `Math.random() < 0.85` → 'blocked', mesaj gitmez; :345 _aggro → _setState('chase') konukta kalıcı (interp state'e dokunmaz) ve _groupAlert diğer kopyaları da 'investigate' yapar. Kılıç savurma sesi vuruştan önce geldiği için ilk vuruş bile yerelde bloklanabilir. Ev sahibi: net.js:237 `case 'hurtEnemy': ... e.applyDamage(m.dmg, {...})` → hurt()'ün :337 `rise || phased` ve :339/:350 blok/kaçınma kontrolleri atlanır (applyDamage yalnız :374 `!this.alive`); phased :622 ve rise :1195-1197 (alive=true, state 'rise') sırasında konuk hasarı işlenir.

### F-05 — Boss çağırma (summon) ve yardım çağrısı (callHelp) hazırlığı vuruşla iptal oluyor; dalga kalıcı olarak kaybediliyor
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:423` · **Güven:** 0.95
- Kod: `this.summoned++; this._setState('summon');  // 767: if (this.stateT > 0.9 && !this.sumDone) {...spawn...}  // 399-401: applyDamage → _setState('hit')`
- Açıklama: _phaseCheck summonAt eşiğinde summoned'ı artırıp 0.9 sn'lik hazırlık durumuna geçer; dalga 0.9 sn'de doğar. Oyuncu zaten saldırıyor olduğundan (eşiği tetikleyen vuruş) sonraki hafif vuruş applyDamage'daki tepki dalında durumu 'hit' yapar (boss %70 direnci yalnız 'attack' durumunda) → sumDone false kalır, dalga hiç doğmaz, summoned zaten artmış olduğundan bir sonraki eşiğe kadar tekrar denenmez. Aynı delik callHelp için: calledHelp=true 658'de set edilir, helpDone 0.25 sn'de; ilk 0.25 sn'de vuruş → yardım hiç çağrılmaz. Koşu 2: iskelet_kaptan hp %67 → 20 hasar → 'summon', summoned 1; 0.3 sn sonra 5 hasar → 'hit'; 3 sn sonra yeni düşman 0, sumDone false.
- Kök neden: Evre sayaçları eylem gerçekleşmeden artırılıyor; 'summon'/'callHelp' durumları vuruş tepkisinden korunmuyor.
- Yeniden üretme: e=DK.enemies.spawn('iskelet_kaptan',...); e.hp=e.maxHp*0.67; e.applyDamage(20,{pos:p.pos}); DK.sim(0.3); e.applyDamage(5,{pos:p.pos}); DK.sim(3) → DK.enemies.list.length değişmez, e.summoned===1.
- Önerilen düzeltme: applyDamage tepki dalında `['summon','callHelp'].includes(this.state)` ise durum değiştirme (yalnız üst gövde HitRecieve); ya da summoned++/calledHelp=true atamalarını dalga doğduğu/alarm verildiği ana taşı.
- Statik mercek: enemies.js:422-424 `if (T.summonAt && this.summoned < T.summonAt.length && f < T.summonAt[this.summoned]) { this.summoned++; this._setState('summon'); ... }` sayaç eşik anında artar. Dalga :767 `if (this.stateT > 0.9 && !this.sumDone)`. Araya giren hafif vuruş :399-401: state 'summon' ≠ 'attack' → `!(this.T.boss && this.state === 'attack' && ...)` true → `_setState('hit')` → :799 0.45 sn sonra 'chase'; sumDone false kalır, :776 sıfırlama/tired de çalışmaz; :422 `summoned < length && f < summonAt[summoned]` bir sonraki eşiğe kadar false. callHelp: :658 `this.calledHelp = true; this._setState('callHelp')`, :757 `stateT > 0.25 && !this.helpDone` → ilk 0.25 sn'de vuruş 'hit' → helpDone hiç set edilmez; _aggro :415 listesi 'callHelp' içermediği için grup uyarısı da verilmez. Boss %70 direnci (:400) yalnız 'attack' durumunda geçerli. Boss savaşında oyuncu sürekli zincir vurduğu (SWORD_MOVES dur 0.66) için 0.9 sn penceresine vuruş düşmesi çok olası.

### F-06 — Co-op: konuklar düşman mermilerini, yaylı atış iniş işaretlerini ve telgraf halkalarını görmüyor; hasar uyarısız geliyor
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1607` · **Güven:** 0.9
- Kod: `netSnapshot() { return this.list.filter((e) => !e.removed).map((e) => e.net()); },  // shots, _ring, lob marker yok; bosses.js telegraph/wave/markers yalnız host update'te`
- Açıklama: Mermiler (enemies.shots) yalnız ev sahibinde _fire/lob ile oluşur ve snapshot'a girmez; Enemy._ring yalnız host _attackUpdate'te oluşur; GiantBase.telegraph, VolcanicGiant.wave ve Kraken markers yalnız host update yollarında görünür hale gelir (clientUpdate'te asla). Konuk yalnız netHurtPlayer ile 20-38 hasar alır: kırmızı halkayı, kayayı/lav topunu/zehiri göremez, dolayısıyla engellenemez saldırıdan kaçamaz; ok/bıçak savuşturma (_updateShots içindeki pl.blocking kontrolü) konuk için fiziksel olarak imkânsız. Koşu 1-F'de konuk Kraken'inde görünür işaret 0.
- Kök neden: Görsel/uyarı nesneleri simülasyonla aynı yerde (host) yaratılıyor, ağ modeline dahil edilmemiş.
- Yeniden üretme: İki sekmeli co-op: ev sahibi haydut_nisanci'ya ateş ettirir; konuk sekmesinde DK.enemies.shots.length === 0 iken konuk hp düşer.
- Önerilen düzeltme: Snapshot'a kompakt mermi listesi ([id,kind,x,y,z,vx,vy,vz]) ve aktif telgraflar ([x,z,r,f]) ekle; konukta _updateShots'ı görsel modda çalıştır (isabet yok); lob() işaretlerini 'netHazard' benzeri bir mesajla yansıt; boss netExtra'ya telegraph {x,z,r,t} ekle ve clientUpdate'te ringA'yı göster.
- Statik mercek: enemies.shots yalnız enemies.shoot/lob ile dolar; çağıranlar _fire :1057 (host-only e.update yolu), bosses.js:480/:723/:801/:831/:978 (hepsi `host &&`, `!G.online || G.isHost` koşullu ya da yalnız host update yolunda). netSnapshot :1607 yalnız e.net() (:1220: id, type, pos, yaw, anim, hp, alive, upper, alert, maxHp) — mermi yok. _ring yalnız _telegraph :917 (← _startMelee :912, host). GiantBase.telegraph :581 yalnız host update'te (:699/:706/:713/:840/:859); clientUpdate :607-615 yalnız pos/yaw/anim. VolcanicGiant.wave :842 host 'slam'. Kraken markers :311 host rise dalı. Konuğa hasar net.js:132 → :410 'hurt' ile menzilli için `melee: 0` gelir → player.js:130 `opts.melee` şartı → blok/parry imkânsız; _updateShots :1474 savuşturma `t.id === G.myId && pl.blocking` → uzak oyuncu için hiç çalışmaz (RemotePlayer.blocking yok).

### F-07 — Kamp yenilenme bekleme süresi devre dışı: cesetler listeden silinince allDead=false → anında yeniden doğma; groupState kaydı geri yüklenmiyor
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1532` · **Güven:** 0.85
- Kod: `const allDead = mine.length && mine.every((e) => !e.alive); ... st.cooldown = allDead ? gr.respawn : 0;  // 1207: if (this.stateT > 24) this.remove = true;  1290: start() { ... this.groupState = {}; }`
- Açıklama: Ölen düşman 24 sn sonra remove → dispose ve listeden çıkar. Oyuncu kampı temizledikten en az 24 sn sonra 220 m uzaklaşırsa `mine` boş → allDead 0 (falsy) → cooldown 0 → 140 m'ye dönüşte tüm grup anında yeniden doğar (respawn 240-420 sn tasarımı sadece oyuncu cesetler dururken uzaklaşırsa işler). Kısmen temizlenmiş grupta da kalanlar yaşıyorsa cooldown 0 ve öldürülenler dahil tam grup geri gelir. Ganimet/XP çiftliği (haydut_kaptani 120-220 altın). Ayrıca save() groupState yazıyor ama start() hiç parametre almıyor → kayıt yüklendiğinde cooldown ve spawned bilgisi sıfırlanır. Koşu 2: temizlenmiş kamp, gemiye gidip (uzak) dönüşte 5 düşmanla anında doğdu (list 8 = 5 + 3 Amiral tayfası).
- Kök neden: 'Hepsi öldü' kararı canlı liste üyeliğine bağlı; ölüm sayısı grup durumunda tutulmuyor; start(data) uygulanmamış.
- Yeniden üretme: Kampı temizle, 30 sn bekle (cesetler silinir), 230 m uzaklaş ve geri dön → aynı grup anında yeniden doğar; DK.enemies.save() → start() çağrısı veriyi yok sayar (start.length===0).
- Önerilen düzeltme: groupState'e `killed` sayacı ekle (die() içinde this.group varsa st.killed++); far temizliğinde `cooldown = killed >= gr.list.length ? gr.respawn : 0` ve kısmi ölümde yalnız yaşayanları yeniden doğur; start(data) içinde `this.groupState = data?.enemies?.groups || {}` (cooldown'u kaydedilen zamana göre azalt).
- Statik mercek: enemies.js:1205-1207 ceset `if (this.stateT > 24) this.remove = true` → :1579-1581 dispose + listeden çıkar (hayaletler :1184-1187 fadeOut ile ~1.5 sn'de). _populate :1531-1536 `const mine = this.list.filter((e) => e.group === gr.id); const allDead = mine.length && mine.every((e) => !e.alive); ... st.cooldown = allDead ? gr.respawn : 0` → mine boşsa allDead=0 → cooldown 0; :1520 `near && !st.spawned && st.cooldown <= 0` → tam grup yeniden doğar. Kısmi temizlikte every() false → yine 0. 220 m uzaklaşma (koşu 4.4 m/s ≈ 50 sn, depar 7 m/s ≈ 31 sn) 24 sn'den uzun → tipik durum. Kayıt: save() :1620 `{ groups: this.groupState }`; start() :1290 parametresiz ve :1297 `this.groupState = {}`; game.js:137 `s.start(data, opts)` veriyi geçiyor ama enemies kullanmıyor.

### F-08 — AI LOD adımı (0.25 sn) kovalayan düşmanı ince duvardan geçiriyor; LOD mesafesi yalnız ev sahibi oyuncuya göre
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1567` · **Güven:** 0.9
- Kod: `const d = p ? Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) : 0; ... const step = d > 90 ? 0.25 : d > 45 ? 0.066 : 0;`
- Açıklama: Ev sahibinden 90 m uzak ama bir konuğun yanında savaşan düşman 4 Hz güncellenir: koşu hızı 4.3-4.9 m/s × 0.25 = 1.1-1.4 m'lik adımlarla physics.resolve tek seferde çağrılır; merkez ince kutunun orta çizgisini aştığında en yakın kenara (öbür tarafa) itilir → duvar/çit/bina duvarı delinir. Vuruş zamanlaması da 0.25 sn kuantize olur. Koşu 2: 0.3 m kalınlık duvar, e.update(0.25)×60 → geçti (minS -3.36, maxStep 1.44 m, oyuncuya 1.7 m); dt=1/30'da geçemedi.
- Kök neden: LOD seçiminde uzak oyuncular yok; büyük dt için alt-adımlama yok.
- Yeniden üretme: Oyuncunun önüne physics.addBox(x,z,6,0.3,yaw) duvarı, 3 m ötesine haydut (chase, target); for(60) e.update(0.25) → duvarın arkasına geçer.
- Önerilen düzeltme: d'yi G.player ve tüm G.remotes üzerinden en küçük mesafe olarak hesapla; hedefi olan düşmanı LOD'dan muaf tut; edt > 0.1 ise _move/_place'i 0.05-0.1 sn alt adımlarla çalıştır ya da adım başına yer değiştirmeyi radius ile sınırla.
- Statik mercek: enemies.js:1565-1569 `const d = p ? Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) : 0; ... const step = d > 90 ? 0.25 : d > 45 ? 0.066 : 0; ... const edt = e._lodAcc` → G.remotes dikkate alınmaz. _move :1110-1112 tek adımda `pos += vel*dt` sonra `physics.resolve`. physics.js:119-134 kutu dalı: merkez kutunun dışında ve `d >= radius` ise `continue` (çarpışma yok), içindeyse :126-130 en yakın kenara iter. hw=3, hd=0.15, radius 0.42, 4.3 m/s kopya simülasyonu: dt=0.25 → 1.07 m adım, 4 adımda duvarın öbür yanına (z=+1.65) geçti; dt=0.066 ve 1/30 → z=-0.57'de tutuldu. Solo oyunda hedefi olan düşman ev sahibinden 90 m uzak olamaz (görüş ≤ 40, tasma :677 homeR+45) → yalnız konuk yanında savaşan uzak düşmanlarda. Vuruş anı :950 `t >= this.atkHit[this.hitIdx]` 0.25 sn kuantize olur.

### A3 — 'Su kalitesi' ayarı hiçbir kodda okunmuyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/settings.js:9` · **Güven:** 1
- Kod: `renderScale: 1, quality: 'high', fpsLimit: 0, vsync: true, viewDistance: 1, shadows: 'high', water: 'high', effects: 'high', fov: 70,`
- Açıklama: settingsPanel.js:40 'Su kalitesi' seçeneğini sunar ve 'yeniden başlatınca uygulanır' der; `settings.v.water` js/ altında yalnız settings.js ve settingsPanel.js'te geçer. Okyanus çözünürlüğü ocean.js:55'te boot `quality` parametresinden gelir.
- Kök neden: Ayar tanımlanmış, tüketicisi yazılmamış.
- Yeniden üretme: Koşu r1: water='low' + settings.apply → ocean.mesh köşe sayısı 90000 → 90000.
- Önerilen düzeltme: ocean.build(scene, settings.v.water) ile çağır (main.js:105 → game.buildWorld içinde) ya da ayarı panelden kaldır.
- Statik mercek: `settings.v.water` js/ altında yalnız settings.js:11 ve settingsPanel.js:40'ta geçiyor; `.water` alanının diğer tüm kullanımları geminin su seviyesi (ship.js, hud.js, net.js, events.js…). Okyanus çözünürlüğü js/world/ocean.js:54-55 `build(scene, quality)` → res 160/220/300, parametre main.js:104-105 → game.buildWorld(q) → game.js:43 ile açılıştaki `settings.v.quality`'den geliyor. Çalıştırma r1: water='low' + settings.apply → okyanus köşe sayısı 90000 → 90000. İşlevsiz ayar; oyun bozulmuyor, bu yüzden önem 'orta' yerine 'dusuk'.

### A4 — 'Gölge kalitesi' Orta ile Yüksek aynı; yalnız Kapalı etkili
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/settings.js:46` · **Güven:** 1
- Kod: `engine.renderer.shadowMap.enabled = v.shadows !== 'off';`
- Açıklama: Gölge haritası boyutu sky.js:138-139'da yalnız açılış `quality` değerinden belirlenir (`quality === 'high' ? 2048 : 1024`); settings.v.shadows seviyesi hiçbir yerde haritaya/kameraya yansımaz.
- Kök neden: Ayar seviyesi gölge parametrelerine bağlanmamış.
- Yeniden üretme: Koşu r1: shadows high→mapSize 2048, medium→2048, off→shadowMap.enabled=false.
- Önerilen düzeltme: settings.apply içinde sky.sun.shadow.mapSize'ı seviyeye göre ayarla (map.dispose() + needsUpdate) ya da seçenekleri 'Kapalı/Açık'a indir.
- Statik mercek: js/core/settings.js:46 yalnız `shadowMap.enabled = v.shadows !== 'off'`; js/world/sky.js:137-139 `castShadow = quality !== 'low'`, `sm = quality === 'high' ? 2048 : 1024` — açılış kalitesinden, seviye ayarından bağımsız; grep 'shadows' başka tüketici yok. Çalıştırma r1: shadows='medium' → sun.shadow.mapSize 2048, enabled=true. Ek not: 'Kapalı' bile oyun içinde yalnız kısmen etkili — bkz. ek bulgu 'gölge ayarı materyal programlarını yenilemiyor' (derlenmiş materyaller USE_SHADOWMAP tanımını koruyor, gölgeler donmuş kalıyor). Önem: işlevsiz/eksik ayar → 'dusuk'.

### A5 — Düşman kamp durumu kaydediliyor ama start() yüklemiyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/game/enemies.js:1289` · **Güven:** 0.9
- Kod: `start() {     ...     this.groupState = {};`
- Açıklama: enemies.save() (enemies.js:1620) `{ groups: this.groupState }` döndürür ve saveKey 'enemies' ile kayda girer (koşu r1'de kayıt anahtarları arasında 'enemies' var). start() parametre almaz ve groupState'i boşaltır; temizlenen kampların yeniden doğma bekleme süresi (gr.respawn, :1536) yüklemede kaybolur, kamplar anında dolu gelir.
- Kök neden: save() eklenmiş, karşılığı start(data) yazılmamış.
- Yeniden üretme: Statik: enemies.js:1620 save vs 1289-1299 start; koşu r1 kayıt anahtarları: [... 'enemies' ...].
- Önerilen düzeltme: start(data) { ... this.groupState = { ...(data?.enemies?.groups || {}) }; } (cooldown değerleri zaman damgası yerine saniye ise olduğu gibi alınabilir).
- Statik mercek: js/game/enemies.js:1290-1300 start() parametre almıyor ve `this.groupState = {}` yapıyor; save() :1620 `{ groups: this.groupState }` döndürüyor; game.js:137 `s.start(data, opts)` veriyi geçiriyor ama kullanılmıyor. _populate (:1516) durumu tembel biçimde `{spawned:false, cooldown:0}` ile yeniden yaratıyor; :1536'daki yeniden doğma beklemesi kaybolup kamplar yaklaşınca anında doluyor. Çalıştırma r1: kayıtta enemies.groups.kamp.cooldown=250 → yüklemeden 1.3 s sonra groupState.kamp = {spawned:false, cooldown:-1.3} (250 geri gelmedi). Etki en fazla ~300 s beklemenin kaybı (gr.respawn 200-300) → önem 'dusuk'.

### A6 — Tek bir GLB yüklenemezse oyun hiç açılmıyor (ya hep ya hiç yükleme)
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/assets.js:30` · **Güven:** 0.9
- Kod: `await Promise.all([kkJob, ...MODEL_LIST.map(async (name) => {       const gltf = await loader.loadAsync(`${this.base}assets/models/${name}.glb`);`
- Açıklama: 53 model + 15 KayKit dosyasından herhangi biri 404/ağ hatası verirse Promise.all reddeder, main.js:100 fırlatır ve boot catch (main.js:379-383) 'Oyun başlatılamadı: <teknik mesaj>' gösterir. Yeniden deneme, yer tutucu geometri veya 'bu model eksik' uyarısı yok; dekoratif bir model (örn. flower_red) için bile oyun açılmaz. Ses dosyaları ise tek tek yakalanır (audio.js:28-32).
- Kök neden: Hata toleransı tasarlanmamış; loadAsync hataları yakalanmıyor.
- Yeniden üretme: Statik: assets.js:30-43, kk.js:66-71, main.js:100, 379-383.
- Önerilen düzeltme: Promise.allSettled kullan; başarısız modeller için 1-2 yeniden deneme, sonra basit kutu/boş Group yer tutucusu ve G.notify uyarısı; kritik olanlar (kk karakterleri) için anlamlı hata mesajı.
- Statik mercek: Statik: js/core/assets.js:30-43 `Promise.all([kkJob, ...MODEL_LIST.map(async … loader.loadAsync(…))])` try/catch'siz; js/core/kk.js:66-71 aynı biçimde 15 dosya için Promise.all; main.js:100 `await assets.loadAll(…)`; tek yakalayıcı main.js:379-383 'Oyun başlatılamadı: <e.message>'. GLTFLoader/FileLoader 200 dışı yanıtta reddediyor; yeniden deneme, yer tutucu ya da kritik/dekoratif ayrımı yok (iddia doğru). Ancak sağlam bir dağıtımda model eksikliği zaten bir dağıtım hatasıdır; bu bir 'gelistirilmeli' dayanıklılık eksiği, bozuk davranış değil → önem 'dusuk'. Çalıştırma yapılmadı (statik kanıt yeterli).

### A7 — Konuk XP/yetenek ilerlemesi sekme kapanışında/odak kaybında kaydedilmiyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/main.js:199` · **Güven:** 0.85
- Kod: `if (!G.isHost) {       // konuk: kişisel envanteri yerel olarak sakla       save.write('guest', 0, { inv: G.player.inv.toJSON(), savedAt: Date.now(), name: G.playerName });`
- Açıklama: Konuk için saveNow yalnız envanteri yazar. progress.js:86 `G.on('autosave', () => this._guestSave())` dinler ama 'autosave' olayı yalnız ev sahibinde yayınlanır (game.js:204 `&& G.isHost`); beforeunload/visibilitychange (main.js:373-376) saveNow'a gider ve progress'e dokunmaz. Konuk ilerlemesi yalnız progress.stop() (menüye dönüş, hostLeft) ile kalıcı olur; tarayıcı kapanışı/çökme XP ve yetenek puanlarını siler.
- Kök neden: Konuk kayıt yolu iki ayrı mekanizmaya bölünmüş ve tetikleyicileri uyumsuz.
- Yeniden üretme: Statik: game.js:204, progress.js:86-103, main.js:197-204, 373-376.
- Önerilen düzeltme: saveNow'ın konuk dalında progress._guestSave() çağır (ya da game.update'te konuk için de 'autosave' yayınla ve saveNow zaten konuk dalına giriyor).
- Statik mercek: Mekanizma doğru: main.js:199-203 konuk dalı yalnız envanteri yazıyor; game.js:204 'autosave' yalnız `G.isHost` iken yayınlanıyor → progress.js:87 dinleyicisi konukta hiç tetiklenmiyor; beforeunload/visibilitychange (main.js:373-376) saveNow'a gidip progress'e dokunmuyor. ANCAK etki abartılı: progress._guestSave() seviye atlamada (progress.js:131, points++ sonrasında), yetenek öğrenmede (:142) ve stop()'ta (:101) hemen çalışıyor; yani seviye, yetenek puanı ve öğrenilen yetenekler anında kalıcı. Kaybolan yalnız son seviye atlamadan bu yana biriken XP ve 'seen' (yeni canlı) listesi. 'XP ve yetenek puanlarını siler' ifadesi yetenek puanları için yanlış → önem 'dusuk'.

### A8 — Ölüyken yapılan kayıt 0 HP saklıyor; yüklemede oyuncu 1 HP ile 'canlı' başlıyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/game/game.js:161` · **Güven:** 0.95
- Kod: `pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, hp: p.hp, inv: p.inv.toJSON(),`
- Açıklama: Ölüm ekranı (menu.js:360-368) G.state'i değiştirmez; game.update çalışmaya devam eder ve 120 s otomatik kayıt, visibilitychange ve beforeunload tetikleyicileri ölü oyuncuyu hp=0 ve ölüm konumuyla kaydeder. Yüklemede `p.hp = data.player.hp ?? 100` (game.js:123) → oyuncu dead=false, 1 HP ile ölüm noktasında (düşman kampı olabilir) doğar.
- Kök neden: serialize ölü/baygın durumunu dikkate almıyor; ölüm ekranı sırasında kayıt engellenmiyor.
- Yeniden üretme: Koşu r1: p.die() → saveNow → kayıtta player.hp=0 → yükleme → hp=1, dead=false, 2 s sonra hp=1.
- Önerilen düzeltme: saveNow'da p.dead/p.downed ise kaydı atla ya da hp=maxHp*0.5 ve en yakın liman/gemi konumuyla kaydet.
- Statik mercek: js/ui/menu.js:360-366 deathScreen G.state'e dokunmuyor; main.js:198 saveNow yalnız `G.state !== 'playing'` kontrolü yapıyor; game.js:203-204 otomatik kayıt ve main.js:373-376 tetikleyicileri ölüyken de çalışıyor. Gerçek ölüm yolu player.js:170 `this.hp = 0; this.die(...)` → kayıtta hp=0 (zehirde :309 hafif negatif). Yüklemede game.js:123 `p.hp = 0`, dead=false; ardından progress.start → recompute (progress.js:152-154) `Math.max(1, …)` → hp=1; konum ölüm noktası (game.js:161; lastSafe yalnız 'swim' modunda). Çalıştırma r1: p.die() sonrası dead=true, G.state 'playing', ölüm paneli açıkken DK.sim(2) playTime +2.0; saveNow başarılı; yükleme → dead=false, aynı noktada canlı (testte die() doğrudan çağrıldığı için hp 0'a düşmedi; damage() yolu hp=0 verir).

### A9 — Panel kapatma tuşları sabit kodlu; tuş yeniden atamasıyla uyumsuz
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/ui/panels.js:80` · **Güven:** 1
- Kod: `ui.open(ui.panel('Envanter — Korsan Çantası', body), { kind: 'inv', closeKeys: ['Tab'], ... });`
- Açıklama: ui.js:17 closeKeys dizisini e.code ile karşılaştırır; panels.js:80 'Tab', journal.js:188 'KeyJ', skills.js:45 'KeyK', panels.js:507 'KeyM' sabit. Oyuncu envanteri başka tuşa atarsa panel yeni tuşla açılır ama aynı tuşla kapanmaz (yalnız Esc veya eski varsayılan tuş).
- Kök neden: closeKeys input.bindings yerine varsayılan kodları kullanıyor.
- Yeniden üretme: Koşu r1: bindings.envanter='KeyI' → DK.tap('KeyI') panel açıldı; keydown KeyI → açık kaldı; keydown Tab → kapandı.
- Önerilen düzeltme: closeKeys: [input.bindings.envanter] vb. (ya da ui.open'a eylem adı verip ui.js'te bindings'e bakmak).
- Statik mercek: js/ui/ui.js:17 `top.closeKeys.includes(e.code)` ile e.code karşılaştırıyor; sabit kodlar: js/ui/panels.js:80 ['Tab'], panels.js:507 ['KeyM'], js/ui/journal.js:188 ['KeyJ'], js/ui/skills.js:45 ['KeyK']; input.bindings'e bakılmıyor. Panel açıkken game.js:181 `!G.uiOpen` nedeniyle yeni tuşla kapatma da olmuyor. Çalıştırma r1: bindings.envanter='KeyI' → openInventory ile panel açıldı; keydown KeyI → açık kaldı; keydown Tab → kapandı.

### A10 — Fare düğmeleri ayar panelinden yeniden atanamıyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/input.js:63` · **Güven:** 0.8
- Kod: `canvas.addEventListener('mousedown', (e) => {       if (this.captureNext) { const f = this.captureNext; this.captureNext = null; f('Mouse' + e.button); return; }`
- Açıklama: captureNext için fare yakalama yalnız canvas mousedown'ında yapılır. Ayar paneli #modal içinde açılır ve #modal tam ekran arka plana sahiptir (style.css:101, pointer-events kapatılmamış) → panel açıkken canvas hiç mousedown almaz. settingsPanel.js:51 'yeni tuşa ya da fare düğmesine bas' der; saldırı/nişan atamaları fareye geri döndürülemez.
- Kök neden: Yakalama dinleyicisi modal katmanının altındaki öğeye bağlı.
- Yeniden üretme: Statik: input.js:63-64, style.css:101, settingsPanel.js:51-60.
- Önerilen düzeltme: captureNext aktifken window düzeyinde (capture fazında) mousedown dinle ve preventDefault et; ya da panel satırına özel bir yakalama alanı ekle.
- Statik mercek: js/core/input.js:63-64 fare yakalaması yalnız canvas 'mousedown'ında; captureNext'i tüketen başka fare dinleyicisi yok (grep captureNext: input.js:53,64, ui.js:18, settingsPanel.js:51). #modal (css/style.css:40-41 `.screen{position:fixed;inset:0}`, :101 z-index 40, arka plan dolu) yalnız `.clear` sınıfında pointer-events kapatıyor (:102); Ayarlar paneli `clear` olmadan açılıyor (settingsPanel.js:89) → canvas kardeş öğe olduğu için tıklama ona ulaşmıyor. Çalıştırma r1: duraklat → Ayarlar → Kontroller → 'W' düğmesi (captureNext=function) → Playwright gerçek tıklama (10,10) → captureNext hâlâ function (yakalama olmadı).

### A11 — 'Görüş mesafesi' ayarı yalnız kamera far düzlemini değiştiriyor; pratik etkisi yok
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/settings.js:47` · **Güven:** 0.9
- Kod: `engine.camera.far = 1500 + 3500 * v.viewDistance;`
- Açıklama: FogExp2 yoğunluğu en az 0,0011 (sky.js:359) → 2500 m'de görünürlük exp(-(0,0011·2500)²)≈0,0005, yani %30 ayarındaki 2550 m far düzlemi zaten tamamen sisli bölgeyi kırpar. Arazi akış yarıçapı (terrain.js:186-259), LOD (terrain.js:156) ve bitki yoğunluğu bu ayara bağlı değil; dolayısıyla düşük donanım için vaat edilen kazanç gerçekleşmez (docs/12_PERFORMANS_RAPORU.md:32 ve TEST_RAPORU.md:212 ayarı performans aracı olarak sunuyor).
- Kök neden: Ayar yalnız kamera parametresine bağlanmış; akış/sis/LOD ile ilişkilendirilmemiş.
- Yeniden üretme: Koşu r1: viewDistance 1→0,3: far 5000→2550, arazi karoları 129→129, sis 0,0011.
- Önerilen düzeltme: viewDistance'ı terrain akış yarıçapı ve sis yoğunluğuna (ve isteğe bağlı props yoğunluğuna) bağla; far düzlemini sis mesafesinden türet.
- Statik mercek: js/core/settings.js:47 yalnız `camera.far = 1500 + 3500*v.viewDistance`. Sis: js/world/sky.js:359 density ≥ 0.0011 → FogExp2 2550 m'de exp(-(0.0011·2550)²) ≈ 4·10⁻⁴, yani %30 ayarındaki far düzlemi zaten tamamen sisli bölgeyi kesiyor. Arazi akış/LOD mesafeleri sabit (terrain.js:14-19: 380/950/1750/2700 × terrain.js:156 lodScale, açılış kalitesinden) ve viewDistance'a bağlı değil. Gök kubbe (sky.js:72 yarıçap 4000) far düzleminden etkilenmiyor çünkü vertex shader `gl_Position.z = gl_Position.w` (sky.js:89) — yani ayar zararsız ama etkisiz. Çalıştırma r1: viewDistance 1→0.3: far 5000→2550, arazi karoları 129→129, sis 0.0011.

### A12 — V-Sync ayarı ölü kod; iki dal da aynı değeri atıyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/settings.js:44` · **Güven:** 1
- Kod: `engine.fpsLimit = v.vsync ? (v.fpsLimit || 0) : (v.fpsLimit || 0);`
- Açıklama: Kutucuk kaydedilir ama davranışı etkilemez. Panel notu tarayıcıda her zaman açık olduğunu söylüyor; buna rağmen seçenek etkileşimli ve kafa karıştırıcı.
- Kök neden: Masaüstü sürüm için ayrılmış alan, uygulanmamış.
- Yeniden üretme: Koşu r1: vsync=false/true → engine.fpsLimit 30/30.
- Önerilen düzeltme: Seçeneği devre dışı/bilgilendirme olarak göster ya da kaldır; ifadeyi `engine.fpsLimit = v.fpsLimit || 0` yap.
- Statik mercek: js/core/settings.js:44 `engine.fpsLimit = v.vsync ? (v.fpsLimit || 0) : (v.fpsLimit || 0)` — iki dal birebir aynı; vsync başka yerde okunmuyor. Çalıştırma r1: fpsLimit=30 ile vsync=false/true → engine.fpsLimit 30/30.

### A13 — Dil ve Altyazı ayarları hiçbir yerde okunmuyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/ui/settingsPanel.js:67` · **Güven:** 1
- Kod: `row('Dil', select('language', [['tr', 'Türkçe'], ['en', 'English (menüler, beta)']]), 'Altyapı çoklu dile hazır; ilk sürüm Türkçe.'),`
- Açıklama: `settings.v.language` ve `settings.v.subtitles` js/ altında settings.js/settingsPanel.js dışında geçmiyor (grep 0). 'English (menüler, beta)' seçimi hiçbir menü metnini değiştirmez; altyazı kutucuğu diyalog metinlerini etkilemez.
- Kök neden: Uygulanmamış özellikler panelde canlı seçenek olarak sunulmuş.
- Yeniden üretme: Statik grep: settings.v.language / subtitles → yalnız settings.js:16 ve settingsPanel.js:67-68.
- Önerilen düzeltme: Seçenekleri kaldır ya da 'yakında' olarak devre dışı bırak; altyazı ayarını diyalog kutusu/NPC babble'a bağla.
- Statik mercek: grep 'language|subtitles' js/ → yalnız js/core/settings.js:17 (varsayılan) ve js/ui/settingsPanel.js:67-68 (panel satırları). Hiçbir metin/diyalog kodu bu değerleri okumuyor; 'English (menüler, beta)' seçimi hiçbir şeyi değiştirmiyor.

### A14 — Kayıt sürümü yazılıyor ama hiç okunmuyor; şema doğrulaması yok
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/game/game.js:156` · **Güven:** 0.9
- Kod: `version: 1,       savedAt: Date.now(),`
- Açıklama: save.read yalnız JSON.parse başarısını kontrol eder (save.js:32-38). Yarım/eski/elle düzenlenmiş kayıt geçerli yuva olarak listelenir (save.js:45-52), game.start `??`/`?.` ile sessizce varsayılanlara düşer; gelecekte alan anlamı değişirse göç mekanizması yok. İçe aktarma (save.js:75-80) da içeriği doğrulamaz.
- Kök neden: Sürüm alanı yalnız ileriye dönük yer tutucu olarak eklenmiş.
- Yeniden üretme: Koşu r1: dksh.solo.1='{"name":"x","savedAt":1}' → save.list → {slot:1,name:'x',savedAt:1} (geçerli yuva).
- Önerilen düzeltme: save.read sonrası `validate(d)`: version/player/ship zorunlu alanları kontrol et, eksikse yuvayı 'bozuk' göster; version<1 için migrate() iskeleti ekle.
- Statik mercek: js/core/save.js:32-38 read() yalnız JSON.parse başarısına bakıyor; list() 45-52 `d.name/d.savedAt` ile her ayrıştırılabilir nesneyi dolu yuva sayıyor; importAll 75-80 içerik doğrulamıyor; game.js:156 `version: 1` yazılıyor ama `.version` hiçbir yerde okunmuyor (grep 0). Çalıştırma r1: localStorage 'dksh.solo.1' = '{"name":"x","savedAt":1}' → save.list('solo')[1] = {slot:1, name:'x', savedAt:1} (geçerli yuva).

### A15 — Savaş müziği yarış durumu: ilk indirme sırasında mod değişirse çift kaynak ve sahipsiz döngü
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/audio.js:242` · **Güven:** 0.6
- Kod: `async _battle() {     const c = this.ctx;     if (!this.battleBuf) {       try {         const r = await fetch(`${this.base}assets/audio/music/battle_theme_a.mp3`);`
- Açıklama: setMusic('battle') → _battle() async; battleBuf gelmeden G.inCombat (combat.js:80, son vuruştan 6 s) düşüp yeniden yükselirse ikinci _battle() de fetch başlatır. İkisi de mode==='battle' görürse iki looping BufferSource başlar; this.battleSrc yalnız sonuncuyu tutar, ilki durdurulamaz (sonsuz savaş müziği).
- Kök neden: Yükleme Promise'i önbelleğe alınmıyor; 'oynatılıyor' durumu tekil değil.
- Yeniden üretme: Statik: audio.js:235-255; yavaş ağda ilk çatışmada inCombat'in iki kez değişmesi gerekir.
- Önerilen düzeltme: `this._battleLoad ??= fetch(...).then(decode)` ile tek Promise; başlatmadan önce battleSrc varsa durdur.
- Statik mercek: Statik: js/core/audio.js:242-255 `_battle()` battleBuf gelmeden tekrar çağrılabilir (yükleme Promise'i önbelleğe alınmıyor); her çağrı :250'de `mode === 'battle'` görürse yeni looping BufferSource başlatıp :254'te battleSrc'yi üzerine yazıyor → ilk kaynak sahipsiz kalıyor ve setMusic (:239) yalnız sonuncuyu durduruyor. Koşul: ilk indirme+decode sürerken G.inCombat'ın düşüp (combat.js:80: son vuruştan 6 s) yeniden yükselmesi; dosya 3.289.143 B (assets/audio/music/battle_theme_a.mp3) → yavaş ağda (≈1 Mb/s'de ~26 s) gerçekçi. Çalıştırmayla üretilmedi; kod yolu kesin, tetiklenme olasılığı düşük → 'dusuk', güven orta.

### A16 — Konuk ilerleme anahtarı 'dksh.' öneki taşımıyor; dışa/içe aktarma kapsamı dışında
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/game/progress.js:58` · **Güven:** 0.95
- Kod: `const GUEST_KEY = 'dk_progress_guest';`
- Açıklama: save.exportAll/importAll (save.js:70-80) yalnız 'dksh.' ile başlayan anahtarları taşır; konuk XP/yetenekleri yedeklenmez ve içe aktarılamaz.
- Kök neden: Ayrı modülde farklı anahtar kuralı.
- Yeniden üretme: Statik: progress.js:58 vs save.js:3,70-80.
- Önerilen düzeltme: GUEST_KEY = 'dksh.progress.guest' (bir kez eski anahtardan taşı).
- Statik mercek: js/game/progress.js:58 `GUEST_KEY = 'dk_progress_guest'`; js/core/save.js:3 `PREFIX = 'dksh.'`, exportAll/importAll (:70-80) yalnız bu önekle başlayan anahtarları taşıyor → konuk XP/yetenek kaydı yedeklenmiyor/içe aktarılamıyor.

### A17 — Kare hızına bağımlı küçük düzeltmeler ve alt adımsız Euler entegrasyonu
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/engine.js:61` · **Güven:** 0.8
- Kod: `let dt = this.timer.getDelta();       if (dt > 0.1) dt = 0.1;`
- Açıklama: Döngü değişken dt ile tek adım çalışır; sabit zaman adımı/alt adım yok (grep substep/accumulator: 0). Oyuncu/gemi/cisimler dt ile Euler entegrasyonu yapar (player.js:489 `vel.y += GRAV*dt`, :623; ship.js:362) — doğru ancak 10 FPS'te 0,1 s adımlarda ince çarpıştırıcılarda tünelleme riski. Kare başına sabit itmeler de var: player.js:500 `pos.x += n.x * 0.02` (dik yamaçta kayma 60 FPS'te 1,2 m/s, 10 FPS'te 0,2 m/s).
- Kök neden: Zaman adımı tasarımı değişken dt; bazı düzeltmeler dt ile çarpılmamış.
- Yeniden üretme: Statik kanıt; davranışı görmek için fpsLimit=10 ile dik yamaçta kayma hızı ve küçük cisimlerle çarpışma testi gerekir.
- Önerilen düzeltme: game.update'te 1/60 sabit adım + biriktirici (en fazla 3-4 alt adım), kalan süreyi kamera/animasyona ver; player.js:500 gibi itmeleri dt ile ölçekle.
- Statik mercek: Statik olgular doğru: js/core/engine.js:59-61 `timer.update(now); dt = getDelta(); if (dt > 0.1) dt = 0.1` — değişken dt, tek adım; biriktirici/alt adım yok (grep substep|accumulator|fixedStep: 0). js/player/player.js:489 `vel.y += GRAV*dt` ve :500 `pos.x += n.x * 0.02` (kare başına sabit itme, kare hızına bağlı), :623-625 Euler; js/ship/ship.js:362 Euler. THREE.Timer kullanımı doğru (three.core.js: update(timestamp) ms, getDelta() saniye). Tünelleme/kayma farkı iddiası çalıştırmayla gösterilmedi (DK.sim sabit 1/30 kullandığı için testler bunu açığa çıkarmaz); tasarım notu niteliğinde → 'dusuk'.

### F-09 — Geniş engel etrafından dolaşamıyor: sapma yönü her denemede ters çevriliyor, zikzak yapıp pes ediyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1120` · **Güven:** 0.8
- Kod: `if (this.progD < 0.35 && !this.detour) this.detour = { a: (this.detourSide = -(this.detourSide || 1)) * 1.1, t: 1.0 };`
- Açıklama: Takılma tespiti 1.2 sn ilerleme yoksa 63° sapma verir ama yön her seferinde tersine döner; 1 sn sapma, sonra tekrar düz → düşman duvar boyunca sağa-sola salınır. Koşu 2 (dt=1/30): 12 m duvar, 15 sn, 338 sapma adımı, hedefe 8.7 m, görüş hattı kapalı kaldığı için investigate→return→patrol ile pes etti. Liman/tapınak duvarları ve bina kutuları (physics.addBox 35 çağrı noktası) için düşman kolayca 'kilitlenir'.
- Kök neden: Yönlü hafızasız, iki taraflı alternatifli basit sapma; engel geometrisi (kutu uçları) kullanılmıyor.
- Yeniden üretme: Koşu 2 'LOD duvar' adımındaki fine çalışması: detourSteps 338, crossed false, finalD 8.7, state 'patrol'.
- Önerilen düzeltme: Sapma yönünü ilerleme kaydediliyorsa koru (progD>0.35 ise detourSide sabit), ilerleme yoksa ters çevir; ya da takılan kutu için iki ucun dünya noktasını hesaplayıp (c.hw/c.hd, c.cos/sin) hedefe yakın ucu ara hedef (waypoint) yap.
- Statik mercek: enemies.js:1119-1121 `if (this.progT > 1.2) { if (this.progD < 0.35 && !this.detour) this.detour = { a: (this.detourSide = -(this.detourSide || 1)) * 1.1, t: 1.0 }; this.progT = 0; this.progD = 0; }` → yön her takılmada tersine çevrilir; 63° sapma 1 sn sürer (:1070-1075), sonra :1065-1068 düz hedef yönü. Sapma sırasında hedef mesafesi hâlâ azaldığı (cos 63° ≈ 0.45) için 1.2 sn penceresinde progD > 0.35 olur → sapma yönü hafızada korunmaz; düz gidiş duvara çarpar → tekrar takılma → karşı tarafa sapma. Yaklaşık 2 × (1 sn × hız × sin 63°) ≈ 7-9 m'den uzun engeller dolaşılamaz. Engel geometrisi (physics.all kutu uçları, c.hw/c.hd/c.cos/c.sin) hiç kullanılmaz; probe :1077-1079 yalnız 1.3 m önü yoklar.

### F-10 — Lanetli Amiral çift ödül: güverte düşmanının ganimeti + boss ödülü + temizlik öldürmelerinden ganimet/XP
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/bosses.js:992` · **Güven:** 0.95
- Kod: `for (const e of enemies.list) if (e.ship && e.T.faction === 'hayalet' && e.alive) e.applyDamage(9999, {});  // 952: if (host && this.admiral && !this.admiral.alive) { this.hp = 0; this.die(); }`
- Açıklama: Güvertedeki 'lanetli_amiral' Enemy ölünce die() kendi loot tablosunu (400-700 altın, kraliyet_taci, elmas, korsan_madalyonu) düşürür; sonra CursedAdmiral.update boss'u öldürür → victory() BOSS_DEFS.reward (900-1400 altın, 2 madalyon, taç) ikinci kez; ardından kalan hayaletler applyDamage(9999) ile öldürülüp her biri enemyKilled (30 XP) + loot verir. Koşu 2: loot olayları ['Lanetli Amiral','Lanetli Amiral','Hayalet Korsan','Hayalet Korsan'], olaylar kill:lanetli_amiral, boss:Lanetli Amiral, kill:hayalet×2. Ayrıca time.js:55 ve victory() aynı yenilgiyi günlüğe iki kez yazar.
- Kök neden: Boss karşılaşması iki ayrı ödül kaynağını (Enemy.loot ve BOSS_DEFS.reward) birleştiriyor; temizlik ölümle yapılıyor.
- Yeniden üretme: b=DK.bosses.spawn('lanetli_amiral'); b._board(); b.admiral.applyDamage(99999,{}); DK.bosses.update(1/30) → 'loot' olayı 4 kez.
- Önerilen düzeltme: _board() ile doğan amirale `noLoot: true` seçeneği ver (die() içinde loot/enemyKilled atla) ya da ENEMY_TYPES.lanetli_amiral.loot'u boşalt; temizlikte `e.remove = true` (dispose) kullan.
- Statik mercek: bosses.js:924 `this.admiral = enemies.spawn('lanetli_amiral', ...)` → ENEMY_TYPES.lanetli_amiral.loot (enemies.js:166: 400-700 altın, kraliyet_taci, elmas, korsan_madalyonu) → Enemy.die :473-474 enemyKilled + loot. bosses.js:952 `if (host && this.admiral && !this.admiral.alive) { this.hp = 0; this.die(); }` → :991 super.die → victory :1048-1049 def.sea → ikinci loot (BOSS_DEFS :26: 900-1400 altın, 2 madalyon, taç) + bossDefeated (progress.js:73 600 XP). :992 `for (const e of enemies.list) if (e.ship && e.T.faction === 'hayalet' && e.alive) e.applyDamage(9999, {})` → die → enemyKilled (progress.js:71 share(xp*2) = 30) + loot. Günlük: time.js:55 enemyKilled (T.boss) 'Lanetli Amiral yenildi!' + bosses.js:1052 addLog 'Lanetli Amiral (Sisin İçindeki Filo) yenildi' → iki kayıt. :993 `G.player.inv.gold += 0` kalıntı.

### F-11 — Co-op: boss hitPlayer uzak oyuncuya melee/kb bilgisini göndermiyor → bloklanabilir süpürmeler konukta bloklanamaz/parry edilemez
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/bosses.js:42` · **Güven:** 0.9
- Kod: `else G.emit('netHurtPlayer', { id: t.id, dmg, from: [from.x, from.y, from.z], cause, unblockable: opts.unblockable !== false });`
- Açıklama: Taş Muhafız (34) ve Volkanik Dev (40) süpürmeleri `melee:true, unblockable:false` ile ev sahibinde bloklanıp parry edilebilirken, uzak oyuncuya giden mesajda melee alanı yok → player.hurt `opts.melee` false → tam hasar. kb da gönderilmediği için geri itme yalnız ev sahibinde. (Enemy._hitPlayer melee/attackerId gönderiyor; kb orada da eksik.)
- Kök neden: hitPlayer'ın uzak dalı opts.melee/kb'yi kopyalamıyor.
- Yeniden üretme: Statik: bosses.js:41 ile 42 karşılaştır (yerel çağrı melee geçiyor, uzak emit geçmiyor).
- Önerilen düzeltme: Mesaja `melee: !!opts.melee, kb: opts.kb` ekle; net.js relay zaten melee'yi iletiyor; konukta kb'yi knock olarak uygula.
- Statik mercek: bosses.js:41 yerel: `G.player.hurt(dmg, from, { cause, melee: !!opts.melee, unblockable: opts.unblockable !== false })`; :42 uzak: `G.emit('netHurtPlayer', { id: t.id, dmg, from: [...], cause, unblockable: ... })` — melee yok; net.js:132 `melee: e.melee ? 1 : 0` → 0 → :410 `melee: !!m.melee` false → player.js:130 blok şartı sağlanmaz (süpürmeler :707/:860 `melee: true, unblockable: false`). kb :43 `if (t.id === G.myId && opts.kb && from)` yalnız yerel; enemies.js:996 aynı. Düzeltme: konuk tamamen itilmesiz değil — player.hurt :161-166 `from` varsa genel knock (k = min(7, 1.5 + amount*0.12)) uygular; eksik olan boss'a özgü kb değeri (8-11).

### F-12 — Co-op: tepinme (jumpable) ve ateş halkası zıplayarak kaçma uzak oyuncular için çalışmıyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/bosses.js:593` · **Güven:** 0.9
- Kod: `if (opts.jumpable && p.ref.onGround === false) continue;  // 851: ... && p.ref.onGround !== false) { this.waveHit.add(p.id); hitPlayer(p, 30, ...`
- Açıklama: RemotePlayer'da onGround alanı yok (undefined): `undefined === false` → false, `undefined !== false` → true → Taş Muhafız tepinmesi (30) ve Volkanik Dev ateş halkası (30) havadaki konuğu da vurur; oyun ipucu ('zıplayarak kaçabilirsin') konuk için yanlış.
- Kök neden: Yerel Player alanına göre yazılmış kontrol; ağ durumunda ly/onGround yok.
- Yeniden üretme: Statik: net.js RemotePlayer'da onGround tanımı yok (grep boş).
- Önerilen düzeltme: netState'e `air: !this.onGround` (ya da mevcut ly>0.02) ekle, RemotePlayer.update'te `this.onGround = !t.air` ata.
- Statik mercek: net.js:44-61 RemotePlayer'da onGround alanı yok (grep boş); netState player.js:793-799 air/onGround göndermez (yalnız deck için ly). bosses.js:593 `if (opts.jumpable && p.ref.onGround === false) continue;` → `undefined === false` false → vurur; :851 `p.ref.onGround !== false` → true → vurur. Tepinme :714 (jumpable: true, 30 hasar) ve ateş halkası :851 (30) havadaki konuğu da vurur; :714 'zıplayarak kaçabilirsin' ipucu konuk için geçersiz.

### F-13 — Co-op: konukların sesleri (adım, tabanca, yakın dövüş) ev sahibi AI'sına ulaşmıyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/net/net.js:506` · **Güven:** 0.85
- Kod: `_remoteAct(pid, m) { ... if (m.a === 'shoot') { effects.flash(...); audio.play('shoot', ...); } ... }  // combat.noise yalnız yerel G.emit('noise')`
- Açıklama: combat.noise() yalnız yerel olay yolu kullanır; 'noise' ağa aktarılmaz ve ev sahibi 'act' mesajında combat.noise çağırmaz. Konuk koşup tabanca atsa da düşmanlar (hear) onu yalnız görerek fark eder; grup alarmı/siper/araştırma davranışları konuğa karşı eksik. Ev sahibi için 'duyma' tam çalışırken konuk için yok → asimetri.
- Kök neden: Ses olayı ağ modeline eklenmemiş.
- Yeniden üretme: Statik: grep 'noise' net.js → yok.
- Önerilen düzeltme: Konukta combat.noise içinde `G.emit('netNoise', {x,y,z,radius,kind})` → relay toHost → ev sahibinde G.emit('noise'); 'act' shoot mesajında ev sahibi combat.noise(r.pos,45,'gunshot') çağırsın.
- Statik mercek: combat.js:73-76 noise() yalnız `G.emit('noise', {...})`; net.js'te 'noise' hiç geçmiyor (grep boş), relay listesi :126-156'da yok; _remoteAct :506-511 'shoot' için yalnız flash + ses, combat.noise çağrılmaz; 'act' dodge/atk için de ses üretmez. Dolayısıyla enemies.js:1281 `G.on('noise')` ev sahibinde yalnız yerel oyuncunun sesleriyle beslenir. İstisna: top atışı — konuk 'fire' → net.js:259 host combat.fireCannon → combat.js:301 noise(90, 'cannon') ev sahibinde üretilir; iddia zaten topu saymıyor.

### F-14 — Güvertede alınan geri tepme (knock) işlenmiyor; karaya inince gecikmiş sarsma uygulanıyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/player/player.js:465` · **Güven:** 0.9
- Kod: `if (this.knock) { this.vel.x += this.knock.x; ... }  // yalnız _updateGround; _updateDeck (664) knock okumaz; enemies.js:996 ve bosses.js:43 mod bakmadan knock atar`
- Açıklama: Kraken/Amiral/bordalama savaşları güvertede geçer; Enemy._hitPlayer ve boss hitPlayer her modda G.player.knock atar ama yalnız _updateGround tüketir/söndürür. Güvertede knock hiç uygulanmaz (geri itme yok), değer korunur ve oyuncu karaya/yüzmeden çıkıp yere basınca ilk karede eski darbe hızı eklenir. Koşu 2: güvertede knock {4,0}; 1 sn sonra aynen {4,0}; leaveShipToWorld sonrası ilk kara karesinde hız 4.
- Kök neden: Knock tüketimi tek moda yazılmış; üreticiler modu kontrol etmiyor.
- Yeniden üretme: p.boardShip(s); de=DK.enemies.spawn('haydut',s.x,s.z,{ship:s,lx:1.5,lz:0}); de._hitPlayer(G.myId,p,1,{kb:4}); DK.sim(1) → p.knock değişmez.
- Önerilen düzeltme: _updateDeck'te knock'u gemi yereline çevirip local'e uygula ve aynı sönümle söndür; mod değişiminde (boardShip/leaveShipToWorld/enterWater) knock=null.
- Statik mercek: player.js:465-469 knock yalnız _updateGround'da tüketilir ve söndürülür; _updateDeck :664-724 ve _updateSwim :608-652 knock okumaz. Üreticiler: enemies.js:996 `if (mv?.kb && id === G.myId && !G.player.blocking) G.player.knock = {...}` ve bosses.js:43, mod kontrolsüz; player.hurt :141 blokta her modda, :161 yalnız ground/swim (swim'de de tüketilmez). boardShip :273-280, leaveShipToWorld :281-288, enterWater :596-606, exitWater :653-662 knock'u sıfırlamaz → karaya/yere inilen ilk karede eski itki vel'e eklenir.

### F-15 — Lav havuzları yalnız yerel oyuncuyu yakıyor (co-op'ta konuklar bağışık)
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1449` · **Güven:** 0.85
- Kod: `_updatePools(dt) { ... const p = G.player; ... if (p && !p.dead && Math.hypot(p.pos.x - f.x, p.pos.z - f.z) < f.r ...) p.hurt(7, null, { cause: 'Lav ateşinde yandın' });`
- Açıklama: Volkanik Dev'in lav topları (pool:true) ev sahibinde ateş havuzu bırakır; havuz hasarı yalnız G.player'a uygulanır, G.remotes taranmaz ve netHurtPlayer gönderilmez → konuklar havuzlarda bedava durur, ev sahibi yanar.
- Kök neden: Havuz güncellemesi tek oyuncu varsayımıyla yazılmış.
- Yeniden üretme: Statik: _updatePools içinde G.remotes kullanımı yok.
- Önerilen düzeltme: Ev sahibinde remotes'u da tara ve `G.emit('netHurtPlayer', {id, dmg:7, from:[f.x,f.y,f.z], cause})` gönder; hitT'yi oyuncu başına tut.
- Statik mercek: enemies.js:1434-1446 _updatePools: `const p = G.player; ... if (p && !p.dead && Math.hypot(p.pos.x - f.x, p.pos.z - f.z) < f.r && Math.abs(p.pos.y - f.y) < 2) { ... p.hurt(7, null, { cause: 'Lav ateşinde yandın' }); }` — G.remotes taranmaz, netHurtPlayer yok; havuzlar :1429 yalnız _impact (host) içinde oluşur, konukta firePools boş → konuk hiçbir uçta yanmaz.

### F-16 — Tabanca ışını çarpıştırıcıları (kaya/duvar/bina) yok sayıyor; düşmanlar ise lineBlocked kullanıyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/combat.js:282` · **Güven:** 0.8
- Kod: `for (let d = 1; d < best.d; d += 1.2) {   const q = origin.clone().addScaledVector(dir, d);   if (q.y < terrain.heightAt(q.x, q.z) - 0.2) return null; }`
- Açıklama: raycast yalnız arazi yüksekliğiyle engel kontrolü yapar; physics.lineBlocked çağrılmaz → oyuncu kaya, ağaç gövdesi, duvar ve bina kutularının arkasındaki düşmanı vurabilir. Düşman nişancılar _los (enemies.js:1004) ile lineBlocked kullanır → kurallar asimetrik; siper (findCover) mekaniği oyuncuya karşı anlamsızlaşır.
- Kök neden: Ray-cast engel testi yalnız arazi örneklemesi.
- Yeniden üretme: Statik: combat.js içinde lineBlocked/segmentBlocked kullanımı yok (grep boş).
- Önerilen düzeltme: best bulunduktan sonra `if (physics.lineBlocked(origin.x, origin.y, origin.z, best.point.x, best.point.y, best.point.z)) return null;` ekle (kamera-arkası kesimleri için origin'i oyuncunun omzundan başlat).
- Statik mercek: combat.js:263-288 raycast: hedef seçimi kapsül-küre zinciri; engel testi yalnız :282-284 `for (let d = 1; d < best.d; d += 1.2) { ... if (q.y < terrain.heightAt(q.x, q.z) - 0.2) return null; }`; combat.js'te lineBlocked/segmentBlocked yok (grep boş). Düşman tarafı enemies.js:1004 `!physics.lineBlocked(...)` (_los) ve algı :544 lineBlocked kullanır; findCover :1366-1383 çarpıştırıcı arkasında siper seçer → oyuncu kurşunu siperi deler. Not: physics.lineBlocked :159 64 hücreden fazlasında false döner; 80 m ışın ≤ 36 hücre, önerilen düzeltmeye uygun.

## 2b. Belirsiz bulgular (114)

### B-01 — İşçi hatası (onerror) sonrası arazi hattı sonsuza dek asılı kalıyor; yükleme %53'te takılıyor
- **Önem:** Kritik · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/terrain.js:48` · **Güven:** 0.95
- Kod: `w.onerror = (e) => console.error('Arazi işçisi hatası', e.message || e);`
- Açıklama: Modül işçisi betiği yüklenemez/derlenemezse (404, sözdizimi hatası, tek-dosya sürümünde ayrı dosya yokluğu, CSP) hata eşzamansız gelir ve yalnız loglanır: `_cb` içindeki bekleyen sözler reddedilmez, karoların `t.pending` değeri sıfırlanmaz (update() satır 204 aynı seg'i yeniden istemez), işçi listeden çıkarılmaz, yedeğe geçilmez. game.buildWorld → terrain.prepare (game.js:45) ve main.js:108 initMapBase sonsuza dek bekler; prepare içindeki setInterval'ler (satır 259) kapanmaz. Koşu: işçi URL'si 404'e yönlendirildi → 75 s sonra loading 'Arazi örülüyor… %53', workers 3, bekleyen söz 126, kuyruk 120, 125 karo pending, mesh 0, DK tanımsız. Oyun içinde tek işçi ölürse de o işçiye verilen karolar kalıcı delik olur.
- Kök neden: onerror işleyicisi yalnız log yazıyor; istek/karo durumu ile işçi sağlığı arasında bağ yok; prepare()/requestDepth()/requestGrid() zaman aşımı içermiyor.
- Yeniden üretme: node /tmp/audit/B_dunya/fallback.cjs badurl 75 (init betiği Worker URL'sini terrainWorker_404.js'e çevirir) → /tmp/audit/B_dunya/fallback_badurl.json
- Önerilen düzeltme: onerror'da işçiyi listeden çıkar ve terminate et; işçiye verilmiş istekleri (w.jobs kümesi) yeniden kuyruğa al ya da reddet (_requestTile catch pending=0 yapar); kalan işçi yoksa yedeğe geç; prepare()'e zaman aşımı ve yükleme ekranında hata/yeniden dene mesajı ekle.

### E-01 — Hızlı yolculuk sonrası eski çapa noktası kalıyor: zincir gemiyi kilometrelerce öteye 800 m/s ile fırlatıyor
- **Önem:** Kritik · **Grup:** E_gemi · **Yer:** `js/main.js:284` · **Güven:** 0.97
- Kod: `s.x = to.mooring.x; s.z = to.mooring.z; s.yaw = to.mooring.yaw;     s.vx = 0; s.vz = 0; s.speed = 0; s.yawRate = 0;     s.anchorState = 'down'; s.anchorT = 1; s.anchored = true; s.sail = s.sailTarget = 0;   // anchorPt s`
- Açıklama: Oyuncu demirli bir limandan (anchorPt dolu) hızlı yolculukla ana liman dışındaki bir limana gidince gemi varış demir yerine konuyor ama ship.anchorPt eski limanda kalıyor. Varış limanı Ship.dock (yalnız ana liman) kapsamında olmadığı için ship.js:332-343 zincir dalı çalışıyor; d−chain binlerce metre olduğundan her karede yüzlerce m/s hız ekleniyor. Gemi varış limanından anında uçup gidiyor, yolda adaları aşarsa karaya oturma hasarı alıyor; oyuncu iskelede gemisiz kalıyor. Aynı kalıp raiseShip (events.js:389) ve replaceShip için de geçerli; onlar ana limanda Ship.dock sayesinde maskeleniyor.
- Kök neden: Gemiyi ışınlayan kodlar anchorPt'yi sıfırlamıyor; _setAnchorPoint yalnız anchorPt boşken çağrılıyor (ship.js:280); zincir çekişi mesafeyle sınırsız büyüyor.
- Yeniden üretme: Koşu 1 'fasttravel-chain': (-195, 818)'de demir at (anchorPt dolu), fastTravel kodunu tuz_pazari_port_0 demir yeri (1682, 808) için aynen uygula, 3 s simüle et → sürüklenme 1573 m, azami hız 802 m/s, iz: x 1679→1409→1017→675→417→233. anchorPt=null ile aynı senaryo → 0.2 m.
- Önerilen düzeltme: Gemi taşıyan her yerde (fastTravel, raiseShip, replaceShip, menü) `s.anchorPt = null` ver (gerekirse hemen `s._setAnchorPoint()`). Savunma olarak ship.js'de çekişi sınırla: `const pull = Math.min(d - chain, 8) * 1.6 * dt` ve `d > chain * 4` ise çapayı yeniden konumlandır. Ortak bir `ship.relocate(x, z, yaw, {anchored})` yardımcısı ekle.

### H01 — Konukta üretilen ganimet keseleri ev sahibine ulaşmıyor → eşya kalıcı olarak kayboluyor
- **Önem:** Kritik · **Grup:** H_coop_ui · **Yer:** `js/treasure/treasure.js:447` · **Güven:** 0.95
- Kod: `G.emit('netPickupSpawn', { pk: {...} });  // relay (net.js:139): if (G.isHost) this.broadcast(...)`
- Açıklama: Konuk tarafında treasure.spawnLoot çağrılan her yol (panels.js:95 'Yere bırak', treasure.js:505 envanter taşması, hazards.js:267 konuğun kırdığı sandık, islands.js:568/674 ada ve tapınak sandıkları, hazards.js:640 gizli sandık) yalnız konukta yerel bir kese yaratır. Konuk toplamak istediğinde collect() isteği ev sahibine gider (treasure.js:483), ev sahibi pickups listesinde bulamaz ve hiçbir şey olmaz. Co-op koşusunda doğrulandı: h-has-pickup=false, collect sonrası {muz:4, still:true}.
- Kök neden: netPickupSpawn relay'i yalnız ev sahibinde yayın yapıyor; konuk için 'lootReq' benzeri bir istek yolu yok ve konuk yerel keseyi kendi başına toplayamıyor (collect her zaman ev sahibine yönlendiriliyor).
- Yeniden üretme: Co-op: konukta DK.treasure.spawnLoot(p.pos.clone(), [['muz',1,1,null]], 'Bırakılan', true) → ev sahibinde DK.treasure.pickups.some(id) false → konukta DK.treasure.collect → kese kalır, eşya gelmez (r_coop2.json).
- Önerilen düzeltme: Konukta spawnLoot çağrısını ev sahibine 'lootReq' {pos, items, from} olarak gönder; ev sahibi spawnLoot yapıp pickupSpawn yayınlasın. Alternatif: konuk yerel keseye local=true işareti koyup collect'te yerel giveItems yapsın.

### H02 — Oyuncu adı doğrulanmadan HUD takım listesine innerHTML ile basılıyor (eşler arası XSS)
- **Önem:** Kritik · **Grup:** H_coop_ui · **Yer:** `js/ui/hud.js:441` · **Güven:** 0.95
- Kod: `tl.innerHTML = [...G.remotes.values()].map((r) => `<div class="tm">... ${r.name} ...`).join('');`
- Açıklama: Ad, 'hello' mesajından (net.js:214-221) doğrulanmadan roster'a girer ve tüm eşlere yayılır; hud._team bunu innerHTML ile basar. Kötü niyetli bir istemci (herkese açık odalar var) adını '<img src=x onerror=...>' yaparak ev sahibi ve tüm konukların tarayıcısında kod çalıştırabilir (localStorage kayıtlarını silme/değiştirme dahil). Koşuda sahte remote ile window.__xss===1 doğrulandı. hud.js:58 _xpPop da ev sahibi kaynaklı reason'ı innerHTML ile basıyor.
- Kök neden: Güvenilmeyen ağ verisinin innerHTML şablonuna doğrudan katılması; ev sahibinde ad uzunluğu/karakter doğrulaması yok.
- Yeniden üretme: Tek sayfa koşusu: G.remotes.set('xx', {name:'<img src=x onerror="window.__xss=1">', ...}); hud._team() → window.__xss === 1 (r_ui.json).
- Önerilen düzeltme: _team ve _xpPop'ta textContent/el() kullan ya da HTML kaçışı uygula; ev sahibinde hello.name için uzunluk (≤20) ve karakter filtresi, app nesnesi için şema doğrulaması ekle.

### B-02 — Ana iş parçacığı yedeği (_localJob) depth/grid isteklerini hiç çözmüyor ve karo geometrisi üretmiyor → yükleme takılır, arazi görünmez
- **Önem:** Yüksek · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/terrain.js:91` · **Güven:** 0.95
- Kod: `const cb = this._cb.get(msg.id);     this._cb.delete(msg.id);     if (msg.t === 'tile') {`
- Açıklama: Worker kurucusu eşzamanlı hata verince (CSP worker-src, file://) yedek devreye girer. _localJob yalnız 'tile' işler: 'depth' ve 'grid' için geri çağrı silinir ama resolve/reject edilmez → requestDepth(force) (satır 273) ve requestGrid asla dönmez; prepare() (satır 261) ve initMapBase (main.js:108) asılı kalır; `_depthPending` kalıcı olur. Tile sonucu `local:true` → _apply (satır 229) erken döner, mesh üretilmez (arazi görünmez). heights hires olmayan karolara da gönderilir (satır 95) → seg 8/16/32 karolarda 20/10/5 m çözünürlüklü bilineer heightAt. Yedekte _pump (satır 72-76) öncelik sıralaması da yapmaz. Koşu (Worker → throw, 75 s): loading %53 'Arazi örülüyor…', workers 0, tiles 125, meshes 0, heights'lı 125 (110'u hires değil), depthPending true, depthWin null, bekleyen cb 0 (silinmiş).
- Kök neden: Yedek, işçi protokolünün yalnız bir alt kümesini uygular; tile/depth/grid üretim kodu yalnız terrainWorker.js içinde.
- Yeniden üretme: node /tmp/audit/B_dunya/fallback.cjs throw 75 → /tmp/audit/B_dunya/fallback_throw.json
- Önerilen düzeltme: tile/depth/grid üretimini geo tabanlı ortak bir modüle (ör. terrainGen.js) taşıyıp hem terrainWorker.js hem _localJob bunu çağırsın; yedekte geometri de üretilsin (zaman dilimli), heights yalnız hires için gönderilsin; bilinmeyen tiplerde reject edilsin; yedekte kuyruk prio ile sıralansın.

### C01 — Yüzerken gövde su altında: Character.update model.position.y'yi her karede sıfırlıyor, _updateSwim'in 1 m kaldırması hiç uygulanmıyor
- **Önem:** Yüksek · **Grup:** C_oyuncu · **Yer:** `js/player/character.js:744` · **Güven:** 0.95
- Kod: `this.model.position.y = this.baseY;`
- Açıklama: player.js:646 yüzerken `c.model.position.y = damp(c.model.position.y, this.swimMoving ? 1.0 : 0, 6, dt)` ile modeli kaldırmaya çalışıyor; ardından aynı karede çağrılan Character.update (player.js:358) 744. satırda değeri koşulsuz baseY'ye geri yazıyor. Model ayaklardan 1.2 rad öne yatırıldığı için gövde kökün (su yüzeyinin 1.35 m altı) etrafında dönüyor. Koşu t1 S: pitch 1.2, modelPosY 0.008 = baseY, baş kemiği su yüzeyinin 0.84 m, göğüs 1.04 m, kalça 1.22 m altında; kollar IK ile yüzeye uzanıyor. Su üstünde beklerken bile baş kemiği −0.15 m.
- Kök neden: Ayak IK/eğilme için eklenen koşulsuz `model.position.y = baseY` sıfırlaması, oyuncunun yüzme kaldırmasını ezer; iki sistem aynı alanı paylaşıyor.
- Yeniden üretme: t1_player.js 'S' adımı: derin suda mode='swim', W basılı 3 s → bones.head.y − ocean.heightAt = −0.84
- Önerilen düzeltme: Yüzme kaldırmasını Character'a taşı: overlay.swimLift alanı ekle ve 744'ü `this.model.position.y = this.baseY + (o.swimLift || 0)` yap (ya da _updateSwim'de root yerine ayrı bir offset kullan). Ayrıca RemotePlayer için de aynı kaldırmayı uygula (net.js:106).

### C02 — ~1.4 m derinlik bandında kara↔yüzme modu her karede değişiyor (splash/ses spam, silah her karede yeniden kuruluyor)
- **Önem:** Yüksek · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:649` · **Güven:** 0.95
- Kod: `if (floor > wh - 1.25 || this.pos.y - floor < 0.3 && floor > wh - 1.5) { this.exitWater(); }`
- Açıklama: Giriş koşulu (player.js:531) `pos.y < wh−1.15 && g < wh−1.35`; çıkış koşulunun ikinci dalı `pos.y−floor < 0.3 && floor > wh−1.5`. Taban wh−1.5 ile wh−1.35 arasındayken ikisi aynı anda sağlanıyor → her karede enterWater/exitWater. Koşu t1 O: derinlik 1.37 m'de 90 karede 32 geçiş (dizi 'sgsgsg…'), 3 s'de 17 'splash' olayı; her geçişte 'impact' sesi, hold(null)/hold(equipped) ile kılıç/tabanca geometrisi yeniden üretiliyor (makeSword ~15 mesh), model pitch 0'a sıçrıyor. Dalga yüksekliği bandı kıyı şeridinde ileri geri taşır; her kıyıya giriş-çıkışta yaşanır.
- Kök neden: Giriş ve çıkış eşikleri histerezissiz ve örtüşüyor (çıkış için wh−1.5, giriş için wh−1.35).
- Yeniden üretme: t1_player.js 'O' adımı: terrain = tide−1.42 noktasında mode='ground' ve 90 kare sim → transitions90f=32
- Önerilen düzeltme: Tek bir 'derinlik' değişkeni kullan ve histerezis ver: giriş yalnız g < wh−1.35 iken, çıkış yalnız floor > wh−1.25 (ikinci dalı kaldır) ya da ikinci dalın eşiğini wh−1.2'ye çek; ek olarak mod değişiminden sonra 0.3 s kilit koy; enterWater'da eşya kurulumunu yalnız görünürlük değiştirerek yap (yeniden üretme).

### C03 — Düşük dayanıklılıkta savunma bayrağı kare kare titreşiyor → parry penceresi sürekli açık (sömürü) ve Block animasyonu yanıp sönüyor
- **Önem:** Yüksek · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:409` · **Güven:** 0.9
- Kod: `const canBlock = this.equipped === 'sword' && this.stamina > 3 && this.guardBroken <= 0 && ...; this.blocking = rmb && canBlock; if (this.blocking) this.stamina -= dt * 4;`
- Açıklama: Savunma 4/s tüketiyor, savunmasız karede 18/s yenileniyor (player.js:338) → stamina 3 eşiğinde salınıyor; blocking her 4-5 karede bir false oluyor, player.js:298 blockT'yi sıfırlıyor, böylece player.js:132 `blockT < 0.24` kusursuz savunma koşulu hiç kapanmıyor. Koşu t1 B: stamina 3.4 + RMB basılı 90 kare: blocking 32 kez değişti, üst katman 33 kez Block↔boş (playUpper/stopUpper), maxBlockT=0.167. Sonuç: dayanıklılığı bitirip RMB'yi tutan oyuncu her yakın dövüş vuruşunu parry'ler (hasar 0, saldıran 1.7 s sersem, +12 stamina).
- Kök neden: Eşik tabanlı aç/kapa ile anlık yenilenme arasında histerezis ve yenilenme gecikmesi yok; parry zamanlayıcısı her blok başlangıcında sıfırlanıyor.
- Yeniden üretme: t1_player.js 'B' adımı
- Önerilen düzeltme: Savunmaya girmek için stamina > 10, sürdürmek için > 0 iste (histerezis); blok bırakıldıktan sonra 0.6 s yenilenme gecikmesi ekle; blockT'yi yalnız gerçek RMB basışında (input.pressed) sıfırla.

### D-01 — Yüzme ↔ yürüme modu 1.35–1.5 m derinlikte her iki karede bir değişiyor (sıçrama/ses/silah tut-bırak spam'i)
- **Önem:** Yüksek · **Grup:** D_fizik · **Yer:** `js/player/player.js:649` · **Güven:** 0.95
- Kod: `if (floor > wh - 1.25 || this.pos.y - floor < 0.3 && floor > wh - 1.5) { this.exitWater(); }   // :531 → if (this.pos.y < wh - 1.15 && g < wh - 1.35) { this.enterWater(); return; }`
- Açıklama: Yüzme modunda pos.y, floor+0.15'e kıstırılır; floor ∈ (wh-1.5, wh-1.35) iken 'pos.y-floor<0.3 && floor>wh-1.5' hemen exitWater tetikler. Bir sonraki karede yer modunda oyuncu zemine oturur (pos.y=g) ve 'pos.y<wh-1.15 && g<wh-1.35' sağlanır → enterWater. Döngü her 2 karede bir yineler; her girişte 'splash' + 'impact' sfx, vel.y*=0.3, char.hold(null)/hold(equipped), oksijen sıfırlama. Koşu (dalga kapalı, derinlik 1.48 m): 60 karede 27 enterWater / 26 exitWater; gelgit bandı kaydırınca 'swim'de kaldı. Dalgalarla bant kıyı boyunca sürekli gezer; kıyıya çıkan/giren her oyuncu bu banttan geçer.
- Kök neden: Giriş ve çıkış eşikleri histerezissiz ve örtüşüyor: çıkış 'tabana 0.3 m yakın' koşulunu taban wh-1.5'e kadar kabul ediyor, giriş ise tabanın wh-1.35'ten derin olmasını yeterli sayıyor; yüzücünün tabana yakın olması zaten kıstırma yüzünden her zaman doğru.
- Yeniden üretme: DK.ocean.waveScale=0; kıyıda terrain.heightAt ∈ (wh-1.5, wh-1.35) bir noktaya oyuncuyu koy (mode 'ground'); p.enterWater sayacını sar; DK.sim(2) → 25+ çağrı.
- Önerilen düzeltme: Tek bir tutarlı eşik çifti kullanın: exitWater yalnız floor > wh - 1.30 iken (ikinci koşulu kaldırın ya da floor > wh - 1.30 ile sınırlayın); enterWater için g < wh - 1.40. Ek olarak mod değişiminden sonra 0.3 s geri dönüş kilidi (hysteresis timer) koyun.

### D-02 — Oyuncu geri tepmesi (knock) kare hızına bağlı: 60 fps'te 30 fps'in 1.7 katı, 10 fps'in 2.6 katı savrulma
- **Önem:** Yüksek · **Grup:** D_fizik · **Yer:** `js/player/player.js:466` · **Güven:** 0.95
- Kod: `if (this.knock) { this.vel.x += this.knock.x; this.vel.z += this.knock.z; this.knock.x *= Math.exp(-9 * dt); this.knock.z *= Math.exp(-9 * dt); ... }`
- Açıklama: knock her karede hız vektörüne dt ile ölçeklenmeden ekleniyor; toplam eklenen hız ≈ knock/(1-e^{-9dt}) → 60 fps'te 7.2×, 30 fps'te 3.9×, 10 fps'te 1.7× knock. Koşu (knock {5,0}, düz zemin): dt=1/60 → 3.02 m, vmax 12.1 m/s; dt=1/30 → 1.80 m, 7.25 m/s; dt=0.1 → 1.15 m, 5.0 m/s. Tüm düşman/boss darbeleri (kb 2.5–11), fıçı/kaya itkileri ve bloklanan vuruşlar bu yoldan geçer; co-op'ta farklı kare hızlı oyuncular farklı mesafelere savrulur. Düşmanların kendi kb'si (enemies.js:1168 pos+=kb*dt) doğru ölçekli.
- Kök neden: Sönümlenen bir 'hız itkisi' kare başına eklenen bir ivme gibi uygulanıyor; dt çarpanı eksik.
- Yeniden üretme: p.knock={x:5,z:0}; DK.sim(1.5, 1/60) ile DK.sim(1.5, 1/30) karşılaştır (önce pos/vel sıfırla).
- Önerilen düzeltme: Düşmanlardaki gibi knock'u hız olarak entegre edin: this.pos += knock*dt (ya da vel'e tek seferlik ekleyin: hurt() anında vel += knock ve knock=null). Mevcut hissi korumak için knock büyüklüğünü ~7× ölçekleyip bir kez eklemek yeterli.

### E-02 — Delikler ağ anlık görüntüsünde yok: konuklar deliği görmüyor ve onaramıyor
- **Önem:** Yüksek · **Grup:** E_gemi · **Yer:** `js/ship/ship.js:698` · **Güven:** 0.97
- Kod: `return [+this.x.toFixed(2), +this.z.toFixed(2), +this.yaw.toFixed(4), +this.speed.toFixed(2), ..., Math.round(this.hp), Math.round(this.water), this.sinking, ..., [P.pruva, ...], this.mastHp.map(Math.round), this.cannonH`
- Açıklama: netState() su miktarını, hp'yi, parça/direk/top hasarını ve yangınları gönderiyor ama `holes` dizisini göndermiyor; applyNet de delik işlemiyor. Delikler yalnız katılım anındaki 'world' mesajı (net.js:390) ve dükkân işlemlerindeki netShipFull ile gidiyor. Oyun sırasında ev sahibinin gemisi top/çarpma hasarı alınca konukta su artıyor ama delik yok: shipControl.js:121-123 'Deliği onar' istemi delik listesinden üretildiği için konuk hiçbir deliği onaramıyor, delik görseli de yok. Co-op tamir döngüsünün temel parçası konuklar için çalışmıyor; konuk ancak kova ile su boşaltabiliyor.
- Kök neden: Anlık görüntü şeması delikleri kapsamıyor; delik ekleme/silme olayları ağa aktarılmıyor.
- Yeniden üretme: Co-op koşusu 2: ev sahibi `s.damage(20, (1.2,0.5,2))` ×2 → ev sahibi holes 2, hp 60, su 5.1; 1.5 s sonra konuk holes 0, holeMeshes 0, hp 60, su 5.0.
- Önerilen düzeltme: netState'e `this.holes.map(h => [h.id, +h.x.toFixed(2), +h.z.toFixed(2), +h.size.toFixed(2)])` ekle; applyNet'te id kümesi değişince holes'u yeniden kur ve `_syncHoles()` çağır. Alternatif: addHole/repairHole sonrası host `netShipFull` (ya da hafif `shipHoles`) yayınlasın.

### E-03 — Kayıt yüklemede bölgesel hasar, kırık direkler ve top hasarı sıfırlanıyor
- **Önem:** Yüksek · **Grup:** E_gemi · **Yer:** `js/game/shipControl.js:25` · **Güven:** 0.95
- Kod: `const ship = new Ship(scene, data?.typeId || 'sloop', {       id: data?.id || 'ship_main', name: ..., look: ...,       x: ..., z: ..., yaw: ...,       hp: data?.hp, water: data?.water, holes: data?.holes, hold: data?.hol`
- Açıklama: Ship.serialize() parts/mastHp/cannonHp yazıyor (ship.js:692) ve Ship kurucusu opts.parts/mastHp/cannonHp destekliyor (ship.js:41-43), fakat createPlayerShip bu alanları iletmiyor. Kaydet-yükle kırık direği, dümen/yelken hasarını ve kırık topları bedavaya onarıyor (tamir maliyetinin direk başına 300'e kadar çıktığı sistemde ekonomik açık). Konuk katılımındaki applyWorld (main.js:318-324) da bu alanları aktarmıyor (anlık görüntü 66 ms sonra düzeltir).
- Kök neden: Kayıt şeması ile kurucu çağrısı arasında alan eşlemesi eksik.
- Yeniden üretme: Koşu 1 'save-roundtrip': mastHp[0]=0, parts.dumen=20, parts.yelken=30, cannonHp[0]=0 → game.serialize().ship bunları içeriyor → createPlayerShip(ser) → mastHp [100,100], dumen 100, yelken 100, cannonHp[0] 100, sailFactor 1. İki expect FAIL.
- Önerilen düzeltme: createPlayerShip'e `parts: data?.parts, mastHp: data?.mastHp, cannonHp: data?.cannonHp` ekle; replaceShip'te yeni gemi için bu alanları bilinçli olarak sıfırla (data.parts = undefined ...).

### B01 — Aynı tüccardan al-sat döngüsü sınırsız altın üretiyor (Halil Reis/kaçakçı)
- **Önem:** Yüksek · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/economy/shop.js:46` · **Güven:** 0.98
- Kod: `trader: { ... sells: [..., 'baharat', 'ipek'], buys: { tas: 1.2, ganimet: 1.05, koleksiyon: 1.15, balik: 0.7 }, discount: 0.85 }  //  buyPrice = value*1.15*discount`
- Açıklama: Halil Reis baharat/ipek satar (buyPrice 68/147) ve aynı kategoriyi (koleksiyon) ×1.15 ile geri alır; pazar günü (+%20) ve Pazarlıkçı (×1.18) ile fark büyür. Koşu: 10 baharat 680 altına alınıp aynı tüccara 970 altına satıldı (+290); 5 ipek 735 → kaçakçıya 1080 (+345). Kaçakçı da sattığı haritayı (78) 86'ya geri alıyor. Döngü yalnız ağırlıkla sınırlı, bekleme yok → gemi/geliştirme ekonomisi anlamsızlaşır.
- Kök neden: buyPrice çarpanı (1.15×0.85≈0.98) bazı tüccarların alım çarpanlarından (1.15–1.25, üstüne 1+priceBonus ve G.mods.price) düşük; tüccarın sattığı eşyayı geri alması engellenmiyor.
- Yeniden üretme: Ticaret gemisi günü 11-16 arası Halil Reis: baharat ×10 al (680), hemen Sat → 970 altın. /tmp/audit/G_icerik/icerik1.js adım 4-6.
- Önerilen düzeltme: sellPrice içinde tüccarın sells listesindeki eşyalar için alımı reddet (0) ya da alım çarpanını buyPrice×0.6 ile sınırla; indirimli tüccarlarda discount'u alım tarafına da uygula; birim test: her tüccar/eşya için sellPrice < buyPrice.

### B02 — Ada ödülleri (eski sandık, sunak, tutsak, tapınak levyeleri) kaydedilmiyor ve sıfırlanmıyor: yenilemeyle tekrar ganimet/XP, kümeler başka kayda sızıyor
- **Önem:** Yüksek · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/world/islands.js:567` · **Güven:** 0.95
- Kod: `(this.opened || (this.opened = new Set())).add(id);  // islands'ta save() yok, start() opened/freed'i sıfırlamıyor`
- Açıklama: islands.opened (eski sandık + sunak), islands.freed (tutsak +120 altın, +80 XP) ve tapınak levye durumu (kapanış içindeki state, 649) yalnız bellekte. Sayfa yenilenince her ada sandığı, 400-700 altın + Kraliyet Tacı(0.6) + heykelcik + elmas içeren sunak ve tutsaklar yeniden açılabilir; levyeler ada her kurulumunda sıfırlandığı için uzaklaşıp dönmek bile +250 XP (templeOpened) verir. Ters yönde: aynı sayfa oturumunda yeni oyun/başka yuva açılınca eski oyunun kümeleri taşınır (koşu: openedKept=true, freedKept=true; hazards.looted doğru sıfırlandı).
- Kök neden: islands sisteminde save()/saveKey yok; start() yalnız _drop çağırıyor; opened/freed tembel oluşturulan modül durumu; tapınak levye state'i _temple kapanışında.
- Yeniden üretme: Tapınak sunağını aç → F5 → aynı sunağı yeniden aç. Ya da icerik1.js adım 10-13.
- Önerilen düzeltme: islands'a saveKey+save() ekle ({opened:[...], freed:[...], temples:{id:{done}}}); start(data) içinde kümeleri data'dan kur, yoksa boş Set; tapınak kurulurken this.templeDone[id] ise levyeleri çözülmüş kur; ödül olaylarını (templeOpened/prisonerFreed) tek seferlik yap.

### B03 — Co-op: konuk tarafında üretilen ganimet keseleri toplanamıyor; konuğun kırdığı sandıklar ev sahibinde ganimet üretmiyor
- **Önem:** Yüksek · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/treasure/treasure.js:483` · **Güven:** 0.95
- Kod: `collect(p, pk) { if (G.online && !G.isHost) { G.emit('netPickupReq', { id: pk.id }); return; } ... }  // host: treasure.pickups.find(id) → yok`
- Açıklama: Konukta G.emit("loot") tetikleyen tüm yollar (ada sandığı islands.js:568, sunak 674, gizli sandık hazards.js:640, kılıçla kırılan sandık hazards.js:282, envanter taşması treasure.js:505) spawnLoot ile yalnız yerel kese üretir: netPickupSpawn yalnız ev sahibinden yayınlanır (net.js:141), kesenin fiziği yok (442). Konuk toplamak isteyince istek ev sahibine gider, orada kese bulunmaz (net.js:250) → kese 300 s boyunca durur, hiç kimse alamaz. Sandık kırmada ek olarak ev sahibi netApply ile loot=false çağırır (hazards.js:660), yani ganimet tamamen yok olur. Co-op koşusu: kese konukta kaldı, altın 150→150; core_kamp_cr0 ev sahibinde "gone", pickups 0.
- Kök neden: Ganimet üretimi istemci-yerel; yalnız ev sahibinde fizik ve yayın var. Konuk için "ganimet isteği" mesajı yok; hazards.breakCrate ağ yolu loot=false.
- Yeniden üretme: /tmp/audit/G_icerik/coop_icerik.cjs kontrol 2-6.
- Önerilen düzeltme: Konukta spawnLoot/loot olayını toHost({t:"lootReq", table, pos, from}) olarak ilet; ev sahibi spawnLoot yapıp pickupSpawn yayınlasın. hazards: kırılma/sunak/ada sandığı ganimetini yalnız ev sahibi üretsin (konuk tetiklediğinde who=pid ile). giveItems taşması için de aynı yol.

### H03 — Ambara konan sandık diğer oyuncularda hayalet kalıyor; kopmada ev sahibinde gerçek sandığa dönüşüp çoğalıyor
- **Önem:** Yüksek · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:143` · **Güven:** 0.85
- Kod: `relay('netHold', (e) => this.sendGame({ t: 'hold', ship: e.ship, hold: e.hold }));  // treasure.js:359: G.emit('netHold', {..., gone: c.id})`
- Açıklama: stowInHold (treasure.js:340-360, güvertede drop → stow dahil) sandığı yerelde 'gone' yapıp netHold ile 'gone' kimliğini bildirir; relay 'gone' alanını atar ve netChestGone yayılmaz. Diğer taraflarda sandık 'carried' durumunda kalır ve _updateChest (treasure.js:224-229) onu taşıyanın uzak karakterine yapıştırır (hayalet). Taşıyan konuk ayrılırsa ev sahibinde _dropPeer (net.js:278) sandığı 'ground' yapar → ambardaki kopyanın yanında satılabilir ikinci sandık. Ters yön (ev sahibi ambara koyar) konuklarda da aynı hayaleti bırakır.
- Kök neden: Ambara koyma yolunda netChestGone/netChestState yayını yok; relay 'gone' bilgisini düşürüyor.
- Yeniden üretme: Co-op: ev sahibi sandık alıp DK.treasure.stowInHold(DK.G.ship) → konukta DK.treasure.chestById(id) hâlâ {state:'carried', carriers:[hostId]} beklenir (koşu bu adıma ulaşamadan çöktü).
- Önerilen düzeltme: stowInHold'da G.emit('netChestGone', {id}) ekle ya da relay'de e.gone varsa ek 'chestGone' mesajı gönder; _hostData 'hold' işleyicisinde hold.chests kimliklerini treasure.chests'ten kaldır.

### H04 — Ev sahibiyle aynı adlı konuk katılınca ev sahibi listeden düşüyor → konuklarda ev sahibi görünmez
- **Önem:** Yüksek · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:214` · **Güven:** 0.9
- Kod: `const existing = this.roster.find((r) => r.name === m.name && !this.conns.has(r.id)); ... if (existing) this.roster = this.roster.filter((r) => r !== existing);`
- Açıklama: Ev sahibinin kendi roster kaydı conns'ta olmadığı için aynı adlı bir konuk 'existing' olarak ev sahibini eşleştirir ve roster'dan siler. Konuklar welcome/roster'da ev sahibini almaz; _applySnap (net.js:517) 'if (!info.app) continue' ile ev sahibi karakterini hiç yaratmaz; lobide ev sahibi yuvası boş görünür; lobideki 'Karakterimi değiştir' net.roster[0]'ı (artık konuğu) ezer. Varsayılan adlar sabit ('Kaptan Deniz'/'Kaptan Derya', appearance.js:39) olduğundan iki yeni oyuncuda doğrudan tetiklenir.
- Kök neden: Yeniden bağlanma eşleşmesi ev sahibi kaydını dışlamıyor.
- Yeniden üretme: Konuk adını ev sahibi adıyla eşitleyip join → ev sahibinde DK.net.roster host:true kaydı yok; konukta DK.G.remotes.size 0 kalır.
- Önerilen düzeltme: existing aramasına '&& !r.host' ekle; ayrıca aynı adlı bağlı oyunculara otomatik sonek ver (Kaptan Deniz (2)).

### H05 — 960x540'ta 'Oda Kur' ve 'Lobi' panelleri kırpılıyor; 'Odayı oluştur' / 'Oyunu başlat' düğmelerine erişilemiyor
- **Önem:** Yüksek · **Grup:** H_coop_ui · **Yer:** `css/style.css:104` · **Güven:** 0.95
- Kod: `.panel { position: relative; overflow: hidden; ... max-height: 90vh; display: flex; flex-direction: column; ... }`
- Açıklama: menu.js:181-205 (hostScreen) ve :264-300 (lobby) gövdeleri .scroll sınıfı ya da kaydırılabilir yükseklik kullanmıyor; panel max-height 90vh + overflow hidden olduğundan 540 px yükseklikte alt düğmeler kesiliyor. Ölçüm (960x540): Oda Kur panel alt 513 px, 'Odayı oluştur' düğme alt 588 px; Lobi 'Oyunu başlat' alt 555 px (scrollHeight 525/558 > clientHeight 480). Bu çözünürlükte oda kurmak mümkün değil.
- Kök neden: Sabit içerikli panel gövdeleri için kaydırma alanı tanımlanmamış; .lobby-slots min-height 150 px ve sohbet alanı dikey alanı aşıyor.
- Yeniden üretme: 960x540: menu.hostScreen(); panel.getBoundingClientRect().bottom=513, düğme bottom=588 (r_ui.json).
- Önerilen düzeltme: Lobi/Oda Kur gövdelerini el('div',{class:'col scroll'}) içine al ya da .panel > .col için 'min-height:0; overflow:auto'; .lobby-slots'u 540 px altında 2 sütuna indir ve lslot min-height'ı küçült.

### H06 — Varsayılan eğilme/dalış tuşu Sol Ctrl tarayıcı kısayollarıyla çakışıyor (Ctrl+W sekme kapatma, Ctrl+1-5 sekme değiştirme, Ctrl+Tab, Ctrl+R)
- **Önem:** Yüksek · **Grup:** H_coop_ui · **Yer:** `js/core/input.js:5` · **Güven:** 0.8
- Kod: `kos: 'ShiftLeft', zipla: 'Space', egil: 'ControlLeft',   // :56 yalnız Ctrl+S/D/F preventDefault`
- Açıklama: Dalışta/eğilmede Ctrl basılıyken W (ileri) → Chrome/Edge'de Ctrl+W sekmeyi kapatmayı dener (beforeunload sayesinde 'Siteden ayrıl?' iletişim kutusu çıkar, oyun kesilir ve işaretçi kilidi düşer). Ctrl+1..5 (silah yuvaları) ve Ctrl+Tab (envanter) sekme değiştirir ve preventDefault ile engellenemez; Ctrl+R (doldur) sayfayı yenilemeye kalkar; Linux'ta Ctrl+Q (işaret) tarayıcıyı kapatır. keyboard.lock()/fullscreen kullanılmıyor (Grep: yok).
- Kök neden: Tarayıcı oyunu için ayrılmış Ctrl kombinasyonlarını tetikleyen varsayılan tuş seçimi; yalnız üç Ctrl kısayolu engelleniyor.
- Yeniden üretme: Chrome (Windows/Linux): oyunda Ctrl basılı tutup W → 'Siteden ayrılmak istiyor musunuz?' iletişim kutusu.
- Önerilen düzeltme: egil varsayılanını KeyC/KeyX gibi Ctrl dışı bir tuşa al (pusula C ise X), tam ekranda navigator.keyboard.lock(['KeyW','Digit1',...]) dene, keydown'da ctrlKey+oyun tuşu kombinasyonlarını mümkün olanlarda preventDefault et.

### H07 — Ev sahibi konuk mesajlarını doğrulamıyor: keyfî hasar/altın/ambar/sandık içeriği/gemi değişimi/kilit, oran sınırı yok
- **Önem:** Yüksek · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:263` · **Güven:** 0.9
- Kod: `case 'gold': this.broadcast(m, pid); G.player.inv.gold += m.amount; ...   // :237 e.applyDamage(m.dmg, ...)  :253 s.hold = m.hold  :251 _applyChestState(m.c)  :254 _shipFull(m)`
- Açıklama: _hostData yalnız 'm.t' varlığını kontrol eder (net.js:209). Bir konuk {t:'gold', amount:1e9} ile herkese altın verir ya da negatifle siler; hurtEnemy/hurtBoss/hurtAnimal/hurtMarine dmg değeri (Infinity/negatif) olduğu gibi uygulanır; 'hold' ile ambara keyfî eşya enjekte edilir ve limanda satılır; 'chestState' ile içeriği dolu 'legend' sandık yaratılır; 'shipFull' replace:true ev sahibinin gemisini değiştirir ve gemideki ev sahibini limana ışınlar (shipControl.js:49); 'lock' herhangi bir noktayı herhangi bir oyuncu adına kilitler; 'helm' kilit sahibi kontrolü yok; 'dig' konuk konumu kontrol edilmeden uygulanır; 'st' içindeki NaN konumlar düşman AI'ye sızabilir. Mesaj boyutu ve sıklığı sınırsız (chat/marker/st flood).
- Kök neden: Ev sahibi otoritesi yalnız fizik/AI için uygulanmış; gelen mesaj alanları tür/aralık/sahiplik açısından doğrulanmıyor.
- Yeniden üretme: Konuk konsolu: DK.net.toHost({t:'gold', amount:999999}) → ev sahibi ve tüm konuklara altın eklenir.
- Önerilen düzeltme: _hostData'da mesaj türü başına şema ve aralık doğrulaması (dmg ≤ silah maks., amount yalnız ev sahibi hesaplar, hold değişiklikleri işlem bazlı istek), lock/helm için sahiplik kontrolü, dig/pickup için mesafe kontrolü, basit token-bucket oran sınırı ve maksimum mesaj uzunluğu.

### B-03 — Okyanus yüzeyi gelgiti çizmiyor: ocean.uniforms.uTide hiç yazılmıyor (CPU su yüksekliğiyle ±0.55 m uyumsuzluk)
- **Önem:** Orta · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/ocean.js:135` · **Güven:** 0.9
- Kod: `wp.y = h + uTide;`
- Açıklama: Vertex shader yüzeyi `h + uTide` ile yükseltir ama `uTide` yalnız 0 ile tanımlanır (satır 103); ocean.update (satır 256-265) ve sky.update (satır 260-263: yalnız ocean.tide ve terrain.uniforms.uTide yazılır) bu uniform'u güncellemez (grep: tüm js'de tek yazım `tu.uTide`). CPU tarafı `ocean.heightAt` (satır 40) gelgiti ekler: gemi/kayık/yüzen oyuncu ve `sky.underwater` kamera eşiği (game.js _env) ±0.55 m kaymış bir yüzeye göre hesaplanır → alçak suda gemi görünen yüzeyin 0.55 m altında, yüksek suda havada; yüzerken kamera yüzeyin altında/üstünde yanlış tonlanır; 'gelgit kum dili' (worldData.js:62, h −0.14) hiç açığa çıkmaz; HUD gelgit değerini gösterir (hud.js:310) ama su kıpırdamaz; shader'daki derinlik/kıyı köpüğü de gelgitsiz.
- Kök neden: Gelgit eklenirken ocean uniform'u tanımlanmış ama güncelleme satırı unutulmuş.
- Yeniden üretme: DK.sky.hour'u DK.time.nextTides()[0].at saatine getir: DK.ocean.tide ±0.55 iken DK.ocean.uniforms.uTide.value 0 kalır.
- Önerilen düzeltme: sky.update içinde `if (ocean.uniforms) ocean.uniforms.uTide.value = ocean.tide;` (ya da ocean.update'te `u.uTide.value = this.tide`).

### B-04 — heightAt (bilineer) ile çizilen karo ağı (üçgen) ve analitik fonksiyon arasında dik yamaçlarda metrelerce fark
- **Önem:** Orta · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/terrain.js:301` · **Güven:** 0.8
- Kod: `return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;`
- Açıklama: Fizik zemini (physics.groundAt → terrain.heightAt) hires karoda 2 m ızgara üzerinde bilineer; çizilen ağ ise her hücreyi d–b köşegeniyle iki üçgene böler (terrainWorker.js:56-60). Fark hücre merkezinde |h00+h11−h10−h01|/4. Node ölçümü: kirlangic 2.92 m (mağara hendeği kenarı, 173,−51), kizil_kanyon 2.75 m, demirkapi 2.00 m (mesa terasları), ates_dagi 0.79 m; tarayıcıda aynı 2.924 m. Analitik (hires olmayan karo, prop/ada içeriği yerleşimi — adalar 750 m'den kurulur, hires 380 m) ile bilineer arası 2.48 m (kirlangic) … 4.27 m (kizil_kanyon); kıyıda ~0.52–0.56 m (B-05). Hires/hires-olmayan karo sınırında ölçülen sıçrama 0.13 m. Sonuç: uçurum/teras kenarlarında oyuncu ağa göre yüzer/batar; analitik yükseklikle yerleştirilen bina/ağaç/sandık hires yüklenince yere göre kayar.
- Kök neden: Sorgu interpolasyonu ile ağ üçgenlemesi farklı yüzeyler tanımlıyor; 2 m örnekleme dik süreksizlikleri (mesa teras smoothstep 0.72–0.96, mağara hendeği 3 m blend) çözemiyor.
- Yeniden üretme: node /tmp/audit/B_dunya/mathcheck.mjs (gridErr) ve /tmp/audit/B_dunya/r1.json 'heightAt tutarlılık' adımı
- Önerilen düzeltme: heightAt'ı ağla aynı üçgenlemeyle hesapla (tx+tz<1 ise (a,d,b) düzlemi, değilse (b,d,e)); dik yamaçlı adalarda hires adımını 1 m'ye indir ya da yerleşimi hires karo hazır olduktan sonra aynı interpolasyonla yap.

### B-05 — Analitik yükseklikte kıyı çizgisinde 0.67–0.75 m süreksizlik (her adanın çevresinde set/çukur halkası)
- **Önem:** Orta · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/geo.js:47` · **Güven:** 0.8
- Kod: `return SEA_FLOOR * Math.pow(t, 1.25) + fbm(x / 22, z / 22, 2) * 0.9 * (1 - t);`
- Açıklama: d≥1 (kıyı dışı) dalında t=0 iken yükseklik fbm·0.9 (±0.9 m) ile başlar; d<1 dalında ise d→1'de beach→0 ve mount/hills→0, yani tam 0 (satır 50-53, 86). Node ölçümü (5 cm adım, 240 ışın): kirlangic 0.665, marti 0.752, kemik 0.705, tuz_pazari 0.666, ates_dagi 0.681, demirkapi 0.748 m sıçrama; 222 ışının 91'inde dışa doğru set, 131'inde çukur. 2 m örneklemede her adanın kıyısı boyunca ~2 m genişliğinde dik bir basamak/hendek halkası oluşur (yüksek suda +0.55 ile iç tarafta su birikintisi şeridi); hires bilineer ile analitik arasındaki ~0.5 m kıyı farkı (B-04) bundan kaynaklanır.
- Kök neden: İki dalın d=1 limitleri eşit değil (iç: 0, dış: fbm·0.9).
- Yeniden üretme: node /tmp/audit/B_dunya/mathcheck.mjs (coastJump) ve mathcheck2.mjs (coastStepDirection)
- Önerilen düzeltme: Dış dalda fbm terimini kıyıdan sıfırla başlat (örn. `fbm(...)*0.9*(1-t)*smoothstep(1.0, 1.12, d)`) ya da aynı fbm'i iç dala da ekleyip beach eşiğini kaydır; sonrasında kıyı köpüğü/ıslak kum bandını görsel olarak doğrula.

### C04 — Ragdoll ölüm pozundan değil bind (dinlenme) pozundan başlıyor — ölüm anında T/A-poz sıçraması
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/character.js:690` · **Güven:** 0.9
- Kod: `this.mixer.stopAllAction(); this.current = null; ... this.ragdoll = new Ragdoll(this, opts);`
- Açıklama: three.js AnimationMixer._deactivateAction, bir bağın useCount'u 0'a düşünce `binding.restoreOriginalState()` çağırır (vendor/three/three.core.js:55900) ve kemikleri ilk etkinleştirmedeki (build → play('Idle',0), yani bind pozu) değerlerine döndürür. Ragdoll yapıcısı (ragdoll.js:72-79) kemik dünya konumlarını BU sıfırlamadan sonra okuyor. Koşu t1 R: Atk1 pozundayken startRagdoll → ragdoll başlangıç noktası ile animasyon pozu arasındaki fark bilek 0.362 m, dirsek 0.167 m; taze karakterin bind pozuyla fark 0.000. ragdoll.js:4 'ölüm anındaki pozdan başlar' iddiası geçersiz; uzak oyuncular/düşmanlar aynı yolu kullanıyor (net.js:94).
- Kök neden: Pozu örneklemeden önce mixer.stopAllAction çağrılıyor; three.js deaktivasyonda orijinal durumu geri yüklüyor.
- Yeniden üretme: t1_player.js 'R' adımı
- Önerilen düzeltme: Önce `new Ragdoll(this, opts)` ile noktaları örnekle, sonra eylemleri durdur; ya da stopAllAction yerine tüm eylemlerin `enabled=false`/ağırlık 0 yapıp bağları bırakmadan mixer güncellemesini atla (zaten update ragdoll dalında mixer'ı çağırmıyor).

### C05 — Olta atışı 'slash' eylemi üzerinden yakın dövüş vuruşu yapıyor (hedefleri yaralıyor, savaş durumunu tetikliyor)
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/wildlife/fishing.js:123` · **Güven:** 0.9
- Kod: `p.startAction('slash', 0.5);`
- Açıklama: combat.update (combat.js:110-113) `a.type === 'slash'` eylemlerini ekipmana bakmadan vuruş olarak işliyor: `this._meleeHit(p, SWORD_MOVES[1])` → yumruk hasarı 9×, menzil 2.5 m, yay 1.25 rad. Koşu t1 F: olta kuşanmış oyuncu 1.7 m önündeki haydut yanında cast() → haydut 100→91 HP, state 'hit', G.inCombat=true (savaş müziği). Kıyıdaki hayvan/düşman/köpekbalığı hedefleri olta atışıyla yaralanır ve saldırganlaşır; ayrıca kılıç animasyonu (Atk1) olta atışı için oynuyor.
- Kök neden: Eski 'slash' API'si balıkçılık için animasyon amaçlı kullanılıyor, combat.js ise aynı eylem tipini vuruş olarak yorumluyor.
- Yeniden üretme: t1_player.js 'F' adımı
- Önerilen düzeltme: Balıkçılıkta startAction('throw' ya da 'cast') kullan ('Throw' klibi uygun); combat.js:110'daki eski 'slash/punch' vuruş dalını `p.equipped === 'sword' || 'none'` koşuluna bağla ya da tamamen kaldır.

### C06 — Kazı (busy) durumu ölümde temizlenmiyor: ragdoll sırasında kazı tamamlanıyor, bitişte play('Idle') ragdoll adını eziyor
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:187` · **Güven:** 0.9
- Kod: `die(cause) { ... this.action = null; this.char.stopUpper(0.05); ... }  // busy temizlenmiyor; 326: if (this.busy) { this.busy.t += dt; ... c.play('Idle', 0.2); b.onDone && b.onDone(); }`
- Açıklama: die() busy'yi sıfırlamıyor; update() busy sayacını ölü/ragdoll durumunda da ilerletiyor ve onDone (treasure.finishDig) çağrılıyor. Koşu t2 D: kazı sırasında p.hurt(500) → dead=true, ragdoll başladı, busyStillSetAfterDeath=true, 3.5 s sonra çukur 0→1 (digCompletedWhileDead=true), currentName 'Ragdoll'→'Idle' oldu (netState.anim 'Idle' yayar → net.js:94-97'de uzak oyuncu ragdoll'u durdurup ayakta Idle gösterir). Aynı boşluk: busy G.uiOpen'da da akar; cancelBusy()/onCancel/cancelOnMove hiçbir yerden çağrılmıyor (Grep).
- Kök neden: busy yaşam döngüsü yalnız süre dolumuyla bitiyor; ölüm, moda geçiş, UI açılması ve hareket durumları işlenmiyor.
- Yeniden üretme: t2_player.js 'D' adımı
- Önerilen düzeltme: die(), enterWater(), startClimb(), boardShip() ve revive() içinde cancelBusy() çağır; update'te `if (this.busy && !this.dead && !this.downed && !G.uiOpen)`; busy bitişinde `if (!c.ragdoll) c.play('Idle')`.

### C07 — Kamera nesnelerle çarpışmıyor: bina/kaya/duvar çarpıştırıcılarının içinden görüyor
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/camera.js:37` · **Güven:** 0.9
- Kod: `const ground = terrain.heightAt(p.x, p.z); if (p.y < ground + 0.4) p.y = ground + 0.4; // ... yalnız arazi ve su`
- Açıklama: tpCamera.update yalnız arazi yüksekliği ve su yüzeyi için düzeltme yapıyor; physics.lineBlocked/resolve kullanılmıyor, opts.ceiling hiçbir çağrıda verilmiyor (Grep). Koşu t3 C: limanda 'building' etiketli 8.4×7.4 m kutu önünde sırt dönük duruşta kamera (dist 4.6) kutunun içine girdi (physics.resolve hit=true, lineBlocked=true). Mağarada sadece dist≤3.2 sınırı var (game.js:299); dar yerlerde duvar içinden görüş.
- Kök neden: Kamera engel testi uygulanmamış.
- Yeniden üretme: t3_player.js 'C' adımı
- Önerilen düzeltme: Baş→kamera doğrultusunda physics.lineBlocked ile ikili arama (ya da birkaç adımda resolve) yapıp dist'i kısalt, çıkışta damp ile aç; gemi gövdesini ve kutu çarpıştırıcılarını dahil et.

### C08 — Harici el/ayak IK hedefleri hiç kullanılmıyor: dümende eller tekerleğe değmiyor, topta hiç duruş yok, kürek/sandıkta temas yok
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/character.js:769` · **Güven:** 0.85
- Kod: `if (o.helm && !this.ik.handR) { armL(W(0.24, 1.15, 0.5)); armR(W(-0.24, 1.15, 0.5)); }`
- Açıklama: `ik.handR/handL/ground` kodda tanımlı (character.js:804-822) ama hiçbir dosya ayarlamıyor (Grep '\.ik\.' yalnız character.js). Dümen sabit hedefleri kök uzayında 0.5 m öne bakıyor; tekerlek istasyondan 0.9 m önde (shipModel.js:436 helmZ+0.15 vs 525 helmZ−0.75). Koşu t1 H: bilekler tekerlek düzleminin 0.50 m gerisinde, göbekten 0.23 m (rim yarıçapı 0.5) → eller boşlukta, dümen çevrilince hareket etmiyor. Top modunda (player.js:741-752) yalnız Idle; kürek kazısında sol el saplamıyor; sandıkta kollar sabit noktada.
- Kök neden: IK altyapısı yapılmış, istasyon/eşya tarafında hedef besleme hiç yazılmamış; dümen sabitleri gemi modeliyle uyumsuz.
- Yeniden üretme: t1_player.js 'H' adımı
- Önerilen düzeltme: _updateHelm'de tekerlek parmaklık noktalarını (M.wheel.localToWorld, rudder açısıyla döndürülmüş) char.ik.handR/handL'ye yaz; _updateCannon'da kundak arkası tutamak hedefleri ver; kazıda sol el için kürek sapı hedefi; sandıkta chest mesh kulp noktaları.

### C09 — Güvertede zıplama animasyonu yok ve kaçınma hareketi uygulanmıyor (yerinde Dodge animasyonu)
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:552` · **Güven:** 0.9
- Kod: `if (air && this.mode === 'ground') { ... Jump_Idle ... }   // 693: deck zıplama localVy=6.5 ama JumpStart/Jump_Idle oynatılmaz; 442-445 dodge itkisi yalnız _updateGround`
- Açıklama: Koşu t1 J: güvertede Space → localY 0.85'e çıkarken currentName 13 kare 'Idle' (airT da güncellenmiyor). Kaçınma (V): action 'dodge', anim Dodge_B oynuyor ama güverte hareketi `local += d*sp*dt` (player.js:670-674) olduğundan yer değiştirme 0.01 m; invuln 0.34 s veriliyor → görünmez kaçınma. Karadaki hızlı çıkış/yumuşak duruş eğrisi güvertede yok.
- Kök neden: Zıplama/kaçınma animasyon ve hareket mantığı _updateGround'a gömülü; _updateDeck yeniden yazılmış ama bu dallar kopyalanmamış.
- Yeniden üretme: t1_player.js 'J' adımı
- Önerilen düzeltme: _locomotion'da hava dalını `air && (mode==='ground'||mode==='deck')` yap, deck zıplamasında JumpStart oynat ve airT'yi ilerlet; _updateDeck'te dodge için action.dir'i gemi yereline çevirip `2.5+7.5k²` hızıyla local'e uygula.

### C10 — Sprint tükenmesi 2 eşiğinde salınıyor: fiilen sonsuz koşu (~5.7 m/s) ve Sprint/Run animasyon titremesi
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:389` · **Güven:** 0.9
- Kod: `if (input.isDown('kos') && this.stamina > 2 && !this.carrying && !this.aiming && mag > 0.3) { sp = 7.0; this.sprinting = true; }`
- Açıklama: Tüketim 14/s (player.js:450), sprint olmayan karede yenilenme 18/s (player.js:338) → stamina ≈2'de kareler arası aç/kapa. Koşu t1 P: 14 s Shift+W; stamina 2'ye düşünce 1.6–2.5 arasında salındı, son 5 s ortalama hız 5.68 m/s (yürüme 4.4, sprint 7.0), animasyon her örnekte S↔R değişti. Dayanıklılık mekaniği sprinti durdurmuyor, yalnız %19 yavaşlatıyor; ayak sesi/gürültü yarıçapı da titreşiyor (combat.js:88).
- Kök neden: Histerezis ve yenilenme gecikmesi yok; aynı karede hem tüketim koşulu hem yenilenme koşulu birbirini tersliyor.
- Yeniden üretme: t1_player.js 'P' adımı
- Önerilen düzeltme: Sprinte başlamak için stamina > 15, sürdürmek için > 0; sprint bittikten sonra 1 s yenilenme gecikmesi (this.staminaCd); sprinting bayrağını animasyon seçiminde dampli hıza göre değil bayrak+hıza göre kullan.

### C11 — Savaş/sprint bayrakları yalnız kara/güvertede güncelleniyor: dümen/top/kayık/yüzmede blocking/sprinting/Block katmanı donuyor, stamina yenilenmiyor
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:405` · **Güven:** 0.85
- Kod: `_commonCombatInput(dt) { const rmb = input.isDown('nisan') && !this.carrying; this.aiming = ...; this.blocking = rmb && canBlock; ... }  // yalnız _updateGround/_updateDeck çağırır`
- Açıklama: sprinting yalnız _speedFor (player.js:388), blocking/aiming yalnız _commonCombatInput içinde yazılıyor; takeHelm/takeCannon/enterBoat/startClimb/enterWater (aiming hariç) bunları sıfırlamıyor ve üst katmanı kapatmıyor. Koşu t3 K2: güvertede RMB basılıyken dümene geçildi, RMB bırakıldı → dümende blocking=true kaldı (blockT 3.5 s), Block üst katmanı dümende duruyor, stamina 3 s boyunca 58→58 (player.js:338 `!this.blocking` yenilenmeyi kilitliyor). Aynı yol: Shift basılıyken dümene geçince sprinting=true kalır; gemiden/iskeleden derin suya atlarken sprinting donar (kıyıdan girişte C02 salınımı tesadüfen temizliyor, t1 W).
- Kök neden: Mod değişimleri merkezi bir yerden geçmiyor; her mod kendi girişini okuyor, çıkış temizliği yok.
- Yeniden üretme: t3_player.js 'K2' adımı
- Önerilen düzeltme: Player.setMode(m) yaz: blocking=aiming=sprinting=false, char.stopUpper(), blockT=0, gerekiyorsa hold(equipped); takeHelm/takeCannon/enterBoat/startClimb/enterWater/boardShip bunu kullansın.

### C12 — Yüzerken kayığa binip çıkınca silah görünmez kalıyor (equipped 'sword', heldType null)
- **Önem:** Orta · **Grup:** C_oyuncu · **Yer:** `js/game/shipControl.js:231` · **Güven:** 0.9
- Kod: `exitBoat(p) { ... if (s && ... ) { p.boardShip(s, ...); return; } ... p.mode = 'ground'; ... }  // char.hold(p.equipped) geri yüklenmiyor`
- Açıklama: enterWater (player.js:601) eldeki eşyayı hold(null) ile kaldırıyor; geri yükleme yalnız exitWater (660) ve merdiven (778) yollarında var. Yüzerken 'Kayığa bin' → enterBoat → exitBoat (gemiye ya da karaya) hold'u geri yüklemiyor. Koşu t3 E2: derin suda kılıç → kayık → gemi yakınında çık: mode 'deck', equipped 'sword', heldType null (weaponInvisibleButEquipped=true); kına görünürlüğü de yanlış. Oyuncu görünmez kılıçla saldırır; yeniden kuşanana kadar sürer.
- Kök neden: Eşya görünürlüğü mod geçişlerinde dağınık yönetiliyor.
- Yeniden üretme: t3_player.js 'E2' adımı (nearShip)
- Önerilen düzeltme: exitBoat ve boardShip içinde `if (p.equipped !== 'none') p.char.hold(p.equipped); p._syncTorch();` ya da C11'deki setMode ile merkezileştir.

### D-03 — Barut fıçısı patlaması enkazı ~120 m/s'ye fırlatıyor (3 s'de 220 m uzağa, 254 m yükseğe)
- **Önem:** Orta · **Grup:** D_fizik · **Yer:** `js/world/hazards.js:211` · **Güven:** 0.95
- Kod: `this._debris(c, 7, 0x6a4428); ... bodies.impulse(c, R * 1.6, 16);   // bodies.js:61 const k = (1 - d / radius) * strength / b.mass;  (enkaz mass 0.2, r 0.12)`
- Açıklama: _debris cisimleri (kütle 0.2) patlama merkezinin 0.36 m yakınında oluşturulup hemen ardından bodies.impulse ile strength/mass = 16/0.2 = 80 m/s'lik itki alıyor (+ y'ye 0.6k). Koşu: ilk patlamadan 0.1 s sonra 7 enkazın hızı 115–120.7 m/s (vy 93–97); 3 s sonra 208–222 m uzakta ve 254 m yükseklikte. Hava sürüklemesi olmadığından ~11 s uçuyor, 9–13 s ömür boyunca ekranda hiç görünmüyor; her patlama ayrıca 11.2 m içindeki tüm sandık/eşya cisimlerini savuruyor (combat.js:44 'explosion' olayı da 9/0.2 = 45 m/s). Platformları da deler (bkz. D-07).
- Kök neden: Kütle bölmeli itki, 0.2 kg'lık kozmetik enkaz için ölçeklenmemiş; impulse çağrısı enkaz oluşturulduktan sonra yapılıyor.
- Yeniden üretme: h=DK.hazards.list('keg')[0]; DK.hazards.ignite(h,0.02); DK.sim(0.1); DK.hazards.debris.map(d=>d.b.vel.length())
- Önerilen düzeltme: impulse'u enkaz oluşturmadan önce çağırın ya da enkazı dışlayın; k'yi min kütleye kıstırın (örn. mass = max(mass, 1)) ya da hız artışını clamp edin (≤ 12 m/s); bodies._step'e küçük bir hava sürüklemesi (exp(-0.3*dt)) ekleyin.

### D-04 — lineBlocked'ın %2 uç payı mermi süpürmesinde boşluk yaratıyor: ok/mermi/bıçak duvar ve ağaçtan geçebiliyor
- **Önem:** Orta · **Grup:** D_fizik · **Yer:** `js/world/physics.js:189` · **Güven:** 0.85
- Kod: `if (t > 0.02 && t < 0.98) { const y = ay + dy * t; if (y > c.y0 && y < c.y1) return true; }   // enemies.js:1502 physics.lineBlocked(prev.x, prev.y, prev.z, s.pos.x, s.pos.y, s.pos.z)`
- Açıklama: Uç payları göz/hedef kendi çarpıştırıcısını dışlamak için konmuş; mermi adımı (prev→pos, 95 m/s × 1/30 = 3.2 m) için aynı fonksiyon kullanıldığında girişi adımın ilk/son %2'sine düşen duvarlar görülmüyor ve bir sonraki adım duvarın içinden başladığı için t0=0 → yine görülmüyor. Koşu (0.2 m kalın duvar): giriş t0=0.935 → true; t0=0.99 → false; içinden başlayan adım → false; t0=0.01 → false. Her duvar geçişinde ~%4 kaçırma + daire testinde yarıçap 0.894r'ye küçültülmüş. Siper mekaniği (findCover) bu yüzden zaman zaman delinir.
- Kök neden: Görüş hattı fonksiyonu süpürme testi olarak yeniden kullanılmış; uç payları parametrik değil.
- Yeniden üretme: P=DK.physics; P.addBox(5000,5000,0.1,3,0,-50,100,'t'); P.lineBlocked(4996.8,1,5000,4999.93,1,5000) → false; P.lineBlocked(4997,1,5000,5000.1,1,5000) → true
- Önerilen düzeltme: lineBlocked(…, opts={tMin:0.02,tMax:0.98,rScale:0.8}) yapıp mermi çağrısında tMin=0, tMax=1, rScale=1 verin; ayrıca 'başlangıç kutu içinde' durumunda (t0=0 ve t1>0) engel sayın.

### D-05 — Gayzer püskürmesi bodies.impulse'u her kare çağırıyor: kare hızına bağlı fırlatma, her kare rastgele dönme
- **Önem:** Orta · **Grup:** D_fizik · **Yer:** `js/world/hazards.js:585` · **Güven:** 0.85
- Kod: `} else if (h.state === 'erupt') { ... bodies.impulse(new THREE.Vector3(h.x, h.y, h.z), 1.6, 3); if (h.t <= 0) ...`
- Açıklama: 2.4 s'lik 'erupt' durumunda her update'te impulse uygulanır (dt yok): 60 fps'te 144, 30 fps'te 72 itki → gayzer üstündeki sandık/varil 60 fps'te iki kat hıza çıkar (m=1, d=0.5 için kare başına 2.06 m/s → 124 m/s² @60fps, 62 m/s² @30fps). bodies.impulse ayrıca her kare b.angVel'i rastgele sıfırlar ve wake() çağırır. Oyuncu fırlatması (launched) tek seferlik olduğu için doğru.
- Kök neden: Anlık itki fonksiyonu sürekli kuvvet gibi kullanılıyor.
- Yeniden üretme: Volkan adasında gayzerin yanına bodies.add ile cisim koy; DK.sim(3,1/60) ve DK.sim(3,1/30) ile max vel.y'yi karşılaştır (test ortamında gayzer kurulmadı).
- Önerilen düzeltme: Püskürme başında tek impulse (launched gibi bir bayrakla) ya da sürekli kuvvet: b.vel.y += 20*(1-d/1.6)/mass*dt ve angVel'e dokunmayın; bodies'e force(pos,r,acc,dt) yardımcıları ekleyin.

### E-04 — Okyanus shader'ının gelgit uniform'u hiç güncellenmiyor: gemi çizilen suya göre ±0.55 m yanlış yükseklikte
- **Önem:** Orta · **Grup:** E_gemi · **Yer:** `js/world/ocean.js:261` · **Güven:** 0.95
- Kod: `u.uTime.value = this.time;     u.uWaveScale.value = this.waveScale;     u.uCamPos.value.copy(camera.position);   // uTide yazılmıyor // vertex shader (ocean.js:135): wp.y = h + uTide;   // heightAt (ocean.js:40): return `
- Açıklama: Fizik yüzeyi (heightAt) gelgiti ekliyor; sky.js:260 ocean.tide'ı her kare güncelliyor ve terrain.uniforms.uTide'ı yazıyor ama ocean.uniforms.uTide hiç yazılmıyor (0 kalıyor). Sonuç: tüm gemiler, kayık, yüzen nesneler ve yüzen oyuncu çizilen su yüzeyine göre gelgit kadar (±0.55 m, TIDE_AMP) batık ya da havada görünüyor; kıyı köpüğü ve sığ su rengi de gelgitsiz hesaplanıyor. Gelgit kumsalı (treasure.js:135) 'kum su altında' derken görsel yüzey farklı yerde.
- Kök neden: uTide uniform'u tanımlanmış ama ocean.update'te güncellenmemiş; sky.js yalnız arazi uniform'unu güncelliyor.
- Yeniden üretme: Koşu 1 'dock': DK.ocean.tide = -0.363 iken DK.ocean.uniforms.uTide.value = 0; gemi y = -0.77 (fizik yüzeyi -0.75), çizilen yüzey ≈ -0.39.
- Önerilen düzeltme: ocean.update içinde `u.uTide.value = this.tide;` (ve uRain için benzer kontrol) ekle.

### E-05 — Kinematik (ticaret/hayalet) gemiyle çarpışma: vx tanımsızken hiç tepki yok, tanımlıysa 1e6 kat hasar
- **Önem:** Orta · **Grup:** E_gemi · **Yer:** `js/ship/ship.js:485` · **Güven:** 0.95
- Kod: `const vrel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;   // kinematik gemide vx undefined → NaN       if (vrel < 0) { ... a.damage(Math.abs(vrel) * 5 * (mb / ma), ...); b.damage(Math.abs(vrel) * 5 * (ma / mb), ...);   // `
- Açıklama: Kinematik gemiler (details.js:446 ticaret gemisi, bosses.js:897 hayalet gemi) konumunu betikle alır, update() yalnız updateTransform çağırır; vx/vz hiç atanmaz. collideAll'da vrel NaN olunca itki, yaw tepkisi ve hasar bloğu atlanıyor; yalnız konum ayrımı uygulanıyor → oyuncu gemisi ticaret gemisine tam yolla çarpıp hızını kaybetmeden boyunca kayıyor, sarsıntı/hasar yok. Herhangi bir kod kinematik gemiye vx=0 bile atasa aynı formül ma/mb=1e6 ile oyuncu gemisini 4 m/s'de tek karede batırıyor.
- Kök neden: Kinematik gemi için 'sonsuz kütle' itki hesabında doğru ama hasar çarpanı kütle oranına bağlı bırakılmış; hız alanları varsayılan değersiz.
- Yeniden üretme: Koşu 1 'kinematic': kinematic brigantine 3 m yanda, oyuncu gemisi 4 m/s ile ona doğru; collideAll → hp 100→100, hız aynen (−3.11, 2.52), yawRate değişimi 0, 1.5 m ötelenme. k.vx=k.vz=0 verildiğinde tek çağrıda hp 100→0, crash impact 4.0.
- Önerilen düzeltme: `const avx = a.vx || 0, bvx = b.vx || 0 ...` ile NaN'ı önle; hasar çarpanını sınırla: `Math.min(mb / ma, 3)` / `Math.min(ma / mb, 3)`; kinematik gemiye çarpınca oyuncu gemisi için e=0.3 sekme ve |vrel|·5 hasar uygula (kinematik taraf zaten damage()'da erken çıkıyor).

### E-06 — Gülle ve tahta sayaçları ağa aktarılmıyor: konukta sayaç sapıyor, konuk alımları ev sahibine ulaşmıyor
- **Önem:** Orta · **Grup:** E_gemi · **Yer:** `js/net/net.js:440` · **Güven:** 0.9
- Kod: `case 'cannon': { ... const keep = s.cannonballs; s.cannonballs = Math.max(1, s.cannonballs); G.visualOnlyBalls = true; combat.fireCannon(s, m.i, m.by); G.visualOnlyBalls = false; s.cannonballs = keep; } break; } // shop.`
- Açıklama: netState (ship.js:698) cannonballs/planks içermiyor. Konuk yalnız kendi atışlarında sayacı düşürüyor; ev sahibi/yapay zekâ atışlarında 'keep' ile geri alıyor, oysa ev sahibi herkesin atışında düşürüyor. Konukta HUD (hud.js:287 'Gülle: N') ve 'Topu kullan (Gülle: N)' etiketi sapmış sayıyı gösteriyor; ev sahibinde 0'a inince konuk hâlâ 'ateş ediyor' (görsel gülle + patlama sesi) ama host canFire false → gerçek gülle yok, geri bildirim yok. Konuğun tüccardan gülle alımı (shop.js:74), buyForShip (shop.js:222), delik onarımında tahta düşmesi (shipControl.js:212) ve tayfa yardımcısının konukta çalışması (events.js:68-73) yalnız yerel; ev sahibinin stokları değişmiyor.
- Kök neden: Gemi sarf malzemesi anlık görüntü şemasında yok ve konuk tarafı ekonomik işlemler host'a iletilmiyor.
- Yeniden üretme: Co-op koşusu 2: başlangıç 20/20; konuk ateş → her ikisi 19 (host'ta gerçek gülle 1); host 3 atış → host 16, konuk 19 (FAIL). Konuk satın alma adımı test betiğinde DK.shop açık olmadığı için çalışmadı (statik).
- Önerilen düzeltme: netState'e cannonballs ve planks ekle (host otoriter, applyNet'te yaz); konuk alımlarını `shipCmd {cmd:'addBalls'|'addPlanks', n}` ile host'a ilet; `shipCmd repair`/`cannonFix`/`mastFix` host tarafında tahta düşsün; events.js tayfa yardımcısını `G.isHost` ile sınırla.

### E-07 — Direk onarımı diğer istemcilerde görsel olarak geri alınmıyor: direk devrik kalıyor
- **Önem:** Orta · **Grup:** E_gemi · **Yer:** `js/ship/ship.js:123` · **Güven:** 0.9
- Kod: `M.masts.forEach((g, i) => {       if (!g || this._fallen[i] || this.mastHp[i] > 0) return;   // yalnız devirir, dikmez // net.js:442: case 'shipCmdFx': if (m.cmd === 'anchor') audio.play(...); break;   // mastFix yok // `
- Açıklama: Direk hp'si anlık görüntüyle gidiyor; applyNet mastHp değişince _applyDamageVisuals çağırıyor ama bu fonksiyon yalnız devirir. Ev sahibi acil direk dikince (shipControl.js:118 → rebuild) ya da gemi ustasında tam tamir yaptırınca (shop.js:181 rebuild + netShipFull) konuklarda direk devrik, donanım gizli ve yelken 'broken' kalıyor; sailFactor doğru (0.87) ama görsel yanlış. Konuk onarınca host _shipCmd'de rebuild yapıyor, diğer konuklar yapmıyor.
- Kök neden: Hasar görselleri tek yönlü (yalnız kırılma); shipCmdFx 'mastFix' ve netShipFull işleyicileri modeli yeniden kurmuyor.
- Yeniden üretme: Co-op koşusu 2: host mastHp[0]=0 → konuk fallen true (PASS); host mastHp[0]=35 + rebuild + shipCmd mastFix → konuk mastHp [35], fallen true, sailFactor 0.87 (FAIL). repairShip adımı betik hatası nedeniyle çalışmadı (statik).
- Önerilen düzeltme: applyNet'te eski mastHp ≤0 iken yeni >0 olan direk varsa `this.rebuild({})` (veya _fallen pivotunu çözen bir `_restoreMast(i)`); _shipFull'de mastHp'yi de al ve gerektiğinde rebuild; shipCmdFx 'mastFix'/'cannonFix' işlensin.

### E-08 — Gemi ustasında batık gemi için 'tamir' seçeneği 600 altın fazla alıyor ama gemiyi kurtarmıyor
- **Önem:** Orta · **Grup:** E_gemi · **Yer:** `js/economy/shop.js:170` · **Güven:** 0.85
- Kod: `return Math.round((s.maxHp - s.hp) * 3 + s.holes.length * 25 + s.water * 0.5 + (s.sunk ? 600 : 0) + partCost + mastCost + cannonCost + ...); // repairShip (172-185): s.hp = s.maxHp; s.holes = []; s.water = 0; s.fires = [`
- Açıklama: quests.js:445 'Gemiyi tamir et (rc altın)' seçeneği gemi batıkken de listede (450 yalnız 'kurtar' seçeneğini başa ekliyor). repairCost batık gemi için +600 ekliyor fakat repairShip sunk bayrağını, batma animasyonunu ve görünürlüğü değiştirmiyor; gemi dipte kalıyor. Oyuncu önce 'tamir'e basarsa 600 altını boşa verir, ardından raiseShip için tekrar 600 ödeyip hp'yi %60'a düşmüş alır.
- Kök neden: İki ayrı akış (repairShip/raiseShip) aynı diyalogda, repairCost'un 600 kalemi hiçbir işlevle eşleşmiyor.
- Yeniden üretme: Statik: quests.js:443-450 ve shop.js:163-185 okuması; raiseShip (events.js:382) ayrı 600 alıyor.
- Önerilen düzeltme: Batık gemide 'tamir' seçeneğini gizle ya da repairShip'i `if (s.sunk) events.raiseShip()` ile birleştir; repairCost'tan 600 kalemini kaldır.

### E-09 — Oyuncu güvertedeyken düşman/ticaret gemisi dispose edilince oyuncu görünmez gemide havada asılı kalıyor
- **Önem:** Orta · **Grup:** E_gemi · **Yer:** `js/game/events.js:356` · **Güven:** 0.9
- Kod: `_removeEnemyShip() { ... e.dispose(); G.ships = G.ships.filter((s) => s !== e); this.enemyShip = null; ... } // player.js:666: if (!s || s.sunk) { this.leaveShipToWorld(...); return; }   // dispose edilmiş gemi için kont`
- Açıklama: Bordalama sonrası oyuncu düşman güvertesinde dururken dist>450 ya da esT>300 (events.js:345) gemiyi dispose ediyor; ticaret gemisi de 16:00'dan sonra ayrılıp _removeTrader ile (details.js:456) kaldırılıyor ve 'Karşı güverteye atla' istemi kinematik gemileri dışlamıyor (shipControl.js:89). p.ship sahneden ve G.ships'ten çıkmış nesneyi göstermeye devam ediyor; _updateDeck sunk olmadığı için çıkmıyor; matrixWorld donduğundan oyuncu son konumda havada kalıyor. Kurtuluş yalnız küpeşteden atlamak.
- Kök neden: Gemi kaldırma yolları üzerindeki oyuncu/tayfa durumunu kontrol etmiyor; _updateDeck yalnız sunk bayrağına bakıyor.
- Yeniden üretme: Koşu 1 'sinking-deck' c: spawnEnemyShip, oyuncu boardShip(e), _removeEnemyShip, 3 s sim → mode 'deck', shipInScene false, shipInList false, konum (-168.6, 1.7, 701) sabit.
- Önerilen düzeltme: Ship.dispose() içinde (ya da kaldıran kodda) `if (G.player.ship === this) { G.player.leaveShipToWorld(G.player.pos.clone()); G.player.enterWater(); }`; _updateDeck'te `!s.root.parent` kontrolü; ticaret gemisi ayrılırken güvertedekileri iskeleye indir.

### B04 — Taşınan sandık ve kayıktaki sandıklar kayda girmiyor; yüklemede içerikle birlikte yok oluyor
- **Önem:** Orta · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/treasure/treasure.js:75` · **Güven:** 0.95
- Kod: `chests: this.chests.filter((c) => c.state === 'ground' || c.state === 'water').map(...)  // 'carried' ve 'boat' dışarıda; game.js player kaydında carrying yok`
- Açıklama: Oyuncu sandık taşırken (ya da iki sandık kayıktayken) otomatik/el ile kayıt alınırsa sandık ne treasure.chests ne player ne de rowboat kaydında yer alır. Koşu: taşınan medium sandık ile serialize → treasure.chests.length=0, player anahtarları [pos,hp,inv,onShip,lx,lz]. Kaptan Sandığı (1100) bile kaybolabilir.
- Kök neden: save() yalnız yerdeki/sudaki sandıkları yazıyor; player.carrying ve G.rowboat.cargo hiçbir sistemde serileştirilmiyor (game.js:153-170).
- Yeniden üretme: Sandığı al → Esc → Kaydet → Yükle: sandık yok. icerik1.js adım 9.
- Önerilen düzeltme: treasure.save() tüm gone-dışı sandıkları yazsın; carried olanları yüklemede oyuncunun yanına "ground" olarak bırak (ya da player kaydına carrying id ekleyip start sonrasında _grant); rowboat cargo id'lerini ship/misc kaydına ekle.

### B05 — Co-op hikâye senkronu tek yönlü: konuğun ilerlettiği aşama/bayraklar ev sahibine (ve kayda) ulaşmıyor
- **Önem:** Orta · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/net/net.js:146` · **Güven:** 0.9
- Kod: `relay('netStory', (e) => { if (G.isHost) this.broadcast({ t: 'story', ...e }); });  // konuk emit'i yutuluyor`
- Açıklama: Konuk Tuzla ile konuşup advance(1) yapar, günlüğü alır (takeJournal) ya da Nevra'dan ilk haritayı alırsa quests.stage/flags yalnız kendi tarafında değişir ve +150 XP alır; ev sahibi 0'da kalır (co-op koşusu: konuk stage 1, ev sahibi 0). Kayıt ev sahibinde olduğu için yeniden yüklemede ilerleme kaybolur; günlük ev sahibinde görünür kalır ve ikinci kez alınabilir.
- Kök neden: quests ev sahibi otoriteli tasarlanmamış: konuk yerelde ilerletiyor, netStory relay'i yalnız ev sahibinden yayın yapıyor; ev sahibinde "storyReq" işleyicisi yok.
- Yeniden üretme: coop_icerik.cjs kontrol 9 (h-stage 0).
- Önerilen düzeltme: Konukta advance/takeJournal/ilkHarita → toHost({t:"storyReq", to, flags}); ev sahibi doğrulayıp kendi advance()'ini çalıştırıp broadcast etsin. Konukta yalnız sunum (bildirim) kalsın; XP ev sahibinden netXp ile dağıtılsın.

### B06 — Konuk görev/keşif/koleksiyon durumu oturumlar arası saklanmıyor: her katılımda keşif XP ve yan görev ödülleri yeniden alınabiliyor
- **Önem:** Orta · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/main.js:191` · **Güven:** 0.85
- Kod: `const data = guest ? { player: { inv: guest.inv, hp: 100 } } : null;  // quests için veri yok → stage 0, discovered {}, side [], completed []`
- Açıklama: Konuk her oturumda boş keşif listesi ve boş completed ile başlar (progress ise GUEST_KEY ile saklanıyor). Liman ve ada keşifleri her katılımda +25 XP verir (koşu: konukta discovered +25); görev panosundan "Tabakhane İçin Deri" envanterdeki postlarla anında tamamlanır (+90 altın, paylaşımlı), keşif görevleri (+110/+150) yeniden alınır. Sis haritası, koleksiyon ve başarımlar her oturumda sıfırlanır.
- Kök neden: startOnlineGuest yalnız envanteri yüklüyor; quests.start(data) konuk için ayrı bir depolama kullanmıyor; ev sahibi de discovered/fog göndermiyor.
- Yeniden üretme: Konuk olarak katıl → limanda +25 XP; çık, yeniden katıl → yine +25.
- Önerilen düzeltme: quests için konuk anahtarı (dk_quests_guest) ekleyip discovered/fog/collection/achievements/side/completed'i sakla; ya da ev sahibi netWorld ile discovered listesini gönderip keşif XP'sini yalnız ev sahibinde ver (netXp ile paylaştır).

### B07 — "Tümünü sat" usta silah/olta, dürbün, hazine haritaları, mermi ve yemi de satıyor
- **Önem:** Orta · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/economy/shop.js:105` · **Güven:** 0.98
- Kod: `if (pr > 0 && !['kilic', 'tabanca', 'kurek', 'olta', 'pusula', 'fener'].includes(s.id)) { total += this.sell(s, role); cnt++; }`
- Açıklama: Rıza'da (silah 0.4, arac 0.5, harita 0.5, mermi 0.5, sarf 0.5 alıyor) "Tümünü sat" düğmesi tek tıkla Usta Palası (900→432), Usta Oltası, dürbün, aktif hazine haritaları, tüm mermi/yem/erzakı satar. Koşu: before 13 kalem → after 6; usta_kilic, usta_olta ve hazine_haritasi gitti.
- Kök neden: Hariç tutma listesi yalnız başlangıç aletlerini içeriyor; kategori temelli koruma yok, onay yok.
- Yeniden üretme: icerik1.js adım 7.
- Önerilen düzeltme: sellAll varsayılanı ganimet/tas/koleksiyon/balik kategorileriyle sınırla (filter parametresi zaten var); silah/arac/harita/mermi/sarf için onay iste ya da ayrı düğme.

### B08 — Co-op: deniz olayı nesneleri (varil, şişe, kazazede, gök taşı parçası, yüzen sandık) konuğa hiç iletilmiyor
- **Önem:** Orta · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/game/events.js:173` · **Güven:** 0.85
- Kod: `const f = { id: uid('f'), kind, pos: pos.clone(), mesh, t: 0, label: labels[kind] };  // ağ yayını yok; events.update zamanlayıcı yalnız ev sahibinde (75)`
- Açıklama: spawnFloating/collectFloating için netX olayı yok; konuk ev sahibinin gördüğü varil/şişe/kazazede/meteor parçasını ve bunlara bağlı "Şişeyi al" etkileşimini göremez, bildirimleri de almaz. Gök taşı (240 değer, +80 XP) ve hayalet ışık sandığı yalnız ev sahibine gider. worldEvents (buzdağı/ışık/volkan) ise netState ile eşleniyor — tutarsız.
- Kök neden: events sistemi ev sahibi-yerel yazılmış; netSnapshot/relay tanımı yok.
- Önerilen düzeltme: spawnFloating/collect için {t:"float", a:"spawn|gone", id, kind, pos} yayınla (konukta body'siz görsel + etkileşim → floatReq host'a); bildirimleri de broadcast et.

### H08 — Dünya olayları (yüzen varil/şişe/sandık/kazazede/gök taşı) yalnız ev sahibinde; konuk görmez ve toplayamaz
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/game/events.js:144` · **Güven:** 0.9
- Kod: `spawnFloating(kind, pos) { ... this.floating.push(f); return f; }   // :75 if (!G.isHost) return;  — ağ yayını yok`
- Açıklama: events sistemi netSnapshot/applySnapshot/relay'siz; floating nesneler ve 'Gözcü: ...' bildirimleri yalnız ev sahibinde oluşur. worldEvents._debris (worldEvents.js:290-300) de events.spawnFloating'e dayanır. Konuk bu içeriğe hiç erişemez; kazazede haritası/altın ödülü ve düşman gemisi ele geçirme altını (events.js:265) yalnız ev sahibine gider.
- Kök neden: events için ağ yolu tasarlanmamış.
- Yeniden üretme: Co-op: ev sahibinde DK.events.trigger('barrel') → konukta DK.events.floating.length 0.
- Önerilen düzeltme: floating listesini snapshot'a ekle (id, kind, pos) ve konuk collectFloating'i 'floatReq' ile ev sahibine yönlendir; olay bildirimlerini netStory benzeri 'notify' yayınıyla paylaş.

### H09 — Konuk kazısında geri bildirim yok; hazine bulma mesajları yanlış kişiye gidiyor
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/treasure/treasure.js:168` · **Güven:** 0.9
- Kod: `G.emit('digResult', { who, ok: false, warm: !!near });  if (who === G.myId) G.notify(near ? 'Kürek bir şeye değmedi…' : 'Burada hiçbir şey yok.', ...)`
- Açıklama: Konuk kazdığında resolveDig ev sahibinde çalışır; boş kazıda yalnız who===myId için notify var ve 'digResult' olayını Grep'e göre hiç kimse dinlemiyor → konuk sessizlik alır ('yakın olmalısın' ipucu dahil). Hazine bulunduğunda ev sahibi 'Hazine buldun' (treasure.js:181) görür, kazan konuk ise 'Tayfa hazineyi buldu! Haritan kullanıldı.' (net.js:444 mapUsed) alır.
- Kök neden: Sonuç bildirimi ağa taşınmamış; mesaj metinleri kazanı ayırt etmiyor.
- Yeniden üretme: Konuk: DK.G.emit('netDig', {x: p.pos.x+1, z: p.pos.z+1}) → konukta hiçbir notify yok (koşu bu adımda çöktü; statik kesin).
- Önerilen düzeltme: resolveDig sonucunu toPeer(who, {t:'digResult', ok, warm, tier}) ile gönder ve konukta notify et; ev sahibi bildirimini who'ya göre 'X hazine buldu' yap.

### H10 — Konuğun ambardan aldığı sandık yalnız konukta var: açılamaz, kopmada kaybolur
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/treasure/treasure.js:374` · **Güven:** 0.85
- Kod: `G.emit('netChestSpawn', { chest: this.chestNet(c) });   // relay (net.js:137): if (G.isHost) this.broadcast(...)`
- Açıklama: takeFromHold (treasure.js:362-375) konukta sandığı yerel yaratır; netChestSpawn yalnız ev sahibi yayar, netChestState emit edilmez. Ev sahibi sandığı bilmez: konuk 'aç' (chestReq open) isteği bulunamaz, iki kişilik taşıma yardımı imkânsız, konuk kopunca sandık ambardan da çıkmış olur (kayıp). Yalnız konuk yere bırakınca chestState ile ev sahibinde yaratılır.
- Kök neden: Konuk tarafında sandık yaratma yolu ev sahibine bildirilmiyor.
- Yeniden üretme: Konuk ambar panelinden sandık al → ev sahibinde DK.treasure.chestById(id) undefined; konuk E basılı tut (aç) → hiçbir şey olmaz.
- Önerilen düzeltme: Konukta takeFromHold'u 'holdTakeReq' {idx} olarak ev sahibine gönder; ev sahibi spawnChest + _grant yapıp chestSpawn/chestState yayınlasın.

### H11 — Uzak oyuncu aksiyon efektleri ('act': atış parlaması/sesi) hiçbir konukta gösterilmiyor
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:236` · **Güven:** 0.9
- Kod: `case 'act': this._remoteAct(pid, m); this.broadcast(m, pid, { from: pid }); break;   // broadcast(m, except) — 3. argüman yok sayılır`
- Açıklama: Konuğun 'act' mesajı diğer konuklara 'from' alanı olmadan yayılır; ev sahibinin kendi netAction'ı da (relay net.js:126 → sendGame) 'from' içermez. _clientData 'act' (net.js:409) m.from undefined → G.remotes.get(undefined) → çıkış. Sonuç: konuklar başkalarının tabanca parlamasını/sesini hiç görmez. Ayrıca _remoteAct yalnız 'shoot'/'slash' işler; emit edilen 'atk' (combat.js:156) ve 'dodge' (player.js:424) işlenmez, 'slash' hiç gönderilmez.
- Kök neden: broadcast imzası (m, except) ile uyumsuz çağrı; ev sahibi tarafında from eklenmiyor.
- Yeniden üretme: 3 oyuncu: konuk A ateş eder → konuk B'de effects.flash/ses yok; 2 oyuncu: ev sahibi ateş eder → konukta yok.
- Önerilen düzeltme: this.broadcast({ ...m, from: pid }, pid) ve relay'de ev sahibi için { ...e, from: G.myId }; _remoteAct'e 'atk' için kılıç sesi ekle.

### H12 — Gemi 'sunk' bayrağı ile gülle/tahta sayıları ağ durumunda yok: batan gemi konukta görünür kalır, gülle sayısı sapar
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/ship/ship.js:701` · **Güven:** 0.85
- Kod: `applyNet(s) { ... this.sinking = s[11]; ... }   // sunk yalnız update() içinde (ship.js:536); netState'te cannonballs/planks yok`
- Açıklama: Konukta clientUpdate sunk hesaplamaz; sinking değeri gelir ama 'sunk=true/root.visible=false' ve 'sunk' olayı (events._shipEvent bildirimi, güverteden düşürme) hiç olmaz → konuk batmış gemiye 'Gemiye bin' yapabilir (shipControl.js:159 !ship.sunk). net.js:440 'cannon' işleyicisi ev sahibi atışında konuğun gülle sayısını geri yüklediği için konuk HUD'u ve canFire kontrolü ev sahibinden sapar; yalnız shipFull (dükkân) ile düzelir.
- Kök neden: netState alanları eksik (sunk, cannonballs, planks); görsel atış için sayaç geri yükleme.
- Yeniden üretme: Ev sahibi gemisi water=100 → 15 s sonra ev sahibinde sunk=true, konukta sunk=false ve root.visible=true.
- Önerilen düzeltme: netState'e sunk/cannonballs/planks ekle ve applyNet'te uygula (sunk geçişinde root.visible ve 'sunk' olayı); 'cannon' işleyicisinde keep yerine ev sahibi sayısını kullan.

### H13 — Bağlantı kopmasında kilit/sandık temizliği diğer konuklara yayılmıyor (dümen/top 'kullanımda' kalır)
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:279` · **Güven:** 0.85
- Kod: `for (const [k, v] of interact.locks) if (v === pid) interact.locks.delete(k);   // yayın yok`
- Açıklama: _dropPeer kopan oyuncunun kilitlerini yalnız ev sahibinde siler; 'lock' mesajları yalnız değişimde gönderildiği için kalan konuklarda interact.locks girdisi kalır ve interact.isLocked (interact.js:16-19) dümen/topu 'kullanımda' olarak kilitli bırakır. Taşınan sandık için de chestState yayılmaz (konuklar _updateChest'teki taşıyıcı-yok dalıyla kendini onarır).
- Kök neden: Kopma temizliği yerel; ilgili durum mesajları yayılmıyor.
- Yeniden üretme: 3 oyuncu: konuk A dümeni alır ve sekmeyi kapatır → konuk B'de dümen 'Dümene geç (kullanımda)' kalır.
- Önerilen düzeltme: _dropPeer'da her silinen kilit için broadcast({t:'lock', id:k, on:false}) ve bırakılan sandık için chestState yayını.

### H14 — HUD 960x540: gemi paneli görev takipçisinin üstüne biniyor; sohbet kutusu bildirim yığınıyla çakışıyor; boss çubuğu zaman paneliyle çakışıyor
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `css/style.css:254` · **Güven:** 0.9
- Kod: `#ship-panel { position: absolute; right: 22px; bottom: 214px; width: 290px; ... }  // :218 #quest-tracker top:128px  :296 #chat-box bottom:300px  :222 #notify-stack top:90px  :250 #boss-bar top:58px width:min(620px,70vw)`
- Açıklama: Ölçüm (960x540, gemide): ship-panel 81–326 px ile quest-tracker 128–203 px kesişimi 21750 px²; chat-box (boş günlükle) 215–240 px ile notify-stack 90–374 px kesişimi 9500 px² (dolu günlükle 160 px daha). Statik: boss-bar 170–790 px × 58–~100 px ile time-panel 650–942 × 12–99 px kesişir. 1366x768'de ship/quest çakışması yok, chat/notify 6 bildirimde kesişir; 1920x1080'de sorun yok.
- Kök neden: Sabit px konumlu HUD bloklarının küçük yükseklikte dikey çakışması; yalnız 1100 px genişlik için medya sorgusu var.
- Yeniden üretme: 960x540 koşusu: overlaps {shipVsQuest:21750, chatVsNotify:9500} (r_ui.json).
- Önerilen düzeltme: max-height:600px medya sorgusu: ship-panel'i quest-tracker altına (top hesaplı) ya da quest-tracker'ı küçült; chat-box'ı bottom:150px'e ve notify-stack max-height ile sınırla; boss-bar genişliğini calc(100vw - 740px) ile sınırla.

### H15 — Korsan Defteri > Zaman Çizelgesi takvim hücreleri HTML'i düz metin olarak gösteriyor
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/ui/journal.js:50` · **Güven:** 0.95
- Kod: `el('div', { class: 'tl-dayev' }, ev.length ? ev.map((e) => `${e.icon} ${e.title}`).join('<br>') : '<span class="muted">Sakin gün</span>')`
- Açıklama: util.js:135 el() string çocukları createTextNode ile ekler; bu yüzden takvim günlerinde '🏪 Pazar günü<br>⛵ Ticaret gemisi' ve '<span class="muted">Sakin gün</span>' metinleri aynen görünür. Koşuda doğrulandı (literalHtml=true).
- Kök neden: html: özniteliği yerine string çocuk kullanımı.
- Yeniden üretme: Oyunda J → Zaman Çizelgesi → takvim kutularında '<br>' / '<span class="muted">' yazısı.
- Önerilen düzeltme: el('div', { class: 'tl-dayev', html: ... }) kullan ya da her olay için ayrı el('div') üret.

### H16 — Konuk ilerlemesi otomatik kaydedilmiyor; duraklat menüsünde konuk için Kaydet yok
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/game/game.js:204` · **Güven:** 0.8
- Kod: `if (this.autosaveT > 120 && G.isHost) { this.autosaveT = 0; G.emit('autosave'); }   // progress.js:87 G.on('autosave', () => this._guestSave())  menu.js:348 G.isHost ? B('Kaydet', ...) : null`
- Açıklama: 'autosave' yalnız ev sahibinde yayınlandığı için progress._guestSave (XP/seviye/yetenek) konukta yalnız seviye atlama, yetenek öğrenme ve stop'ta çalışır; konuk envanteri yalnız hostLeft/toMenu/beforeunload/visibilitychange'de yazılır. Tarayıcı çökmesi ya da sekme kill'inde son dakikaların envanteri ve XP'si kaybolur; konuk elle de kaydedemez (düğme gizli, oysa saveNow konuğu destekliyor).
- Kök neden: Autosave koşulu G.isHost; menü düğmesi ev sahibine özel.
- Yeniden üretme: Konuk olarak 10 dk oyna, sekmeyi zorla kapat → son kayıt yalnız hostLeft/visibility anındaki.
- Önerilen düzeltme: Autosave'i konukta da (yalnız yerel kayıt) tetikle; duraklat menüsünde konuk için 'Kişisel ilerlemeyi kaydet' göster.

### H17 — Ayarlar'da fare düğmesi atanamıyor; Esc ile atama iptali paneli de kapatıyor
- **Önem:** Orta · **Grup:** H_coop_ui · **Yer:** `js/ui/settingsPanel.js:56` · **Güven:** 0.8
- Kod: `input.captureNext = (code) => { if (code === 'Escape') {...return;} ... };   // input.js:63 canvas.addEventListener('mousedown', ... captureNext ...)  ui.js:18 if (input.captureNext) return;`
- Açıklama: Fare yakalaması yalnız oyun tuvalinin mousedown'unda yapılır; Ayarlar modalı (#modal z-index 40) tuvali örttüğü için tıklama tuvale ulaşmaz → 'yeni tuşa ya da fare düğmesine bas' yönergesine rağmen Mouse0/1/2 atanamaz. Esc ile iptalde input.js'in window keydown işleyicisi önce çalışıp captureNext'i sıfırlar; ui.js'in 'if (input.captureNext) return' koruması artık geçmez ve Esc paneli kapatır.
- Kök neden: Yakalama dinleyicisi tuvale bağlı; iki window keydown işleyicisi arasındaki sıra bağımlılığı.
- Yeniden üretme: Ayarlar > Kontroller > Saldırı'ya tıkla, sol fareye bas → atama olmaz; Esc'e bas → Ayarlar kapanır.
- Önerilen düzeltme: captureNext aktifken window düzeyinde mousedown (capture:true, preventDefault) dinle; ui.js'de Escape kontrolünü 'captureNext || input._justCaptured' ile ertele.

### B-06 — Derinlik penceresi yarışı: prepare() sonrası eski konumun düşük öncelikli yanıtı yeni pencereyi eziyor
- **Önem:** Düşük · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/terrain.js:273` · **Güven:** 0.85
- Kod: `const p = this._request({ t: 'depth', x0, z0, size, res }, force ? -1000 : 50).then((m) => {       this.depthWin = { x0: m.x0, z0: m.z0, size: m.size };`
- Açıklama: prepare(hedef) zorunlu derinlik ister ve çözer; kamera henüz taşınmadığı için aynı/sonraki karede ocean.update → requestDepth(kamera) (ocean.js:259) eski konum için yeni istek açar (hedef penceresi kameradan >520 m). Yanıtlar sıra denetimi olmadan uygulanır: eski konumun yanıtı sonradan gelip depthWin'i ve uHeight dokusunu ezer; düzelme ancak kuyruktaki hires karolar (prio dist−400 < 50) bittikten sonra. Koşu: tuz_pazari'na ışınlanma + 2 s sonra kamera (1757,868) iken derinlik merkezi [0,200]; başlangıca dönüşte kamera (118,189) iken merkez [1760,880]. Bu sürede hedefteki kıyı dalga sönümü/sığ su rengi/köpük yanlış (pencere dışı = −30 m derin). Zorunlu istek `_depthPending`'i ezdiği için eski sözün then'i `_depthPending=null` yapar → yinelenen istekler.
- Kök neden: Yanıtlarda istek sırası/konum doğrulaması yok; prepare odak noktası ile ocean.update kamera konumu farklı.
- Yeniden üretme: /tmp/audit/B_dunya/r1.json 'ada kurulumu' ve 'ada boşaltma' adımlarındaki depthCenter alanı
- Önerilen düzeltme: Depth isteklerine artan sıra numarası ver ve yalnız en yeni isteğin yanıtını uygula; prepare sonrası kamera taşınana kadar requestDepth'i prepare odağına göre çalıştır (terrain.focus) ya da ocean.update'teki isteği prepare sırasında askıya al.

### B-07 — Yeni liman iskelelerine kumsaldan yürüyerek çıkılamıyor (0.87–1.8 m basamak > 0.6 m platform toleransı)
- **Önem:** Düşük · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/ports.js:41` · **Güven:** 0.7
- Kod: `const start = { x: I.x + dx * (coast - 8), z: I.z + dz * (coast - 8) };`
- Açıklama: İskele başı kıyının 8 m içinde; arazi orada 1.10–2.03 m (Node: tuz_pazari 2.03, kuzeyfener 1.50, zumrut_koy 1.10, kul_limani 1.96, kumsaati 1.86) iken güverte/platform üstü 2.9 m (islands.js:438 `_pier(..., 2.9)`). physics.groundAt platformu yalnız `top ≤ ayak+0.6` ise kabul eder (physics.js:89; player.js:213/493 `groundAt(x,z,pos.y)`), güverte için kutu çarpıştırıcı yok → kasabadan iskeleye yürüyen oyuncu güverte modelinin içinden/altından geçer ve iskele altında denize iner; yalnız zıplayarak (vel.y 7.4, player.js:481) çıkabilir. Çekirdek limanda basamak 0.76 m ama kasaba düzlüğü (2.13) güverteye (2.25) bitişik olduğu için yürüme çalışıyor. Koşu: tuz_pazari pierStart arazi 2.02, platform groundAt 2.9.
- Kök neden: İskele yüksekliği sabit (2.9) ve iskele başındaki arazi yüksekliği/ kasaba düzlüğü hesaba katılmıyor; rampa yok.
- Yeniden üretme: node /tmp/audit/B_dunya/mathcheck2.mjs (piers)
- Önerilen düzeltme: Pier başlangıcını kasaba düzlüğüne (h 2.8 flatten) kadar uzat ya da başlangıca eğimli rampa platformu ekle; alternatif: iskele başı için ek 'flatten' modu (h 2.6) ve güverteye kutu çarpıştırıcı.

### B-08 — Tapınak bulmaca/kapı durumu ada boşaltılınca sıfırlanıyor, sunak sandığı 'boş' kalıyor; ada sandık/tutsak durumu kaydedilmiyor
- **Önem:** Düşük · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/islands.js:649` · **Güven:** 0.7
- Kod: `const state = { seq: [], done: false };`
- Açıklama: Levye sırası, kapı açıklığı (`gate`, satır 623) ve BOSS_SITES eklemesi _temple kapanımında yaşar; _drop (DROP_D 1150 m) sonrası yeniden kurulumda kapı kapalı ve sıra sıfır gelir, ama `this.opened` (satır 673) sunak sandığını 'Sandık boş' yapar → oyuncu bulmacayı yeniden çözmek zorunda kalır ve ödül alamaz. opened/freed setleri save() ile de kaydedilmez (islands sisteminde saveKey/save yok) → yeniden yüklemede tüm ada sandıkları yeniden yağmalanabilir (kodda 'oturum boyunca' yorumu var, ancak kayıt sistemiyle çelişiyor).
- Kök neden: Kalıcı durum (bulmaca, sandık, tutsak) kapanım/oturum değişkenlerinde; save/netSnapshot yok.
- Önerilen düzeltme: islands'a saveKey/save()/start(data) ekle (opened, freed, templeSolved); _temple kurulumunda solved ise kapıyı açık kur (gateCol.y1 = -999, gateObj aşağıda).

### B-09 — weatherfx/details: yıldırım malzemesi, istemci hortum geometrisi ve dümen suyu geometrisi dispose edilmiyor
- **Önem:** Düşük · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/weatherfx.js:291` · **Güven:** 0.7
- Kod: `if (b.t > 0.45) { this.scene.remove(b.group); b.group.traverse((o) => o.geometry?.dispose()); this.bolts.splice(i, 1); }`
- Açıklama: Her çarpmada yeni MeshBasicMaterial (satır 192) oluşturulur ama dispose edilmez; applyNet'te (satır 351) kaldırılan hortumun CylinderGeometry'si (28×20 segment) dispose edilmez; details.js Wake.dispose (satır 182) geometriyi bırakmaz. Fırtınada dakikada onlarca yıldırım → uzun oturumda GPU nesnesi birikimi.
- Kök neden: Kaynak ömrü yönetimi eksik.
- Önerilen düzeltme: b.mat.dispose(); applyNet'te s.mesh.geometry.dispose(); Wake.dispose'da this.mesh.geometry.dispose().

### B-10 — _requestTile hata yolunda t.pending daha yeni istek sürerken de sıfırlanıyor → yinelenen karo isteği
- **Önem:** Düşük · **Grup:** B_dunya · **Yer:** `/home/user/SON-HAZ-NE/js/world/terrain.js:222` · **Güven:** 0.75
- Kod: `}).catch(() => { t.pending = 0; });`
- Açıklama: Eski istek reddedilince (işçi 'error' mesajı) `t.req !== myReq` olsa bile pending=0 yapılır; update() aynı seg'i yeniden ister → aynı karo için iki iş kuyruğa girer. Sonuçlardan biri t.req denetimiyle atılır (yanlış uygulama yok), yalnız boşa işçi süresi.
- Kök neden: catch, isteğin güncel olup olmadığını kontrol etmiyor.
- Önerilen düzeltme: catch içinde `if (t.req === myReq) t.pending = 0;`

### C13 — 2.6–3.64 m/s hız bandında ayak kayması: Run klibi 0.7 alt sınırına takılıyor (orta sandık taşıma, savunma/nişan dışı yavaş hareket)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:573` · **Güven:** 0.8
- Kod: `if (this.crouch || hs < 2.6) this._wantAnim('Walk', clamp(hs / 1.9, 0.5, 1.4)); ... else this._wantAnim('Run', clamp(hs / 5.2, 0.7, 1.45));`
- Açıklama: Koşu t2 L: orta sandıkla 2.73 m/s hareket → 'Run' timeScale 0.70 → klibin ima ettiği hız 3.64 m/s (%33 fazla) → ayaklar yere göre kayar. Normal koşu (4.4→0.85) ve eğilme (1.7→Walk 0.89) tam eşleşiyor. Ağır saldırı sırasında 0.66 m/s ile Walk×0.5 (0.95 m/s ima) de aynı sorunu küçük ölçekte yaşıyor.
- Kök neden: İki klip arasında sert eşik ve alt sınır kıskacı; blend yok.
- Yeniden üretme: t2_player.js 'L' adımı carryMedium
- Önerilen düzeltme: Walk→Run eşiğini 3.6 m/s'ye çek ya da 2.4–3.8 arasında iki eylemi ağırlıkla karıştır (crossfade ağırlığı hız oranı), alt sınırı 0.55'e düşür.

### C14 — Güvertede sprint dayanıklılık tüketmiyor (tüketim satırı yalnız _updateGround'da)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:450` · **Güven:** 0.9
- Kod: `if (this.sprinting) this.stamina = Math.max(0, this.stamina - dt * 14);   // _updateGround; _updateDeck'te yok`
- Açıklama: _updateDeck _speedFor ile sprinting=true ve 7 m/s veriyor ama tüketim yok. Koşu t2 K: güvertede 3 s Shift+W → hız 7.0, sprinting=true, stamina 100→100. Yenilenme de kilitli olduğu için stamina sabit kalıyor; bordalama savaşlarında sınırsız sprint.
- Kök neden: Kara mantığının güverte koduna kopyalanmaması.
- Yeniden üretme: t2_player.js 'K' adımı
- Önerilen düzeltme: Tüketimi _speedFor içine (sprinting atanırken) taşı.

### C15 — Güvertede kılıç saldırısı kamera yönüne dönmüyor ('atk' yaw listesinde eksik)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:714` · **Güven:** 0.8
- Kod: `else if (this.aiming || this.blocking || (this.action && ['slash', 'shoot', 'punch'].includes(this.action.type))) this.yaw = dampAngle(this.yaw, tpCamera.yaw, 16, dt);`
- Açıklama: Karada aynı liste 'atk' içeriyor (player.js:454); güvertede yumuşak kilit hedefi yoksa saldırı oyuncunun mevcut yönüne gidiyor, kameraya değil; bordalamada vuruşlar hedefi ıskalar.
- Kök neden: Kombo sistemi eklenirken deck dalı güncellenmemiş.
- Önerilen düzeltme: Listeye 'atk' ekle (ya da iki dalı ortak yardımcıya al).

### C16 — Oyuncunun meşalesi titremiyor (flicker yalnız sağ el 'torch' eşyası için çalışıyor)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/character.js:828` · **Güven:** 0.9
- Kod: `if (this.held && this.heldType === 'torch') { const fl = this.held.userData.flame; ... }`
- Açıklama: Oyuncu meşalesi player.js:112-116'da handL altında c._torchObj olarak tutuluyor; _torch() yalnız this.held için alev ölçeği/ışık yoğunluğu oynatıyor. Koşu t2 T: 0.6 s boyunca 6 örnekte ışık yoğunluğu sabit 18. Mağara/gece aydınlatması cansız kalıyor.
- Kök neden: İki farklı meşale saklama yolu (held vs _torchObj).
- Yeniden üretme: t2_player.js 'T' adımı
- Önerilen düzeltme: _torch() içinde `const t = this.heldType === 'torch' ? this.held : this._torchObj?.visible ? this._torchObj : null` kullan.

### C17 — Misina başlangıç noktası olta ucundan 0.47 m sapıyor (tip, eğik/ötelenmiş iç nesnenin uzayında ama dış gruptan dönüştürülüyor)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/character.js:604` · **Güven:** 0.9
- Kod: `o.userData && (g.userData = o.userData);   // tip=(0,1.7,0) o-uzayında; o.rotation.x=0.25, o.position.y=-0.15`
- Açıklama: fishing.js:257 `p.char.held.localToWorld(tip)` dış grup g üzerinden dönüştürüyor; o'nun 0.25 rad eğimi ve −0.15 m ötelemesi yok sayılıyor. Koşu t2 T: hesaplanan uç ile gerçek uç arası 0.47 m → misina havada boş noktadan başlıyor.
- Kök neden: userData dış gruba kopyalanırken koordinat uzayı değişimi hesaba katılmamış.
- Yeniden üretme: t2_player.js 'T' adımı
- Önerilen düzeltme: fishing.js'de `held.children[0].localToWorld(tip.clone())` kullan ya da hold() içinde tip'i g uzayına dönüştürüp sakla.

### C18 — Yüzerken ekipman kuşanılabiliyor ve silah elde beliriyor (enterWater'ın gizlemesini bozar)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:83` · **Güven:** 0.85
- Kod: `equip(slot) { if (this.carrying) return; ... this.char.hold(this.equipped === 'none' || this.equipped === 'map' ? null : this.equipped); ... }`
- Açıklama: equip() mod kontrolü yapmıyor. Koşu t3 E2: yüzerken heldType null iken p.equip('sword') → heldType 'sword' (kılıç suda elde). Savaş girişi zaten kilitli (combat.js:91) ama görsel tutarsız; exitWater sonrası tekrar hold aynı türe erken döner (sorun yok).
- Kök neden: Mod farkındalığı yok.
- Yeniden üretme: t3_player.js 'E2' adımı equipInSwim_showsWeapon
- Önerilen düzeltme: equip()'te mode 'swim'/'climb'/'boat' iken yalnız this.equipped'i güncelle, hold'u exitWater'a bırak.

### C19 — Ragdoll sonrası dirilişte ayağa kalkış animasyonu yok (koşul tersine görünüyor), Idle'a anlık sıçrama
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:222` · **Güven:** 0.6
- Kod: `if (!wasRag && (this.mode === 'ground' || this.mode === 'deck')) this.startAction('getup', 1.1); else this.char.play('Idle', 0.2);`
- Açıklama: Ragdoll ile yerde yatan beden (solo ölüm → respawn, main.js:223) revive'da doğrudan Idle'a geçiyor; yalnız Death animasyonuyla düşen (co-op downed) oyuncu LieUp oynatıyor. Koşu t2 D afterRevive: anim 'Idle', action null. Görsel sıçrama.
- Kök neden: wasRag koşulunun amacı belirsiz; ragdoll'dan çıkışta kalkış animasyonu daha gerekli.
- Önerilen düzeltme: Her iki durumda getup oynat; ragdoll'da son kalça yönelimini kullanıp bedeni yere yatık poza (Lie_Idle) 0.2 s karıştırarak başlat.

### C20 — Etkileşim: aday değişince _armed sıfırlanmıyor → E basılı gezinirken yeni sandık istemsiz açılabilir
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/game/interact.js:51` · **Güven:** 0.6
- Kod: `if (!this._armed && input.pressed('etkilesim')) this._armed = true; if (this._armed) { this.holdT += dt; ...`
- Açıklama: 44-45. satırlar aday değişiminde yalnız holdT'yi sıfırlıyor; _armed true kalıyor. holdAction'lı bir adaydan uzaklaşıp E basılıyken başka bir sandığa yaklaşınca yeni basış olmadan holdT dolup holdAction (sandık aç) tetiklenir; holdAction dalında input.consume yapılmıyor.
- Kök neden: Durum (armed) aday kimliğine bağlanmamış.
- Önerilen düzeltme: Aday id değişince `this._armed = false`; holdAction dalında da consume('etkilesim').

### C21 — Downed (yerde yardım bekleyen) oyuncu etkileşim yapabiliyor (dümene geçme, sandık açma)
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/game/interact.js:23` · **Güven:** 0.6
- Kod: `if (!p || p.dead || G.uiOpen) { this.current = null; this.holdT = 0; G.emit('prompt', null); return; }`
- Açıklama: player.js:316 hareketi downed için kilitliyor ama interact.update yalnız dead'i kontrol ediyor; co-op'ta yerde yatan oyuncu E ile dümen/top kilidi alabilir, kayığa binebilir (mode değişir, revive sonrası garip durum).
- Kök neden: downed durumu interact'a yansıtılmamış.
- Önerilen düzeltme: Koşula `|| p.downed` ekle.

### C22 — Zehir downed durumda canı sıfırın altına düşürmeye devam ediyor
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:309` · **Güven:** 0.6
- Kod: `if (this.poison > 0) { this.poison -= dt; if (!this.dead) this.hp -= dt * 2.2; if (this.hp <= 0) this.die('Zehirlendin'); }`
- Açıklama: downed iken dead=false → hp azalmaya devam eder; die() downed'da erken döner → hp negatif değerlere iner (HUD çubuğu/ses), playerHurt yayılmaz. revive hp'yi 45'e çeker ama bu arada tutarsız.
- Kök neden: downed durumu zehir dalında ele alınmamış.
- Önerilen düzeltme: `if (!this.dead && !this.downed)` ve hp'yi 0'da kıstır.

### C23 — Dümen/top modları geminin batmasını kontrol etmiyor: oyuncu gemiyle birlikte su altına iniyor, suya geçiş yok
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:727` · **Güven:** 0.6
- Kod: `_updateHelm(dt, locked) { const s = this.ship; if (!s) { this.mode = 'ground'; return; } ... }`
- Açıklama: _updateDeck `s.sunk` kontrolüyle leaveShipToWorld yapıyor (player.js:666) ama _updateHelm/_updateCannon yalnız `!s` bakıyor. Batan geminin dümenindeki oyuncu localToWorld ile su altına iner; oksijen mantığı yüzme modunda olduğundan boğulmaz da, E ile 'Dümeni bırak' deyince deck→sunk→suya geçer.
- Kök neden: Batma dalı istasyon modlarına eklenmemiş.
- Önerilen düzeltme: Her iki fonksiyonda `if (!s || s.sunk) { shipControl.leaveStation(this); return; }`.

### C24 — Küpeşteden atlarken fallStartY = w.y + 5 düşme mesafesini şişiriyor; karaya/iskeleye inince gereksiz düşme hasarı
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/player.js:704` · **Güven:** 0.55
- Kod: `this.fallStartY = w.y + 5; // suya düşüşte hasar yok`
- Açıklama: Suya düşüşte zemin dalı hiç çalışmadığından (enterWater önce gelir) +5 gereksiz; iskeleye/kıyıya inildiğinde ise fall = w.y+5−g hesaplanır (player.js:511-513) → 7 m eşiği kolayca aşılır (örn. güverte 3 m + 5 − zemin 0.3 = 7.7 → 4.9 hasar) oysa gerçek düşüş 2.7 m.
- Kök neden: Yorumla kodun etkisi ters (düşme yüksekliğini artırıyor).
- Önerilen düzeltme: Satırı `this.fallStartY = w.y` yap (leaveShipToWorld zaten ayarlıyor); suya düşüş zaten hasarsız.

### C25 — ONCE_RE, yerelde döngü olarak oynatılan 'Heavy2H' (kazı) ve 'Interact' (busy) kliplerini uzak oyuncuda tek seferlik sayıyor → tek sallama sonra donma
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/core/kk.js:51` · **Güven:** 0.6
- Kod: `const ONCE_RE = /Slash|Shoot|Punch|Interact|Roll|Hit|Death|Wave|Atk|Heavy|Counter|Spin|Stab|Chop|Slice|Dodge|Parry|Kick|Reload|Cast|Summon|Pick|Use|Throw|Taunt|Cheer|Jump_?Start|JumpStart|JumpLong|JumpShort|Land|Down|Up$`
- Açıklama: player.js:252 Heavy2H'yi once=false (döngü) oynatıyor, startBusy 'Interact'ı döngü oynatıyor; net.js:97 uzak tarafta `isOnce(t.anim)` ile clampWhenFinished → 2.6 s kazı boyunca uzak oyuncu ilk sallamadan sonra son karede donuk kalır.
- Kök neden: Tek seferlik/döngü bilgisi ada göre regex ile çıkarılıyor, netState gerçek loop modunu göndermiyor.
- Önerilen düzeltme: netState'e `loop: !!(char.current && char.current.loop === LoopRepeat)` ekle ve RemotePlayer bunu kullansın.

### C26 — Sandık alırken equipped='none' yapılıyor ama 'equip' olayı yayılmıyor → hotbar vurgusu eski slotta kalıyor
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/treasure/treasure.js:312` · **Güven:** 0.6
- Kod: `p.equipped = 'none'; p.char.hold(null); p.torch = false; p._syncTorch();`
- Açıklama: hud.js:44 `G.on('equip', () => this._hotbarActive())` yalnız Player.equip() üzerinden tetikleniyor; _applyCarry doğrudan alanı yazıyor. Kılıç seçiliyken sandık kaldıran oyuncunun HUD'u kılıcı seçili gösterir; bırakınca da equip 'none' kalır ama vurgu eskidir.
- Kök neden: Ekipman durumu birden fazla yerden yazılıyor, olay yalnız birinden yayılıyor.
- Önerilen düzeltme: _applyCarry'de `p.equip('none')` kullan ya da `G.emit('equip', 'none')` ekle.

### C27 — Inventory.add: data verilen ve n>1 olan eklemede yalnız 1 adet eklenir ama 0 (hepsi eklendi) döner
- **Önem:** Düşük · **Grup:** C_oyuncu · **Yer:** `js/player/inventory.js:38` · **Güven:** 0.7
- Kod: `for (let i = 0; i < (data ? 1 : n); i++) this.stacks.push({ id, n: 1, data: data ? { ...data } : undefined }); ... return 0;`
- Açıklama: canAdd data.weight'i tek adet için sayıyor, add ise n'i yok sayıp tek yığın ekliyor ve 0 döndürüyor; giveItems (treasure.js:498-500) 'rest' hesabı yanlış olur. Bugün data'lı eklemeler (balık, harita) n=1 ile çağrılıyor; gizli hata.
- Kök neden: data'lı eklemede n parametresi ele alınmamış.
- Önerilen düzeltme: data varsa n kadar ayrı yığın ekle (ağırlığı n ile çarp) ya da n>1'de n−1 döndür.

### D-06 — Oyuncunun eğim kayması kontrolü physics.lastPlatform'u bayat okuyor (önceki karenin son groundAt çağrısı: hayvan/düşman/cisim)
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/player/player.js:471` · **Güven:** 0.8
- Kod: `if (this.onGround && !physics.lastPlatform) { const gn = terrain.normalAt(this.pos.x, this.pos.z, _v2); if (gn.y < 0.68) { ... this.vel.x += gn.x * slide * dt * 4; ...`
- Açıklama: physics.lastPlatform global ve groundAt'i çağıran son sistem tarafından yazılır (bodies._step, enemies._place, animals, npcs). Oyuncu update'i karenin başında çalıştığı için bu satır bir önceki karede en son kimin groundAt çağırdığına bağlı. Koşu: oyuncu iskele platformunda dururken DK.sim(1/30) sonrası physics.lastPlatform=null (27 hayvan güncellendi), oyuncunun kendi groundAt çağrısı 'pier' döndürüyor. Sonuç: platform üstündeki oyuncuya platform altındaki arazinin normali uygulanır (iskele altında n.y min 0.957 olduğundan limanda görünmez; dik yamaç üstündeki ada rıhtımı/tapınak sunağında kayma oluşur); tersi durumda dik yamaçta bir kare kayma atlanır.
- Kök neden: Çağrı sonucu global yan etki olarak taşınıyor; 497. satırdaki kullanım aynı karedeki gOld çağrısına dayandığı için doğru, 471 değil.
- Yeniden üretme: Oyuncuyu iskeleye koy; DK.sim(1/30); DK.physics.lastPlatform → null; DK.physics.groundAt(p.pos.x,p.pos.z,p.pos.y); DK.physics.lastPlatform.tag → 'pier'
- Önerilen düzeltme: Kayma kontrolünü 509'daki g=groundAt(...) çağrısının hemen ardına taşıyın ya da bir önceki karede this.onPlatform=!!physics.lastPlatform kaydedip onu kullanın; uzun vadede groundAt bir {g, platform} nesnesi döndürsün.

### D-07 — Hızlı cisimler yürünebilir platformlardan geçiyor (30 fps'te >27 m/s; fıçı enkazı her zaman)
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/world/bodies.js:123` · **Güven:** 0.8
- Kod: `const g = physics.groundAt(p.x, p.z, p.y - b.r + 0.3);   // physics.js:89 if (p.top > yFeet + step) continue;  → taban platform üstünün 0.9 m altına inerse platform yok sayılır`
- Açıklama: Platform adayı testi yalnız 0.9 m'lik bir pencere (0.3+0.6) kabul ediyor; bir adımda bu pencereden daha fazla inen cisim platformu kaçırır ve arazi/suya düşer. Koşu (iskele, top 2.25): v=40 m/s, dt=1/30 → 1.85 m yukarıdan bırakılan cisim iskeleden geçti (y=1.49), 2.0 m'den bırakılan yakalandı (faz bağımlı, olasılık (adım-0.9)/adım ≈ %34); dt=1/60 → yakalandı. Fıçı enkazı 90+ m/s dikey hızla iner → her zaman deler. Oyuncu için aynı yapı (groundAt(nx,nz,pos.y), pencere 0.6): 30 fps'te 18 m/s'den hızlı düşüş (7.4 m'den yüksekten düşme) ya da dt≥0.07 platformu kaçırır.
- Kök neden: Platform yakalama, konum örneklemesine dayanıyor; önceki konumdan süpürme yok, pencere sabit.
- Yeniden üretme: pier=DK.physics.platList.find(p=>p.tag==='pier'); bodies.add(mesh,{pos:(pier.x,pier.top+1.85,pier.z), vel:(0,-40,0), radius:0.15}); DK.sim(1.5,1/30) → pos.y < pier.top
- Önerilen düzeltme: groundAt çağrısında yFeet olarak önceki karedeki taban yüksekliğini (max(prevBottom, bottom)) verin ya da 'prevY üstte, newY altta' kesişim testi yapın; bodies için adım başına |v*dt| > 0.6 ise alt adım sayısını artırın.

### D-08 — Sprint yapan oyuncu uzun bir karede (dt ≥ ~0.069 s) ince duvar/mezar/levha çarpıştırıcılarından geçiyor
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/player/player.js:507` · **Güven:** 0.9
- Kod: `this.pos.y += this.vel.y * dt; physics.resolve(this.pos, 0.33, this.pos.y);   // physics.js:126-130 merkez kutu içindeyse en yakın kenara itilir`
- Açıklama: resolve tek konum örneği alır; adım (7 m/s × dt) yarıçap+yarı kalınlık (0.33+0.15=0.48 m) değerini aşarsa merkez duvarın orta düzlemini geçer ve 'en yakın kenar' karşı taraf olur. Koşu (hw 0.15 duvar): dt=1/30 → 0.48 m'de durdu; dt=0.077 → geçti; dt=0.1 (engine tavanı) → geçti. Etkilenen çarpıştırıcılar: port.js:359 mezar (hd 0.2), :337 levha (hd 0.2), islands.js:361 duvarlar (min 0.2), lamba r 0.15. Tek bir arazi karosu yükleme takılması bile yeterli.
- Kök neden: Süpürmesiz ayrık çarpışma; dt tavanı 0.1 s hızlı hareketle birleşince adım>yarıçap.
- Yeniden üretme: P.addBox(x+6,z,0.15,3,0,h-1,h+3); input.down.add('KeyW'); input.down.add('ShiftLeft'); DK.sim(3,0.1) → pos.x duvarın ötesinde
- Önerilen düzeltme: Oyuncu/düşman hareketini |v*dt| > 0.3 m olduğunda alt adımlara bölün (n=ceil(|v*dt|/0.3)) ya da 'merkez içeride' dalında bir önceki konuma göre taraf seçin (sign((prev-c)·n)).

### D-09 — Uyuyan cisim çift çarpışma düzeltmesiyle uyandırılmadan itiliyor (havada/zeminde asılı kalabilir)
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/world/bodies.js:187` · **Güven:** 0.85
- Kod: `a.pos.addScaledVector(_n, pen * ia / (ia + ib)); b.pos.addScaledVector(_n, -pen * ib / (ia + ib)); const vrel = ...; if (vrel < 0) { ... a.wake(); b.wake(); }`
- Açıklama: Pozisyon düzeltmesi her çiftte uygulanır ama wake() yalnız vrel<0 iken çağrılır. Uyuyan cisim (_step çalışmaz: yerçekimi/zemin yok) hızsız bir komşu tarafından kaydırılırsa yeni konumda zemine oturmadan kalır. Koşu: uyuyan cisim üstüne hızsız cisim konuldu → 10 karede 5 cm itildi, uyku durumu 'ssssssssss'. Eğim/kenar/su üstünde itilince havada asılı ya da zemine gömülü kalır; ayrıca islandDropped/removeTag ile platformu kaldırılan uyuyan cisimler uyandırılmaz.
- Kök neden: Uyku tanımı yalnız kendi hızına bakıyor; dış konum değişikliği uyandırma saymıyor.
- Yeniden üretme: A=bodies.add(...); DK.sim(2); B=bodies.add(... pos A+0.3); DK.sim(0.3); A.sleeping===true && A.pos değişti
- Önerilen düzeltme: Pozisyon düzeltmesi pen>1e-3 ise ilgili cismi wake() edin (ya da sleepT'yi sıfırlayın); physics.removeTag/platform değişiminde yakın cisimleri uyandırın.

### D-10 — Gülle isabet testleri nokta örneklemesi: büyük hedef (combat) ve gemi kutusu (effects) için prev→pos süpürmesi yok
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/game/effects.js:170` · **Güven:** 0.6
- Kod: `if (Math.abs(lp.z) < s.T.L / 2 + 0.3 && Math.abs(lp.x) < s.T.B / 2 + 0.2 && lp.y > -1.5 && lp.y < s.T.deckY + 2.5) hit = ...   // combat.js:58 if (_v.distanceTo(e.pos) < t.radius + 0.6)  (e.prev kullanılmıyor)`
- Açıklama: 58 m/s gülle 1/30'da 1.9 m, dt tavanı 0.1'de 5.8 m adım atar. Sloop gövde kutusu 4.8 m, dokunaç hedefi 1.3+0.6 → 3.8 m çap: 1/30'da güvenli, uzun karelerde (≤10 fps) bordadan geçiş ve dokunaç/sütun ıskalaması mümkün. projectileTest olayı prev konumunu taşıyor ama hiçbir dinleyici kullanmıyor.
- Kök neden: Ayrık nokta testi; süpürme bilgisi (prev) yok sayılıyor.
- Yeniden üretme: G.visualOnlyBalls=false; dt=0.1 ile gemiye bordadan 10 gülle at ve isabet oranını 1/60 ile karşılaştır.
- Önerilen düzeltme: Gemi kutusu için yerel uzayda prev→pos doğru parçası–kutu kesişimi (slab) ve büyük hedefler için segSegDist(prev,pos, hedef ekseni) kullanın.

### D-11 — Yuvarlanan kaya, ezmek üzere olduğu fıçı/sandık çarpıştırıcısından önce sekiyor (resolve, ezme kontrolünden önce)
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/world/hazards.js:364` · **Güven:** 0.6
- Kod: `if (physics.resolve(_v, r * 0.85, g + 0.2, r * 1.6)) { ... if (vn < 0) { v.x -= 1.5 * vn * nx / nl; ...; v.multiplyScalar(0.7); ... } }   // ezme: :382-391 aynı karede sonra`
- Açıklama: Fıçı (r≈0.35) ve sandık (0.5) 'hz:' daire çarpıştırıcıları resolve içinde kayayı geri iter ve hızını %30 keser; aynı karede ezme kontrolü hedefi vurup kırar ama sekme çoktan olmuştur: 2.7 m'lik kaya küçük bir sandıktan sekip rotadan çıkar. Çevrimiçi oyunda her istemci kayayı kendi simüle eder; bir tarafta kırılmış/kaldırılmış çarpıştırıcı diğer tarafta duruyorsa yörüngeler ayrışır (hasar yalnız ev sahibinde).
- Kök neden: Ezme ve çarpışma sırası; kırılabilir hedeflerin çarpıştırıcıları kaya için filtrelenmiyor.
- Yeniden üretme: Kamp adasında kayayı sandığa doğru serbest bırak; hız/yön kırılmasını izle (test ortamında kaya kurulmadı).
- Önerilen düzeltme: Ezme kontrolünü resolve'dan önce yapın ve o karede kırılan hedefleri (tag 'hz:') resolve'dan dışlayın (resolve'a tag filtresi); ağda kaya konumunu ev sahibinden yayınlayın.

### D-12 — Yuvarlanan kayanın çarpıştırıcısı yok: oyuncu/düşman kayanın içinde durabilir, tek darbeden sonra itilmez
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/world/hazards.js:340` · **Güven:** 0.7
- Kod: `release(h) { ... h.state = 'roll'; physics.removeTag(h.tag); ...   // :393 if (pl && ... && !h.hit.has(pl) && hypot(...) < r + 0.4)`
- Açıklama: Serbest bırakılınca daire çarpıştırıcısı kaldırılır ve ancak durunca (slowT>1.5) geri eklenir. Ezme her hedefe bir kez uygulanır (h.hit Set); sonra oyuncu 1.35 m yarıçaplı kayanın içinde yürüyebilir, kaya ona itme uygulamaz. Kaya 'rest'e geçerken oyuncu içindeyse yeni çarpıştırıcı oyuncuyu bir sonraki resolve'da aniden 1.5 m dışarı fırlatır.
- Kök neden: Hareketli çarpıştırıcı yok; statik dünya ve etkileşim ayrı.
- Yeniden üretme: Kayayı serbest bırak, oyuncuyu yoluna koy; ilk darbeden sonra kayanın merkezine yürü.
- Önerilen düzeltme: Yuvarlanırken her kare oyuncu/düşmanları kayanın dairesinden dışa itin (crowd benzeri pen düzeltmesi) ya da kayanın daire çarpıştırıcısını her kare taşıyın (c.x/c.z güncelle + hücre yeniden ekleme).

### D-13 — Yürünebilir platformların yan yüzü yok: 0.6 m'den yüksek platforma (tapınak sunağı ~5 m, ada rıhtımı) yandan girilince oyuncu bloğun içinde yürüyor
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/world/physics.js:69` · **Güven:** 0.6
- Kod: `addPlatform(x, z, hw, hd, yaw, top, tag = null) { const p = { x, z, hw, hd, ... top, tag }; this._insert(this.platforms, p, ...   // islands.js:641 physics.addPlatform(cx, cz - 12, 6, 6, 0, y0 + 5.1 * S * 0.98, B.tag) ; `
- Açıklama: groundAt, ayakların 0.6 m üstündeki platformları yok sayar ve platformun kutu çarpıştırıcısı yoktur; oyuncu platform hacmine yandan girip arazide yürür (üstündeki zemin görsel olarak başının üstünde kalır). Tapınak sunağı için rampa/basamak primitifi yok ('kk:dungeon:stairs_wide' col'suz yerleştiriliyor), sunağa çıkış fizikte tanımsız. Liman iskelesi (2.25 m) su/kumsal üstünde olduğu için sorun görünmüyor.
- Kök neden: Platform primitifi yalnız üst yüzey; basamak/rampa primitifi yok.
- Yeniden üretme: Tapınak adasında sunağa (cx, cz-12) yandan yürü; pos.y platform üstünün 5 m altında kalır.
- Önerilen düzeltme: addPlatform ile birlikte y1=top olan bir addBox ekleyin (yan yüz) ve basamaklar için eğimli platform (top(lx,lz) = a+b*lz) ya da birkaç kademeli ince platform (≤0.5 m adım) kullanın.

### D-14 — Düşmanlar için etkin basamak yüksekliği 1.6 m (oyuncu 0.65): platformlara ve yüksek çıkıntılara zıplamadan 'ışınlanır'
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/game/enemies.js:1177` · **Güven:** 0.7
- Kod: `} else y = physics.groundAt(this.pos.x, this.pos.z, this.pos.y + 1);   // step 0.6 → pos.y+1.6'ya kadar platform kabul`
- Açıklama: yFeet=pos.y+1 verildiği için düşman ayağının 1.6 m üstündeki platforma anında oturur; eğim sınırı da yoktur (oyuncu n.y<0.6'da tırmanamaz, kayar). İskele/rıhtım/sunak kenarında düşman oyuncunun ulaşamadığı yere çıkar ya da tersine kenardan oyuncunun üstüne 'atlar'. Oyuncu ve düşman arasında ulaşılabilirlik (reachable) kuralları tutarsızlaşır.
- Kök neden: Platform adayı penceresi için keyfi +1 ofset.
- Yeniden üretme: Düşmanı 1.4 m yüksek platformun dibine çek; bir karede üstüne çıkar.
- Önerilen düzeltme: groundAt(this.pos.x, this.pos.z, this.pos.y) (0.6 m basamak) kullanın; dik yamaçta (n.y<0.6) hareket vektörünü oyuncudaki gibi kısıtlayın.

### D-15 — Düşman alay zamanlayıcısı kare sayıyor: tauntT -= 0.016 (60 fps varsayımı)
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/game/enemies.js:867` · **Güven:** 0.9
- Kod: `this.tauntT = (this.tauntT || 4) - 0.016;`
- Açıklama: _meleeOrStrafe her _act çağrısında sabit 0.016 düşer; 30 fps'te süre 2×, uzak LOD adımında (edt 0.066–0.25) 4–15× uzar. Kozmetik (ulaşılamayan hedefe alay animasyonu).
- Kök neden: dt parametresi bu fonksiyona geçirilmiyor.
- Yeniden üretme: Statik: fonksiyon imzasında dt yok.
- Önerilen düzeltme: _meleeOrStrafe(tgt, d, reachable, boost, dt) ile dt geçirip tauntT -= dt yapın.

### D-16 — Dik yamaçta tırmanma engeli kare başına sabit çarpan kullanıyor (vel*0.2, pos += n*0.02)
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/player/player.js:499` · **Güven:** 0.85
- Kod: `this.vel.x = this.vel.x * 0.2 + n.x * 1.5; this.vel.z = this.vel.z * 0.2 + n.z * 1.5; this.pos.x += n.x * 0.02; this.pos.z += n.z * 0.02;`
- Açıklama: Çok dik yamaca (n.y<0.6) itilen oyuncunun hızı her karede %80 kesilip 1.5 m/s geri itme ekleniyor ve konum 2 cm kaydırılıyor: 60 fps'te 30 fps'in iki katı geri kayma hızı (2 cm×60=1.2 m/s vs 0.6 m/s). Kayma ivmesi (471-478) ise doğru dt ölçekli.
- Kök neden: Kare başına sabit miktar entegrasyonu.
- Yeniden üretme: Statik: ifade dt içermiyor.
- Önerilen düzeltme: vel = damp(vel, n*1.5, 20, dt) ve pos += n * 1.2 * dt biçiminde dt ölçekleyin.

### D-17 — resolve tek geçişli: köşe/dar aralıkta A'dan çıkarken B'ye gömülme, bitişik çarpıştırıcılar arasından sıkışıp geçme
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/world/physics.js:104` · **Güven:** 0.6
- Kod: `for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { ... if (seen.has(c)) continue; seen.add(c); ... pos.x = c.x + (dx / d) * m; ...`
- Açıklama: Her çarpıştırıcı bir kez işlenir ve itme sonrası diğerleri yeniden kontrol edilmez; hücre aralığı da başlangıç konumuna göre hesaplanır. İç köşede (iki duvar) oyuncu bir karede A'dan çıkıp B'ye gömülür, sonraki karede tersi → titreme; iki ağaç 2r'den az aralıklıysa A'nın itmesi merkezi B'nin içine düşürüp B'nin karşı tarafına itebilir (sıkışarak geçiş). Çağrı yerleri: oyuncu, düşman, cisim, kaya, blok.
- Kök neden: Gauss-Seidel yinelemesi yok (tek iterasyon).
- Yeniden üretme: İki kutu çarpıştırıcıyla L köşe oluştur; oyuncuyu çapraz köşeye yürüt ve pos titremesini ölç.
- Önerilen düzeltme: resolve'u hit olduğu sürece en fazla 3 kez yineleyin (seen'i her turda sıfırlayın) ya da en büyük penetrasyonu seçip tekrarlayın.

### D-18 — Dünya sınırı yalnız gemiler için var; yüzen oyuncu ve kürek sandalı 20 km haritanın dışına çıkabiliyor
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/ship/ship.js:370` · **Güven:** 0.7
- Kod: `const lim = WORLD_HALF - 250; if (Math.abs(this.x) > lim || Math.abs(this.z) > lim) { this.x = clamp(...) ... }   // player.js _updateSwim ve Rowboat.update'te sınır yok`
- Açıklama: Ship.update 9750 m'de kıstırır ve 'edge' olayı yollar; yüzücü (2.8–4 m/s) ve sandal için eşdeğer kısıt yok. terrain.heightAt HALF dışında SEA_FLOOR döndürdüğü için çökme olmaz ama sonsuz düz okyanusta ilerleme, kayıt/ağ konumlarında anlamsız değerler ve megafauna/olay sistemlerinin kapsama alanı dışına çıkma mümkün.
- Kök neden: Sınır kontrolü tek varlıkta kodlanmış.
- Yeniden üretme: p.mode='swim'; p.pos.set(9900, -1, 0); DK.sim(60) ile x artmaya devam eder (uzun koşu, yapılmadı).
- Önerilen düzeltme: Ortak clampWorld(pos) yardımcısı; _updateSwim/_updateGround ve Rowboat.update'te lim'e kıstırıp aynı 'edge' bildirimini verin.

### D-19 — Deniz bossları (Derinlik Yılanı, Lanetli Amiral hayalet gemisi) arazi/karaya oturma kontrolü yapmıyor; adaların üstünden geçebiliyor
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/game/bosses.js:511` · **Güven:** 0.6
- Kod: `this.pos.x += Math.sin(this.yaw) * v * dt; this.pos.z += Math.cos(this.yaw) * v * dt; } this.pos.y = damp(this.pos.y, wantY, 2, dt);   // :961 gs.x += Math.sin(gs.yaw) * sp * dt (kinematik gemi, _grounding yok)`
- Açıklama: Yılan gemiyi 48 m yarıçapla çevreler ve 19–25 m/s hücum eder; kinematik hayalet gemi 46 m daire çizer. Kıyıya yakın (tetik d<240) savaşta her ikisi kara üstünden/içinden geçer. Oyun mantığı bozulmaz (hasar kutu testleri gemiye göre), görsel/inandırıcılık sorunu.
- Kök neden: Kinematik hareket; terrain.heightAt kontrolü yok.
- Yeniden üretme: Kıyıya 100 m mesafede boss tetikle; yılanın pos'u için terrain.heightAt > 0 kareleri say.
- Önerilen düzeltme: Hedef noktada terrain.heightAt > ocean.tide - 2 ise açıya ±0.4 rad sapma ekleyip yeniden deneyin; hayalet gemi için Ship._grounding'i kinematik modda da çağırın (hasarsız).

### D-20 — Kalabalık itişmesinde güvertedeki oyuncu ajan değil: bordalama düşmanları oyuncunun içinden geçiyor
- **Önem:** Düşük · **Grup:** D_fizik · **Yer:** `js/game/crowd.js:17` · **Güven:** 0.7
- Kod: `if (p.mode === 'ground' || p.mode === 'swim') agents.push({ pos: p.pos, r: 0.36, m: 1, dyn: true, y: p.pos.y });`
- Açıklama: Gemi düşmanları (e.ship) dünya konumlarını her kare local'den yeniden türettiği için crowd'un e.pos düzeltmesi etkisiz, oyuncu 'deck' modunda listeye girmiyor → güvertede düşman ve oyuncu tam üst üste binebilir; vuruş açıları/menzilleri tutarsızlaşır. Karada ayrışma çalışıyor (statik).
- Kök neden: Güverte için yerel koordinat tabanlı itişme yok.
- Yeniden üretme: Bordalama sırasında düşmanla oyuncu local konum farkını ölç (<0.3 m uzun süre).
- Önerilen düzeltme: Ship-local ajan listesi: oyuncu (local) ve e.local'ler arasında aynı pen düzeltmesini uygulayıp clampDeck ile sınırlayın.

### E-10 — Batan gemide güvertedeki oyuncu suyun altına inip 'sunk'a kadar (≈10 s) yüzmeye geçmiyor
- **Önem:** Düşük · **Grup:** E_gemi · **Yer:** `js/player/player.js:666` · **Güven:** 0.9
- Kod: `_updateDeck(dt, locked) {     const s = this.ship;     if (!s || s.sunk) { this.leaveShipToWorld(this.pos.clone(), new THREE.Vector3()); return; }   // batarken (sinking) kontrol yok`
- Açıklama: Gemi 14 s boyunca batıyor (ship.js:531-536, y −sinking²·0.12); bu sürede güvertedeki oyuncu deck modunda su altına iniyor, yüzme/oksijen devreye girmiyor, kamera su altında kalıyor; 'hemen terk et' uyarısına rağmen oyuncu ancak küpeşteden zıplayarak çıkabiliyor.
- Kök neden: Deck modu su yüzeyi ile kıyaslama yapmıyor; sadece sunk bayrağı var.
- Yeniden üretme: Koşu 1 'sinking-deck' a: su=100, 9 s sonra oyuncu y=-8.23 (yüzey +0.3), mode 'deck', underwater false, oxygen 100, gemi y=-9.1; 15.5 s'de sunk → swim, y=-22.9.
- Önerilen düzeltme: _updateDeck'te `if (s.sinking && this.pos.y < ocean.heightAt(this.pos.x, this.pos.z) - 0.5) { this.leaveShipToWorld(this.pos.clone(), new THREE.Vector3(s.vx||0,0,s.vz||0)); this.enterWater(); return; }`.

### E-11 — raiseShip kurtarılan gemideki yangınları ve çapa noktasını sıfırlamıyor
- **Önem:** Düşük · **Grup:** E_gemi · **Yer:** `js/game/events.js:387` · **Güven:** 0.85
- Kod: `s.sunk = false; s.sinking = 0; s.root.visible = true;     s.hp = s.maxHp * 0.6; s.water = 0; s.holes = []; s._syncHoles();     s.x = port.mooring.x; s.z = port.mooring.z; s.yaw = port.mooring.yaw;   // fires, anchorPt, _`
- Açıklama: Gemi batıkken update() erken döndüğü için yangınlar dondurulmuş halde saklanır; kurtarma sonrası aynı yangınlar limanda yeniden yanmaya başlar (hp −0.35·s/s, yayılma) ve 'Usta Bora gemini kurtardı' denen gemi iskelede tekrar batabilir. anchorPt eski battığı yerde kalır (ana limanda Ship.dock maskeler, bkz. E-01).
- Kök neden: Kurtarma fonksiyonu gemi durumunun tamamını değil bir alt kümesini sıfırlıyor.
- Yeniden üretme: Statik: ship.js:268 `if (this.sunk) return;` yangın güncellemesini durdurur; events.js:382-393 fires'ı temizlemez.
- Önerilen düzeltme: `s.fires = []; s.anchorPt = null; s.vx = s.vz = 0; s.yawRate = 0;` ekle; isteğe bağlı olarak parça/direk durumunu da en az kullanılabilir seviyeye çek veya 'tamir gerekir' uyarısı ver.

### E-12 — Oyuncu gemisi batıkken düşman gemisi her kare iki kez güncelleniyor (çift hız)
- **Önem:** Düşük · **Grup:** E_gemi · **Yer:** `js/game/events.js:256` · **Güven:** 0.9
- Kod: `if (!me || me.sunk) { e.setRudder(0.3); e.update(dt); return; } // game.js:190: if (G.isHost || !G.online || s.kinematic) s.update(dt);   // aynı gemi burada da güncelleniyor`
- Açıklama: game.update tüm G.ships için s.update(dt) çağırıyor; _updateEnemyShip oyuncu gemisi yokken/batıkken e.update(dt) ile ikinci kez fizik adımı atıyor → düşman gemisi iki kat hızlı hareket ediyor ve çift sızıntı/yangın hasarı alıyor.
- Kök neden: Sistem içinde gereksiz ek fizik çağrısı.
- Yeniden üretme: Statik: game.js:189-194 ile events.js:256 karşılaştırması.
- Önerilen düzeltme: `e.update(dt)` çağrısını kaldır; yalnız `e.setRudder(0.3); return;`.

### E-13 — sunk/sinking kayda yazılmıyor: batık gemiyle kaydedilen oyun yüklenince gemi yüzeyde belirip yeniden batıyor
- **Önem:** Düşük · **Grup:** E_gemi · **Yer:** `js/ship/ship.js:687` · **Güven:** 0.8
- Kod: `serialize() {     return { id, typeId, name, look, upg, x, z, yaw, hp: this.hp, water: this.water, holes: this.holes, hold, cannonballs, planks, sailTarget, parts, mastHp, cannonHp, anchorState: ... };   // sunk / sinkin`
- Açıklama: Batmış gemi water=100, hp=0 ile kaydediliyor; yüklemede kurucu sunk=false ile gemiyi battığı koordinatta yüzeyde oluşturuyor, ilk update'te water≥100 → 'sinking' olayı ve 'GEMİ BATIYOR' uyarısı tekrar oynuyor, 14 s sonra 'battı' bildirimi ve hold.chests tekrar siliniyor. Oyuncu batan güvertede kaydettiyse (onShip true) yeniden güverteye konup birlikte batıyor.
- Kök neden: Kayıt şeması batma durumunu içermiyor.
- Yeniden üretme: Koşu 1 'save-roundtrip': serialize çıktısında 'sunk' ve 'sinking' anahtarı yok (serSunkFlag false). Davranış zinciri statik (ship.js:293, 536; events.js:366-376).
- Önerilen düzeltme: serialize'a `sunk: this.sunk` ekle; createPlayerShip'te `if (data?.sunk) { ship.sunk = true; ship.sinking = 15; ship.root.visible = false; }` ve oyuncuyu güverteye bindirme.

### E-14 — Konuklarda başkasının top atışı nişan açısı olmadan (yerel pivot yönüyle) çiziliyor
- **Önem:** Düşük · **Grup:** E_gemi · **Yer:** `js/net/net.js:152` · **Güven:** 0.65
- Kod: `relay('cannonFired', (e) => { if (G.isHost) this.broadcast({ t: 'cannon', ship: e.ship, i: e.index, by: e.by }); });   // yaw/pitch yok // 440: case 'cannon': ... combat.fireCannon(s, m.i, m.by) → ship.cannonWorld(i) yer`
- Açıklama: Host 'fire' mesajında konuğun yaw/pitch'ini alıp aimCannon yapıyor, ama yayınladığı 'cannon' mesajı açı içermiyor. Diğer istemciler görsel gülleyi kendi makinelerindeki pivot yönüyle (hiç nişan alınmamışsa 0/0) üretiyor; gerçek gülle başka yere giderken konuk ekranında gülle dümdüz yana çıkıp 40 m'de denize düşüyor, isabet/patlama noktaları uyuşmuyor.
- Kök neden: Yayın mesajı nişan verisini taşımıyor.
- Yeniden üretme: Statik. Co-op koşusu 2'de host 3 atış sonrası konukta 1 s içinde gülle bulunamadı (nBalls 0) — iletim mi yoksa limana yakın araziye çarpıp silinme mi olduğu ayrıştırılamadı; koşu doğrulaması gerekiyor.
- Önerilen düzeltme: 'cannon' mesajına `yaw, pitch` ekle (host fireCannon öncesi pivot rotasyonundan oku) ve istemcide `s.aimCannon(m.i, m.yaw, m.pitch)` sonra görsel atış yap.

### E-15 — Konuk dümende yelken ayarı: anlık görüntü sailTarget'ı her 66 ms'de ezdiği için artırma gecikmeli/kararsız olabilir
- **Önem:** Düşük · **Grup:** E_gemi · **Yer:** `js/ship/ship.js:705` · **Güven:** 0.55
- Kod: `this.sail = s[5]; this.sailTarget = s[6]; this.anchorT = s[7]; ...   // konuk dümendeyken yerel sailTarget ezilir // player.js:733: if (Math.abs(ax.y) > 0.3) s.adjustSail(ax.y * dt * 0.45); // net.js:564: this.toHost({ t`
- Açıklama: Konuğun W/S ile artırdığı sailTarget, host'a mutlak değer olarak 15 Hz gönderilir; aynı anda gelen anlık görüntü yerel değeri host'un (gecikmeli) değeriyle ezer. Gecikme bir anlık görüntü aralığını aşınca gönderilen değer eski + küçük artış olur; yelken artışı tasarlanan 0.45/s'nin altına düşer ya da titrer. Boşluk ile aç/kapat (toggleSails) mutlak olduğu için etkilenmez.
- Kök neden: Girdi niyeti değil, türetilmiş mutlak durum iletiliyor ve aynı alan anlık görüntüyle çift yazılıyor.
- Yeniden üretme: Statik çıkarım; co-op koşusunda ölçülemedi (zaman aşımı).
- Önerilen düzeltme: applyNet'te `if (!(G.player?.ship === this && G.player.mode === 'helm')) this.sailTarget = s[6];` ya da helm mesajında `dSail` deltası/toggle niyeti gönder.

### B09 — netChestSpawn yayınlanmadan doğan sandıklar (Kızıl Hançer ödülü, batan düşman gemisi, yüzen sandık) konukta görünmüyor
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/game/quests.js:186` · **Güven:** 0.8
- Kod: `treasure.spawnChest('large', e.pos.clone().add(new THREE.Vector3(2, 0, 0)));  // netChestSpawn yok; events.js:197,248 aynı`
- Açıklama: Snapshot m.ch yalnız var olan sandıkları günceller (net.js:545-548: if (ch && ...)); yeni sandık ancak ev sahibi onu eline alıp netChestState yayınlayınca konukta oluşur (_applyChestState 453-455). Konuk o ana kadar sandığı göremez/taşıyamaz.
- Kök neden: spawnChest kendisi yayın yapmıyor; yalnız resolveDig ve takeFromHold yollarında elle emit ediliyor.
- Önerilen düzeltme: spawnChest içinde (!G.online || G.isHost) && G.online ise G.emit("netChestSpawn") yap ya da m.ch içine eksik sandıklar için tier/contents ekleyip _applySnap'te oluştur.

### B10 — Zar oyunu oyuncu lehine pozitif beklenen değere sahip ve günlük kese sayfa yenilemeyle sıfırlanıyor (+5 XP/galibiyet)
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/ui/dice.js:13` · **Güven:** 0.8
- Kod: `const purses = new Map(); // zarcı -> {day, gold}   ... if (a1 === 6 && a2 === 6) { win = bet * 4; ...`
- Açıklama: Kurallar: 6-6 üç kat öder (1/36), 1-1 bahsi kaybettirir (1/36), rakibin 6-6'sı yalnız bahsi kaybettirir, geri kalan simetrik → E[kâr] ≈ +%2.9/atış. Kese bellekte tutulduğu için 400 altın/gün sınırı F5 ile kalkar; her liman zarcısı ayrı kese. Galibiyet başına 5 XP (progress.js:85) → ~0.8 s/atış ile saatte yüzlerce XP.
- Kök neden: Kazanç tablosu asimetrik; purses Map kayda bağlı değil.
- Önerilen düzeltme: 6-6 ödülünü ×2 yap ya da 1-1 çift kayıp; keseyi time/misc kaydına (gün+miktar) yaz; diceWin XP'sini günlük 5 galibiyetle sınırla.

### B11 — fishing.catch() ambara giden balık için hold.items["balik:x"]=0 kalıntısı yazıyor (ölü satır, kayda da giriyor)
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/wildlife/fishing.js:245` · **Güven:** 0.95
- Kod: `p.ship.hold.items[k] = (p.ship.hold.items[k] || 0); p.ship.hold.fish = p.ship.hold.fish || []; p.ship.hold.fish.push(data);`
- Açıklama: Envanter doluyken güvertede yakalanan balık hold.fish'e doğru gidiyor ama items'a sıfır sayımlı anahtar ekleniyor; ship.serialize hold'u olduğu gibi kaydediyor. UI "if (!n) continue" ile gizliyor (panels.js:126), ancak ship.js:681 ağırlık döngüsü ve netHold her balıkta çöp anahtar taşıyor. Koşu: items {"balik:sardalya":0}, fish 1.
- Kök neden: Eski sayım temelli tasarımdan kalan satır.
- Önerilen düzeltme: Satırı sil; isteğe bağlı ship.load/serialize'da n<=0 anahtarları temizle.

### B12 — animalKilled olayında katil kimliği yok: co-op'ta av XP'si her zaman ev sahibine tam, konuğa 1/3 gidiyor
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/wildlife/animals.js:442` · **Güven:** 0.85
- Kod: `G.emit('animalKilled', { kind: this.kind });  // progress.share(xp, name, by=undefined)`
- Açıklama: progress.js:66-72 share() by yoksa yerel oyuncuya tam XP verip tayfaya üçte bir dağıtıyor. Konuk netHurtAnimal ile hayvanı öldürdüğünde (net.js:240 applyDamage(m.dmg, {})) katil bilgisi kayboluyor: ev sahibi tam, konuk 1/3 XP alır. Düşmanlarda (enemies.js:473 by: info.by) doğru.
- Kök neden: applyDamage/die info.by taşımıyor; net handler boş info gönderiyor.
- Önerilen düzeltme: net.js hurtAnimal işleyicisinde applyDamage(m.dmg, {by: pid}); die(info) içinde G.emit("animalKilled", {kind, by: info?.by}).

### B13 — Köpekbalığı ganimet tablosu hiçbir şey vermiyor (160 HP için ödül yok)
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/wildlife/fish.js:509` · **Güven:** 0.9
- Kod: `G.emit('loot', { pos: ..., table: [['altin_para', 0, 0]], from: 'Köpekbalığı' });`
- Açıklama: spawnLoot (treasure.js:423-424) için [id,0,0] ne aralık (a>=1 değil) ne olasılık (Math.random()<0 asla) üretir → filtered boş, kese yok. Köpekbalığını öldürmek (160 HP, 24 hasarlı saldırılar) ödülsüz; hayvan öldürme XP'si de yok (animalKilled emit edilmiyor).
- Kök neden: Tablo biçimi yanlış (0,0) ve ödül tasarlanmamış.
- Önerilen düzeltme: Tabloyu [['altin_para', 30, 80], ['hayvan_postu', 1]] gibi doldur; G.emit('animalKilled', {kind:'shark'}) ekle.

### B14 — Canlı/tehlike/olay nesneleri silinirken GPU kaynakları (geometri/materyal) dispose edilmiyor
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/wildlife/animals.js:724` · **Güven:** 0.7
- Kod: `dispose() { combat.removeTarget(this); this.scene.remove(this.root); }  // prosedürel modeller onlarca geometri/materyal yaratıyor; Animated klon başına materyal kopyalıyor (character.js:852)`
- Açıklama: Bölgeler oyuncu uzaklaşınca kaldırılıp dönüşte yeniden kuruluyor; her domuz/timsah/yılan/kutup ayısı için yeni geometri ve materyaller yaratılıyor, hiçbiri dispose edilmiyor. Aynı durum hazards._dropSet (87-97: kafes/plaka/blok geometrileri, tintli klon materyaller) ve worldEvents (buzdağı geometrileri, sprite materyalleri) için geçerli. Uzun oturumda WebGL bellek artışı.
- Kök neden: three.js sahneden kaldırmayı GPU serbest bırakma saymıyor; dispose çağrıları yok.
- Önerilen düzeltme: Animal.dispose()/hazards._dropSet/worldEvents.clear içinde root.traverse ile geometry.dispose() ve materyal dispose; Animated.dispose()'u çağır (mixer durdur).

### B15 — npcs.remove() fizik çarpıştırıcısını kaldırmıyor (serbest bırakılan tutsağın hücresinde görünmez engel kalıyor)
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/game/npcs.js:91` · **Güven:** 0.8
- Kod: `if (n.root) { this.scene.remove(n.root); n.anim.dispose?.(); }  // _create'te physics.addCircle(... spot.tag) eklenmiş (81), remove'da silinmiyor`
- Açıklama: Tutsak kurtarılınca (islands.js:768) NPC modeli gider ama 0.35 m çarpışma halkası ada boşaltılıp (DROP_D=1150 m) removeTag çalışana kadar kalır.
- Kök neden: Çarpıştırıcı yalnız etiketle toplu siliniyor; tekil kaldırma yok.
- Önerilen düzeltme: Her dinamik NPC'ye kendi etiketi ver (tag: spot.tag+":"+id) ve remove() içinde physics.removeTag(o etiket) çağır.

### B16 — Co-op: ambardaki sandıkları ev sahibi ve konuk aynı anda satabilir (çift ödeme yarışı)
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/economy/shop.js:153` · **Güven:** 0.6
- Kod: `for (const h of s.hold.chests) { total += this.chestPrice(h.tier); ... } s.hold.chests = []; ... this.earn(total); ... G.emit('netHold', ...)`
- Açıklama: Sedef Hanım diyaloğu iki istemcide de "Ambardaki N sandığı sat" seçeneğini gösterir (quests.js:398-401); satış yerel hold kopyasına göre yapılır ve netHold sonra ulaşır. İki oyuncu kısa aralıkla tıklarsa aynı sandıklar iki kez ödenir (earn paylaşımlı olduğu için herkes kazanır).
- Kök neden: Ambar satışı ev sahibi otoriteli değil; yerel durumdan hesaplanıyor.
- Önerilen düzeltme: Konukta satışı toHost({t:"sellHold"}) olarak ilet, ev sahibi tek sefer satıp netHold+gold yayınlasın.

### B17 — interact: basılı-tutma kolu (_armed) hedef değişince sıfırlanmıyor; başka nesnede istenmeyen holdAction tetiklenebilir
- **Önem:** Düşük · **Grup:** G_icerik · **Yer:** `/home/user/SON-HAZ-NE/js/game/interact.js:45` · **Güven:** 0.6
- Kod: `if (best && this.current && best.id === this.current.id) best = Object.assign(this.current, best); else this.holdT = 0;  // this._armed sıfırlanmıyor`
- Açıklama: Oyuncu A sandığında E'ye basılı tutarken en iyi aday B sandığına geçerse _armed true kalır, holdT sıfırdan sayar ve 1.4 s sonra B açılır (oyuncu B'ye hiç basmamış olsa da). Kısa basış yoluna da (holdT<0.35) etkisi var.
- Kök neden: Hedef değişiminde yalnız holdT sıfırlanıyor.
- Önerilen düzeltme: else dalında this._armed = false; ayrıca best.disabled olduğunda da kolu bırak.

### H18 — Ana menü 'DEVAM ET' online kayıt için yuvayı taşımıyor (Oda Kur her zaman yuva 1)
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/ui/menu.js:181` · **Güven:** 0.7
- Kod: `const f = { name: ..., slot: 0 };   // main.js:169 continueLatest → menu.hostScreen(); 'kayıt yuvası seçili' bildirimi`
- Açıklama: Son kayıt online ve yuva 2/3'teyse 'DEVAM ET' Oda Kur ekranını yuva 1 seçili açar; bildirim 'kayıt yuvası seçili' der. Kullanıcı fark etmezse yuva 1'deki başka/yeni dünya başlar ve oraya kayıt yazılır.
- Kök neden: hostScreen parametre almıyor; latest.slot aktarılmıyor.
- Yeniden üretme: Online dünyayı yuva 2'ye kaydet → menüde DEVAM ET → Oda Kur 'Dünya / kayıt' seçimi Yuva 1.
- Önerilen düzeltme: menu.hostScreen({slot: latest.slot}) ve select varsayılanını f.slot'tan oku.

### H19 — Ağdan gelen harita işaretleri sınırsız; işaret silme eşitlenmiyor; not iptalinde de işaret konuyor
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:255` · **Güven:** 0.8
- Kod: `case 'marker': quests.markers.push({...}); this.broadcast(m, pid); ...   // quests.js:325 yerelde 30 sınırı; panels.js:495 splice yerel; :497 prompt(...) || ''`
- Açıklama: Yerel placeMarker 30 ile sınırlı ama ağ işleyicileri (net.js:255/432) sınırsız push yapar ve markers kayda girer (quests.js:123); harita panelinde işaret silme (panels.js:495) yalnız yerel; window.prompt iptalinde (null) '' ile yine işaret konur ve yayılır.
- Kök neden: Ağ yolunda sınır ve silme mesajı yok; prompt dönüşü ayrıştırılmıyor.
- Yeniden üretme: Konuk 100 işaret gönderir → ev sahibi kaydında 100 işaret; ev sahibi işareti siler → konukta kalır.
- Önerilen düzeltme: Ağ işleyicisinde 30 sınırı; 'markerDel' mesajı ekle; prompt null ise işaret koyma.

### H20 — Takım listesi hp=0 iken tam çubuk gösteriyor; XP açılır metni innerHTML
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/ui/hud.js:441` · **Güven:** 0.9
- Kod: `<b style="width:${clamp(r.hp || 100, 0, 100)}%">   // :58 d.innerHTML = `+${e.xp} XP ... ${e.reason}``
- Açıklama: Yaralı düşen (hp 0) uzak oyuncunun çubuğu %100 görünür ('r.hp || 100'). _xpPop ev sahibinden gelen 'xp' mesajının reason alanını innerHTML ile basar.
- Kök neden: Falsy kontrolü; şablonda kaçışsız dize.
- Yeniden üretme: Co-op: konuk hp 0 ile yaralı düşer → ev sahibi takım listesinde tam kırmızı çubuk + YARALI!.
- Önerilen düzeltme: r.hp ?? 100 ve textContent/el() kullan.

### H21 — 'Dost ateşi' oda seçeneği hiçbir şey yapmıyor; oyuncular arası hasar yolu yok
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/game/game.js:101` · **Güven:** 0.9
- Kod: `G.friendlyFire = !!opts.friendlyFire;   // Grep: G.friendlyFire hiçbir yerde okunmuyor; net.js'te combat.addTarget yok`
- Açıklama: Oda Kur ekranındaki 'Dost ateşi' kutusu G.friendlyFire'a yazılır ama hiçbir sistem okumaz; uzak oyuncular combat hedefi değil, _hostData'da 'hurt' işleyicisi yok → seçenek açıkken de kapalıyken de davranış aynı.
- Kök neden: Özellik yalnız ayar düzeyinde eklenmiş.
- Yeniden üretme: Dost ateşi açık odada tayfaya ateş et → hasar yok.
- Önerilen düzeltme: Seçeneği gizle ya da uygula: RemotePlayer'ları hedef listesine ekle ve G.friendlyFire ise netHurtPlayer → ev sahibi 'hurt' işleyicisi üzerinden hasar ver.

### H22 — Sohbet metni uzunluk/oran sınırsız; sohbet günlüğü DOM'u hiç kırpılmıyor
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:234` · **Güven:** 0.8
- Kod: `case 'chat': this.broadcast({ t: 'chat', from: c.info.name, text: m.text, ... });   // main.js:360 chatLog.appendChild(...) sınırsız`
- Açıklama: maxlength=140 yalnız istemci UI'da; ev sahibi keyfî uzunluktaki metni tüm eşlere yayar; chat-log'a eklenen satırlar hiç silinmez (uzun oturumda DOM büyür).
- Kök neden: Sunucu tarafı (ev sahibi) doğrulama ve günlük kırpma yok.
- Yeniden üretme: Konuk: DK.net.toHost({t:'chat', text:'x'.repeat(1e5)}) → herkese yayılır.
- Önerilen düzeltme: text.slice(0,140), saniyede ≤3 mesaj; chat-log'u 50 satırda kırp.

### H23 — Dünya haritası: yığında ikinci açılış önceki mousemove/keydown dinleyicilerini sızdırır; Space/R üstte başka panel varken de çalışır
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/ui/panels.js:478` · **Güven:** 0.6
- Kod: `window.addEventListener('mousemove', this._mm = (e) => {...});  // onClose: removeEventListener('mousemove', this._mm) — this._mm ikinci açılışta ezilir`
- Açıklama: Normal yolda tüm dinleyiciler onClose'da kaldırılıyor (sızıntı yok). Harita açıkken üstüne başka panel gelip ui.topIs('map') false olduğunda M tekrar basılırsa ikinci harita açılır; this._mm/this._mapKey üzerine yazılır ve ilk haritanın window dinleyicileri (ve draw kapanışı, canvas) kalıcı olur. Space (merkeze dön) ve R (rotayı sil) window dinleyicileri harita altta kalsa bile çalışır.
- Kök neden: Dinleyici referansları paylaşılan this alanlarında tutuluyor; panel odak kontrolü yok.
- Yeniden üretme: M → işarete tıkla (prompt) ... → M (ikinci harita) → ilk harita kapanmadan kalır; kapat → window mousemove dinleyicisi sayısı artmış kalır.
- Önerilen düzeltme: Dinleyici referanslarını kapanış yerel değişkenlerinde tut; worldMap() açılışında yığında 'map' varsa onu kapat; Space/R işleyicilerinde ui.topIs('map') kontrol et.

### H24 — Karakter oluşturucu: window mouseup dinleyicisi her açılışta birikir; closeAll ile kapanınca rAF döngüsü ve WebGL bağlamı yaşamaya devam eder
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/ui/creator.js:47` · **Güven:** 0.7
- Kod: `window.addEventListener('mouseup', () => { drag = null; });   // :153 const close = () => { alive = false; ui.close(); r.dispose(); ... } yalnız kendi kapanışında`
- Açıklama: Her open() çağrısı kaldırılmayan bir window dinleyicisi ekler. Panel ui.closeAll() (oyun başlatma, ölüm, menüye dönüş) ile kapatılırsa alive=false olmaz: requestAnimationFrame döngüsü ayrılmış tuvale çizmeye devam eder ve ikinci WebGL bağlamı serbest bırakılmaz.
- Kök neden: Temizlik yalnız panelin kendi kapatma yoluna bağlı; ui.open onClose kullanılmıyor.
- Yeniden üretme: KORSANIM aç → menüden Devam Et ile oyun başlat (ui.closeAll) → creator rAF döngüsü devam eder.
- Önerilen düzeltme: ui.open(..., { onClose: () => { alive=false; r.dispose(); window.removeEventListener('mouseup', fn); } }).

### H25 — Snapshot'lar oyun başlamadan (menü/lobide) uygulanıyor: uzak karakterler, gemiler ve düşmanlar menü sahnesine ekleniyor
- **Önem:** Düşük · **Grup:** H_coop_ui · **Yer:** `js/net/net.js:513` · **Güven:** 0.6
- Kod: `_applySnap(m) { for (const id in m.players) { ... this._remoteState(id, info, m.players[id]); } ... G.emit('netNeedShip', sd) ... enemies.applySnapshot(m.en) ...`
- Açıklama: _clientData 'snap' G.state kontrolü yapmaz; oyun sürerken katılan konuk lobideyken RemotePlayer'lar, netNeedShip gemileri ve düşman/hayvan kopyaları menü sahnesine yaratılır. game.start gemileri siler, enemies/animals start'ları listeyi sıfırlar; ancak lobide gereksiz yük ve menü arka planında yabancı nesneler oluşur. Gemi kimliği sabit 'ship_main' olduğu için yinelenen gemi oluşmadı (koşuda dup=1 doğrulandı); kimlik değişse netNeedShip ile kopya oluşur.
- Kök neden: Snapshot uygulaması oyun durumuna bağlı değil.
- Yeniden üretme: Oyun sürerken odaya katıl, lobide bekle → DK.G.remotes.size ve DK.enemies.list.length menüde artar.
- Önerilen düzeltme: _applySnap başında if (G.state !== 'playing' || !G.player) return (ya da son snapshot'ı sakla, sessionStart'ta uygula).

## 2c. Ek bulgular (tek mercek, doğrulanmadı) (10)

### F_dusman-ek-statik-108 — Co-op: Taş Muhafız rün sütunları konukta hiç oluşmuyor; konuk görünmez %80 hasar direnciyle savaşıyor
- **Önem:** Orta · **Grup:** F_dusman · **Yer:** `js/game/bosses.js:649` · **Güven:** 0.5
- Açıklama: Sütunlar yalnız onPhase (:644-665) içinde yaratılır; onPhase BossBase.applyDamage'dan (:112) yalnız ev sahibinde çağrılır (konukta hurt :100 → netHurtBoss). GiantBase.netExtra/clientUpdate (:606-615) sütun bilgisi taşımaz, applyNetExtra tanımlı değil → konuk sütunları görmez ve vuramaz; ev sahibinde damageMul :641 `if (this.pillars.some((p) => p.alive)) k *= 0.2` konuğun vuruşlarına da uygulanır; uyarı (:648 G.notify) yalnız ev sahibinde görünür.

### A_motor-ek-statik-17 — Tuş atama sırasında Esc ile vazgeçmek Ayarlar panelini kapatıyor (ui.js'teki captureNext koruması işlemiyor)
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/ui/ui.js:18` · **Güven:** 0.5
- Açıklama: input.init'in window keydown dinleyicisi (js/core/input.js:53, main.js:94'te önce kaydedilir) captureNext'i çağırıp `this.captureNext = null` yaptıktan sonra ui.init'in dinleyicisi (ui.js:14-26, main.js:112'de kaydedilir) çalışıyor; bu yüzden ui.js:18 `if (input.captureNext) return;` hiçbir zaman doğru olmuyor ve Esc üstteki paneli kapatıyor. settingsPanel.js:52 Esc'i 'vazgeç' olarak sunuyor ama kullanıcı Esc'e basınca Ayarlar paneli kapanıyor. Çalıştırma r1: stack ['pause','settings'] + yakalama açık → keydown Escape → captureNext null ve stack ['pause']. Çözüm: ui dinleyicisini capture fazında/önce kaydet ya da input dinleyicisi yakalama olayında e.stopImmediatePropagation() çağırsın.

### A_motor-ek-statik-18 — Kayıt yüklenirken can, yetenek bonuslu azami cana oranlanarak şişiyor
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/game/game.js:123` · **Güven:** 0.5
- Açıklama: game.start kayıttaki hp'yi oyuncu maxHp=100 iken (player.js:36) yazıyor; sonra systems.start → progress.start → recompute (js/game/progress.js:152-154) `ratio = p.hp / p.maxHp(100)` hesaplayıp `p.hp = round((100 + mods.hp) * ratio)` yapıyor. 'Demir Bilek' 3 (maxHp 145) ile: kayıtta hp 60 → yüklemede 87; kayıtta 87 → 126 (r1 ölçümü). Her yükleme canı ×(maxHp/100) artırıyor (ucuz iyileşme, düşük can durumu kaybolur). Çözüm: progress.start'ı oyuncu hp'sinden önce çalıştır ya da recompute'ta oranı yalnız maxHp gerçekten değişince uygula / kayıttaki hp'yi recompute sonrasında ata.

### A_motor-ek-statik-19 — Gölge ayarı oyun içinde değiştirilince materyal programları yenilenmiyor (gölgeler donuyor / geri gelmiyor)
- **Önem:** Düşük · **Grup:** A_motor · **Yer:** `js/core/settings.js:46` · **Güven:** 0.5
- Açıklama: settings.apply yalnız `renderer.shadowMap.enabled` değiştiriyor; three.js r187 setProgram'daki yeniden derleme koşulları (vendor/three/three.module.js:18277-18381) shadowMapEnabled parametresini (:7450) hiç karşılaştırmıyor ve lights.state.version (:8586-8631) renderer.shadowMap.enabled ile değişmiyor. Sonuç: 'Kapalı' seçilince gölge haritası güncellenmez (WebGLShadowMap.render :8939 erken döner) ama derlenmiş materyaller `#define USE_SHADOWMAP` ile eski haritayı/matrisi örneklemeye devam eder → gölgeler eski konumda donmuş kalır (güneş/oyuncu hareket ettikçe yanlış); 'Kapalı'→'Yüksek' geçişinde ise gölgeler yeniden başlatmaya kadar hiç görünmez; arada derlenen yeni nesneler karışık durumda kalır. Çalıştırma r3: görüş alanındaki arazi MeshStandardMaterial programı id 48 (#define var) 'off' + 2 çizim sonrası hâlâ 48; material.needsUpdate=true → program 95 (#define yok); 'high' + 2 çizim → hâlâ 95; needsUpdate → 48. Açılışta ayar ilk çizimden önce uygulandığı için (main.js:96 < :111) yalnız oyun içi değişiklik etkileniyor. Çözüm: ayar değişince scene.traverse ile tüm materyallere needsUpdate=true (ya da yeniden başlatma notu).

### F_dusman-ek-statik-109 — Batan düşman gemisinin canlı tayfası silinmiyor; deniz dibinde kalıcı düşmanlar kalıyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1154` · **Güven:** 0.5
- Açıklama: Enemy._place :1154 `if (this.ship.sunk) { this.ship = null; return; }`. Kare sırası: game.js:189-194 gemiler (ship.js:376 updateTransform → :536 `this.sunk = true`) → sistemler: enemies (main.js:102 listede 7.) → events (18.). Aynı karede güncellenen canlı tayfa (LOD adımı 0, oyuncuya <45 m) ship=null olur; events.js:352 `for (const c of this.crew || []) { if (c.ship === e) { c.remove = true; c.alive = false; } }` tutmaz → tayfa canlı kalır, _place zemin dalıyla (physics.groundAt) deniz tabanına iner; homeR=999 (:250) olduğundan tasma yok, _move :1083 kıyıya çıkamaz; enemies.list'te süresiz kalır (snapshot, near/alliesNear, token hesaplarına girer). 45-90 m'de LOD nedeniyle rastgele, >90 m'de çoğunlukla düzgün silinir.

### F_dusman-ek-statik-110 — Boğulmuş Denizci'nin 'yakalama' yavaşlatması etkisiz: player.slowT hiç okunmuyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:994` · **Güven:** 0.5
- Açıklama: `G.player.slowT = 2.2; G.notify('Boğulmuş denizci seni yakaladı — yavaşladın!')` — player.js'te slowT geçmiyor (grep: yalnız enemies.js:1100 düşmanın kendi slowT'si ve hazards.js). _speedFor :386-403 slowT'ye bakmaz → mesaj var, etki yok.

### F_dusman-ek-statik-111 — Co-op: patlama (gülle) hasarı yalnız yerel oyuncuya uygulanıyor; konuklar gülle patlamalarından bağışık
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/combat.js:51` · **Güven:** 0.5
- Açıklama: explosion dinleyicisi :43-53: hedefler (targets) için hurt, oyuncu için yalnız `const p = G.player; if (p && p.pos.distanceTo(e.pos) < e.radius && e.owner !== G.ship) p.hurt(...)`. G.remotes taranmaz, netHurtPlayer yok. Konukta gülleler görseldir (effects.js:117 `visual = (G.online && !G.isHost) || !!G.visualOnlyBalls`) → :180 explosion emit edilmez. Sonuç: düşman gemisinin araziye düşen gülleleri konuğa hasar vermez; ev sahibi yanar.

### F_dusman-ek-statik-112 — Co-op: zehir (venom) etkisi uzak oyunculara iletilmiyor
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:1421` · **Güven:** 0.5
- Açıklama: `if (s.kind === 'venom' && t.id === G.myId) t.ref.poison = Math.max(t.ref.poison || 0, 6);` yalnız yerel; _hitPlayer → netHurtPlayer ve net.js:132 'hurt' mesajı poison alanı taşımaz (player.hurt :157 `opts.poison` destekliyor). Derinlik Yılanı tükürüğü (bosses.js:480) konukta yalnız 12 hasar verir, zehirlemez.

### F_dusman-ek-statik-113 — Konukta boss.hurt() hasar vermeyen vuruşlar için de 'hit' döndürüyor (yanlış vuruş geri bildirimi)
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/bosses.js:100` · **Güven:** 0.5
- Açıklama: `if (G.online && !G.isHost) { G.emit('netHurtBoss', {...}); return 'hit'; }` — ev sahibinde damageMul 0 olan durumlar (Kraken :205 derin baş, Yılan :420 su altı, Amiral :913 bordalanmış, Taş Muhafız :641 rün ×0.2) konukta kan kıvılcımı (combat.js:197) + hitMarker (:250) üretir; dmgNumber yalnız ev sahibinde emit edilir (:109) → konuk 'vurdum' sanır ama sayı görmez. _hurtTentacle :212 aynı deseni izler.

### F_dusman-ek-statik-114 — callHelp/rally pusu vuruşuyla hiç tetiklenmiyor (tasarım olabilir)
- **Önem:** Düşük · **Grup:** F_dusman · **Yer:** `js/game/enemies.js:415` · **Güven:** 0.5
- Açıklama: _aggro :415 patrol/suspicious/investigate/return → doğrudan 'chase'; _think :653-661 callHelp dalı yalnız `seen && state ∈ {patrol, suspicious, investigate, return}` iken çalışır → ilk temas hasar olan kaptan/boss (haydut_kaptani, kizil_hancer, iskelet_kaptan, lanetli_amiral, hayalet_kaptan) 'callHelp'e hiç girmez; yalnız _groupAlert(30) çalışır (45 m değil), rally (+%20 hasar, :1347) verilmez.

## 4. Geliştirme önerileri (hata değil)

### A_motor
- **Sabit zaman adımı ve alt adım (fizik/karakter/gemi için)** (`js/game/game.js`, buyuk): Değişken dt (0,1 s'ye kadar) düşük FPS'te tünelleme ve titreme üretir; co-op'ta ev sahibi ile konuk farklı FPS'te farklı sonuç alır. → engine döngüsünde biriktirici: while (acc >= STEP && n < 4) { game.step(STEP); acc -= STEP; } ; kamera/HUD/animasyon gerçek dt ile.
- **Gerçek duraklatma (solo) ve ölüm ekranında kayıt engeli** (`js/game/game.js`, kucuk): Bug A2 ve A8: duraklatmada dünya akıyor; ölüyken kayıt alınabiliyor. → ui.open(kind 'pause'/'death') solo'da G.state='paused' yapsın; game.update ve autosave bu durumda dönsün; saveNow p.dead/downed iken atlasın.
- **Kayıt şeması doğrulama + sürüm göçü** (`js/core/save.js`, orta): A14: bozuk/eski kayıtlar sessizce varsayılanlara düşüyor; sürüm alanı okunmuyor. → save.read sonrası validate() (zorunlu alanlar, tür kontrolü) ve migrate(version) zinciri; menüde 'bozuk kayıt' göstergesi.
- **Ship ve enemies için save/load alan eşitliği testi** (`js/game/shipControl.js`, kucuk): A1/A5: serialize edilen alanların bir kısmı start/create tarafında okunmuyor. → createPlayerShip'e parts/mastHp/cannonHp; enemies.start(data) groupState; tests/scenarios'a 'round-trip' senaryosu (kaydet → yükle → derin eşitlik).
- **Ayar panelini gerçekten uygulanan ayarlara indirgeme / bağlama** (`js/ui/settingsPanel.js`, orta): A3, A4, A11, A12, A13: beş ayar etkisiz veya yarı etkili; kullanıcı güveni ve belgelerle (docs/12) uyumsuz. → water→ocean.build yeniden kurulum, shadows→mapSize, viewDistance→terrain yarıçapı+sis, vsync/language/subtitles kaldır veya devre dışı göster; settingsChanged olayına ocean/sky dinleyicileri.
- **closeKeys ve fare yakalamasını bindings'e bağla** (`js/ui/ui.js`, kucuk): A9/A10: tuş atamaları panel kapatma ve fare atamasında işlemiyor. → ui.open({closeAction:'envanter'}) → ui.js input.bindings[closeAction] ile karşılaştırır; captureNext için window 'mousedown' capture dinleyicisi.
- **Konuk kaydını tek yolda birleştir** (`js/main.js`, kucuk): A7/A16: konuk envanteri ve ilerlemesi farklı anahtar/tetikleyicilerle kaydediliyor. → saveNow konuk dalında progress.save() çıktısını aynı 'guest' kaydına koy; progress.start konukta buradan okusun; GUEST_KEY'i kaldır.
- **Varlık yüklemede hata toleransı ve ilerleme hatası raporu** (`js/core/assets.js`, orta): A6: tek dosya hatası oyunu tamamen engelliyor. → Promise.allSettled + yeniden deneme (2x) + yer tutucu; yükleme ekranında eksik dosya adı; kritik dosya listesi ayrımı.
- **Ses: yükleme Promise'i önbelleği ve bağlam durumu yönetimi** (`js/core/audio.js`, kucuk): A15 yarışı; iOS 'interrupted' ve sekme geri gelince askıda kalan bağlam. → _battleLoad Promise'i; visibilitychange/pointerdown'da ctx.state !== 'running' ise resume(); 'statechange' dinleyicisi.
- **WebGL bağlam kaybı işleme** (`js/core/engine.js`, kucuk): GPU sıfırlamasında (sürücü/sekme baskısı) döngü sessizce bozulur; kullanıcıya bilgi yok. → canvas 'webglcontextlost' → preventDefault + duraklat + bildirim; 'webglcontextrestored' → malzemeleri needsUpdate ya da sayfayı yenile önerisi.
- **Ölü kod ve yanıltıcı ifadelerin temizliği** (`js/game/game.js`, kucuk): game.js:173 `input.endFrame && null`, settings.js:44 vsync ifadesi, main.js:331 gereksiz dinamik import (sky zaten statik import), settingsPanel.js:90 `void DEFAULT_SETTINGS`, menu.js:53 eski handler yorumu okunabilirliği düşürür. → İlgili satırları kaldır/düzelt.
- **beforeunload davranışı** (`js/main.js`, kucuk): main.js:373-375 oyun sırasında her kapanışta kayıt alıp yine de 'sayfadan ayrıl' diyaloğu gösteriyor; kayıt başarılıysa engel gereksiz. → Yalnız save.write false döndüğünde veya G.online ev sahibiyken preventDefault.
- **Tek dosya: anahtar çözümleme ve davet bağlantısı** (`tools/build-single-html.mjs`, kucuk): prelude key() URL'deki ilk 'assets/' geçişini alır (satır 80-81): dosya 'assets' adlı bir klasörde açılırsa eşleşme bozulur; menu.js:351 davet bağlantısı file:// altında 'null/…' olur. → lastIndexOf('assets/') kullan ya da URL'yi document.baseURI'ye göre çöz; __DK_SINGLE_FILE iken davet bağlantısı yerine yalnız oda kodunu kopyala.

### B_dunya
- **Arazi işçisi hata yolu ve yükleme zaman aşımı** (`/home/user/SON-HAZ-NE/js/world/terrain.js`, orta): Tek işçi hatası tüm oyunu sessizce kilitliyor (B-01); kullanıcıya hiçbir mesaj gösterilmiyor. → İşçi başına inflight iş kümesi tut; onerror'da işçiyi terminate edip işleri yeniden kuyrukla, hiç işçi kalmazsa yedeğe geç; prepare()/requestGrid'e zaman aşımı; yükleme ekranında hata ve 'yeniden dene'.
- **İşçi ile yedek için ortak üretim modülü** (`/home/user/SON-HAZ-NE/js/world/terrainWorker.js`, orta): Yedek protokolün tamamını uygulamıyor (B-02); iki kopya kod ileride ayrışır. → tile/depth/grid fonksiyonlarını terrainGen.js'e taşı; terrainWorker.js ve _localJob aynı fonksiyonları çağırsın; yedekte işleri requestIdleCallback/zaman dilimleriyle çalıştır.
- **LOD histerezis bandı ve deniz karosu düşürme** (`/home/user/SON-HAZ-NE/js/world/terrain.js`, kucuk): Eşikler tek değer (380/950/1750/2700): sınırda ileri-geri hareket 80↔32 yeniden üretimi tetikler; 300 m dışına çıkan deniz karoları 3180 m'ye kadar sahnede kalıyor. → Giriş/çıkış eşikleri (örn. 380 giriş / 440 çıkış) ve yükseltme için kısa bekleme; _wantSeg 0 döndüren deniz karolarını DEEP_VIEW+TILE'da düşür.
- **Harita tabanını (1024² ızgara) tembel/arka planda üret** (`/home/user/SON-HAZ-NE/js/main.js`, kucuk): main.js:108 initMapBase'i başlangıçta await ediyor (1 M computeHeight+biomeAt); yük altında 16.8 s ölçüldü; tek işçili (2 çekirdek) makinede karoları bloke eder. → initMapBase'i await etmeden başlat, harita/menü açılışında bekle; ya da 512² taban + ayrıntı karoları.
- **Güney bölge (Zümrüt Takımadaları) atmosferi** (`/home/user/SON-HAZ-NE/js/world/sky.js`, kucuk): RW.tropik hesaplanıyor (sky.js:183, 274) ama sis/deniz/parçacık tonlarında hiç kullanılmıyor; cangıl bölgesi görsel kimliksiz. → RW.tropik için nemli yeşil-gri sis tonu, hafif ek sis yoğunluğu ve turkuaz deniz tonu ekle.
- **Derinlik penceresinin kapsamı** (`/home/user/SON-HAZ-NE/js/world/ocean.js`, orta): Pencere ±1200 m; okyanus ağı 3200 m'ye uzanır → 1.2–3.2 km'deki adalar tam dalgalı derin su gibi çizilir (sığ renk/köpük yok). → Pencereyi 4800 m / 1024² yap (2 MB yarım duyarlık) ya da shader'a en yakın ada için analitik kıyı sönüm terimi ekle.
- **Hava geçiş hızını durum süreleriyle uyumla** (`/home/user/SON-HAZ-NE/js/world/sky.js`, kucuk): Geçiş τ=30 s (satır 245) iken durumlar 1–4.5 gerçek dakika sürüyor; hava çoğunlukla geçişte, fırtına 1–2 dk'da en çok %86'ya ulaşıyor. → τ'yu 10–15 s'ye indir ya da DURATION'ları uzat; fırtına için ayrı (daha hızlı) giriş eğrisi.
- **Deniz tabanı sığlık karolarının çizimi** (`/home/user/SON-HAZ-NE/js/world/geo.js`, kucuk): rectMayHaveLand kara yarıçapını 1.6·r alıyor; Node: 73 adanın 39'unda bu yarıçap ötesinde taban −5 m'nin üstüne çıkıyor (en sığ −2.1 m) ama bu karolar 300 m dışında çizilmiyor → yaklaşırken seg-8 karo 'pop' eder. → Sığlık için DEEP_VIEW'u ~900 m yap ya da rectMayHaveLand yarıçapını 2.1·r'ye çıkar (karo sayısı artar, LOD 16/8 ile ucuz).
- **Ada kalıcı durumu (save/netSnapshot)** (`/home/user/SON-HAZ-NE/js/world/islands.js`, orta): opened/freed/tapınak çözümü oturumla sınırlı (B-08); co-op konuklar için de paylaşılmıyor. → saveKey:'islands', save()→{opened, freed, temples}, start(data) ile geri yükle; netSnapshot/applySnapshot ile konuklara aktar.
- **İskele direk boyu ve rampa** (`/home/user/SON-HAZ-NE/js/world/islands.js`, kucuk): Direkler sabit 7 m silindir, −4.3 m'de bitiyor; iskele ucunda taban −8.9 m (su altında havada asılı); iskele başında basamak (B-07). → Direk boyunu heightAt(x,z) ile hesapla (port.js:178-186 gibi); iskele başına eğimli platform/merdiven.
- **Kısmi işçi kurulum hatasında temizlik** (`/home/user/SON-HAZ-NE/js/world/terrain.js`, kucuk): satır 45: ikinci işçi kurulamazsa this.workers=[] yapılıyor ama kurulmuş ilk işçi terminate edilmiyor (boşta iş parçacığı). → catch içinde `for (const w of this.workers) w.terminate();` sonra `this.workers = []`.
- **Mağara hendeği ve dik yamaçlar için daha ince hires adımı** (`/home/user/SON-HAZ-NE/js/world/terrain.js`, orta): 2 m örnekleme mağara hendeği (3 m blend) ve mesa teraslarını çözemiyor (B-04 ölçümleri 2–4 m). → Dik eğimli karolarda (maxH−minH büyük) seg 160 (1 m) seçeneği ya da TERRAIN blend'lerini ≥6 m yap.

### C_oyuncu
- **Eğimli zeminde ayak IK'sını etkinleştir** (`js/player/character.js`, orta): ik.ground kodu (806-822) hazır ama hiç beslenmiyor; yamaçta ayaklar havada/gömülü kalıyor. → Player.update'te mode ground/deck iken `c.ik.ground = (x,z)=>physics.groundAt(x,z,this.pos.y+0.6)` (güvertede deckAt) ver; C01 ile birlikte model.position.y ofsetlerini tek birikimli değişkende topla.
- **Kamera engel çözümü ve mağara/iç mekân davranışı** (`js/player/camera.js`, orta): C07: kamera duvar/bina içinden görüyor; mağarada yalnız mesafe kısıtı var. → Baştan kameraya physics.lineBlocked ile adım adım en yakın serbest mesafeyi bul, dist'i damp ile kısalt/aç; gemi gövdesini küpeşte yüksekliğinde kutu olarak ekle; isteğe bağlı karakter saydamlığı dist<1.2'de.
- **Dayanıklılık için histerezis ve yenilenme gecikmesi** (`js/player/player.js`, kucuk): C03/C10: eşik salınımı hem sömürü hem animasyon titremesi yaratıyor. → stamina için `exhausted` bayrağı (0'a düşünce true, 25'e çıkınca false), son tüketimden 0.8 s sonra yenilenme; blocking/sprinting bu bayrağa bağlansın.
- **Mod geçişlerini tek noktadan yönet (setMode)** (`js/player/player.js`, orta): C06/C11/C12/C18: busy, savaş bayrakları, üst katman ve el eşyası mod geçişlerinde dağınık temizleniyor. → Player.setMode(next): cancelBusy, blocking/aiming/sprinting=false, char.stopUpper, hold görünürlüğünü moda göre ayarla (swim/climb gizle, diğerlerinde göster), model.rotation.x=0; tüm `this.mode = ...` atamalarını buna çevir (shipControl, main.respawn dahil).
- **Sandık kaldırma/bırakma animasyonu ve gecikmeli uygulama** (`js/treasure/treasure.js`, orta): Kollar anında IK pozuna geçiyor; taşıma hissi zayıf. → pickUp'ta startAction('pickup', 0.6, {onDone: _applyCarry}) ve 0.3 s'de sandığı ele kaydır; drop'ta kısa 'PickUp' tersi ya da 'Throw' başlangıcı; chest mesh kulp noktalarını ik.handL/R'ye ver.
- **Balıkçılık: uygun atış klibi, makara animasyonu ve savaştan ayrıştırma** (`js/wildlife/fishing.js`, kucuk): C05 ve mücadele sırasında görsel geri bildirim yok (overlay.reel hiç ayarlanmıyor). → cast()'te startAction('throw', 0.5); _fight'ta `p.char.overlay.reel = reel ? 1 : 0` ve omurgaya tension ile küçük geri yaslanma; combat.js:110 eski slash/punch dalını kaldır.
- **Nişanda dikey bakış (lookPitch) ve namlu-kamera uyumu** (`js/player/player.js`, kucuk): Aim pozu kameranın dikey açısını izlemiyor; lookPitch overlay'i (character.js:823) hiç kullanılmıyor. → aiming iken `c.overlay.lookPitch = -tpCamera.pitch` ve omurga/göğüse 0.3-0.6 oranında dağıt; shoot() ışın başlangıcını kameradan değil namludan kamera yönüne doğru al.
- **Dümen ve top istasyonlarına gerçek el hedefleri** (`js/game/shipControl.js`, orta): C08: eller tekerleğe değmiyor, top modunda duruş yok. → _updateHelm'de M.wheel üzerindeki iki parmaklık noktasını rudder ile döndürüp char.ik.handR/L'ye yaz; _updateCannon'da kundak arkası iki tutamak hedefi + hafif eğilme; cannonPitch ile baş eğimi.
- **Yürüme/koşma arasında hız tabanlı karıştırma** (`js/player/player.js`, orta): C13: sert eşik ve alt sınır kıskacı ayak kaymasına yol açıyor. → 2.4–3.8 m/s arasında Walk ve Run eylemlerini ağırlıkla karıştır (setEffectiveWeight), timeScale'i her klibin referans hızına göre ayrı ölçekle; duvara dayanırken anim hızını vel yerine gerçek yer değiştirmeden al (yerinde koşma önlenir).
- **Uzak oyuncu duruş senkronu** (`js/player/player.js`, kucuk): crouch/tread/climb/fish overlay'leri ve loop bilgisi netState'te yok; uzak oyuncular eğilmez, tırmanma/balık pozu göstermez (C25). → netState'e `ov: [crouch, tread, climb, fish]` ve `loop` ekle; RemotePlayer.apply'da overlay'lere yaz.
- **Ragdoll'u gemi yerel uzayında simüle et** (`js/player/ragdoll.js`, orta): Güvertede ölen oyuncunun/düşmanın ragdoll noktaları dünya uzayında; gemi hareket edince ceset güverteden kayıp denize düşüyor. → opts.frame (gemi root) verildiğinde noktaları yerel uzayda tut, _pose'da localToWorld ile dönüştür; ground fonksiyonunu yerelde deckAt ile çalıştır.
- **Ölü kod temizliği** (`js/player/character.js`, kucuk): overlay.air (player.js:357) kullanılmıyor; cancelBusy/onCancel/cancelOnMove, upperHold, overlay.reel, _matsByName, `void hw/root` yer tutucuları kafa karıştırıyor. → Kullanılmayanları kaldır ya da gerçek çağrılarını ekle (cancelOnMove: hareket girişi varsa cancelBusy).
- **Eylem kesme/kırpma zamanlamaları** (`js/player/player.js`, kucuk): Punch (0.86 s klip, 0.6 s eylem) ve Cheer (1.67 s klip, 1.2 s eylem) tam gövde klipleri eylem bitince Idle'a kesiliyor; hit eylemi 0.45 s'de kesiliyor. → Eylem sürelerini klip/speed oranına eşitle ya da eylem bitiminde klip bitmemişse 'recover' fazı ile 0.15 s crossfade kullan.
- **Meşale ve diğer sol el eşyaları için ortak flicker/ölçek yolu** (`js/player/character.js`, kucuk): C16; ayrıca _torchObj hold() gibi 1/modelScale ölçek düzeltmesi almıyor. → _syncTorch'u Character.holdLeft('torch') haline getir; _torch() her iki eli tarasın.

### D_fizik
- **lineBlocked'a parametrik uç payı/yarıçap ölçeği ve 64 hücre eşiğinde fail-closed** (`js/world/physics.js`, kucuk): Aynı fonksiyon görüş hattı ve mermi süpürmesi için kullanılıyor (D-04); 64 hücre erken dönüşü şu an tetiklenmiyor (≤16 hücre) ama 'engel yok' döndürmesi ileride uzun menzilli çağrılarda duvar arkasından görmeye yol açar. → lineBlocked(ax,ay,az,bx,by,bz,{tMin=0.02,tMax=0.98,rScale=0.8,maxCells=64}) ; eşik aşılınca hücre sayısını DDA ile hat boyunca sınırlı sayıda ziyaret edin ya da true döndürün. segmentBlocked (çağrısı yok) kaldırılabilir.
- **Hıza bağlı alt adımlama / süpürme (oyuncu, düşman, cisim, gülle)** (`js/player/player.js`, orta): Tüm hareketli varlıklar ayrık nokta testiyle çarpışıyor; dt tavanı 0.1 s ile sprint/enkaz/gülle tünelliyor (D-07, D-08, D-10). → Hareket adımını n=ceil(|v*dt|/0.3) parçaya bölüp her parçada resolve/groundAt; gülle için prev→pos kutu kesişimi; bodies.update'te steps = max(steps, ceil(maxSpeed*dt/0.6)).
- **Oyuncu knock'unu düşmanlardaki gibi dt ile entegre et** (`js/player/player.js`, kucuk): D-02: savrulma mesafesi kare hızıyla 1.7–2.6× değişiyor; co-op adaleti. → hurt()/_hitPlayer'da knock'u tek seferlik vel += k*7 ekleyin ya da _updateGround'da pos += knock*dt, knock *= exp(-9dt).
- **Yüzme/yürüme geçişine histerezis ve ortak eşik** (`js/player/player.js`, kucuk): D-01 bandı kıyı boyunca sürekli gezer; ses/parçacık spam'i ve netState mode titremesi. → enter: g < wh-1.40; exit: floor > wh-1.30; mod değişiminden sonra 0.3 s kilit; enterWater içindeki dropCarry'yi yalnız gerçek dalışta (derinlik > 1.6) tetikleyin.
- **bodies.impulse'a kütle tabanı ve hız kısıtı; sürekli kuvvet yardımcısı** (`js/world/bodies.js`, kucuk): D-03/D-05: 0.2 kg enkaz 120 m/s; gayzer kare başına itki. → k = (1-d/r)*strength/max(mass,1); vel artışını clamp(≤15); force(pos,r,acc,dt) ekleyip gayzerde kullan; _step'e hafif hava sürüklemesi.
- **Uyku/uyanma: dış konum düzeltmesinde ve platform kaldırılırken uyandır; _yawOnly tahsislerini kaldır** (`js/world/bodies.js`, kucuk): D-09; ayrıca _yawOnly her kare her cisim için yeni Euler+Quaternion üretir (GC). → _collidePairs'te pen>1e-3 ise wake(); physics.removeTag sonrası etiket bbox'ındaki cisimleri uyandır; _yawOnly'de modül düzeyi geçici nesneler kullan.
- **Güverte çarpıştırıcıları: toplar, dümen, ambar kapağı** (`js/ship/ship.js`, kucuk): clampDeck yalnız direkleri engelliyor; koşuda oyuncu topun tam konumunda durabildi. → clampDeck'e model.cannons (r 0.7) ve wheel/hatch için daire/kutu itme ekleyin; düşmanlar da aynı fonksiyonu kullandığı için otomatik yayılır.
- **Platform yan yüzleri ve rampa primitifi** (`js/world/physics.js`, orta): D-13: tapınak sunağı/ada rıhtımı yandan girilebilir, basamak fizikte yok. → addPlatform içinde isteğe bağlı addBox(y1=top); addRamp(x,z,hw,hd,yaw,top0,top1) ile groundAt'te doğrusal yükseklik.
- **physics.lastPlatform global yan etkisini kaldır** (`js/world/physics.js`, kucuk): D-06: farklı sistemlerin çağrıları birbirinin sonucunu eziyor. → groundAt(x,z,yFeet,step,out) → out.platform doldursun; çağrı yerleri kendi sonucunu kullansın.
- **Yuvarlanan kaya için hareketli çarpıştırıcı ve ezme-önce sıralaması; ölü ifade temizliği** (`js/world/hazards.js`, orta): D-11/D-12; 371. satır 'p.y = Math.max(g + r*0.85, cond ? g + r*0.85 : -1e9)' her durumda aynı değeri verir. → Ezme kontrolünü resolve'dan önce al; 'hz:' etiketli kırılabilirleri resolve'dan dışla; yuvarlanırken oyuncu/düşmanı daireden dışa it; 371'i p.y = g + r*0.85 yap.
- **Düşman _place basamak ofsetini oyuncuyla eşitle ve eğim sınırı ekle** (`js/game/enemies.js`, kucuk): D-14 ulaşılabilirlik tutarsızlığı. → groundAt(x,z,pos.y); _move'da hedef yöndeki normal n.y<0.6 ise yönü kıyı boyunca sapıtın (su kaçınmasındaki gibi).
- **Oyuncu/sandal için dünya sınırı** (`js/player/player.js`, kucuk): D-18. → Ortak clampWorld(pos, lim=WORLD_HALF-250) ve 'edge' bildirimi.
- **Gereksiz groundAt çağrılarını azalt (oyuncu kare başına 3)** (`js/player/player.js`, kucuk): gOld her kare yeniden hesaplanıyor; önceki karenin g değeri biliniyor (platform taraması + arazi bilineer). → this._g (önceki kare) saklayıp gOld olarak kullanın; gNew ve g kalır.
- **Gemi karaya oturma sondası yoğunluğu ve bordadan tünelleme** (`js/ship/ship.js`, kucuk): 9 sabit nokta; dar bir kayalık/kum tepesi sondalar arasında kalabilir; gülle kutu testi dt=0.1'de boşluklu. → Gövde boyunca her 3 m'de bir sonda; gülle için yerel uzayda segment–kutu kesişimi.
- **Kayaya/enkaza benzer kozmetik cisimleri ayrı, ucuz bir parçacık yoluna taşı** (`js/world/hazards.js`, kucuk): Enkaz tam rijit cisim (çift çarpışma, platform testleri) olarak 9–13 s yaşıyor; zincirleme patlamada 40+ cisim. → Enkaz için bodies yerine effects benzeri basit balistik + zemin sekmesi; ya da enkaz cisimlerine 'noPairs' bayrağı.

### E_gemi
- **Liman halatını (Ship.dock) tüm limanlara genelle** (`js/game/shipControl.js:24 / js/ship/ship.js:324`, kucuk): Yalnız ana limanda tanımlı; uzak limanlarda demirli gemi 3+0.45·derinlik m zincirde salınıp rüzgâra dönüyor, iskeleye yaklaşabiliyor ve E-01 gibi taşınma hataları yalnız orada maskeleniyor. → Her karede `ports.atShip(s, 30)` ile en yakın limanın mooring'ini dock olarak kullan (ya da ports.list'ten r=14'lük dock kayıtları üret).
- **Yapay zekâ topçusu için balistik kalibrasyon** (`js/game/events.js:336`, kucuk): pitch = dist/260 formülü 20–40 m'de isabetli, 60–75 m'de hedefi 11–25 m aşıyor (koşu: 60 m → 86 m, 75 m → 100 m); düşman gemisi menzilinin yarısında etkisiz. → Ölçülen tabloyla (20 m→0–0.1, 40 m→0.05–0.15, 60–75 m→≈0.2) parçalı doğrusal eğim ya da küçük bir balistik çözücü (sürtünme dahil) kullan.
- **Biniş/iniş ışınlanmalarını animasyonlu geçişe çevir** (`js/game/shipControl.js:138,160,237`, orta): İskeleden gemiye (26 m'ye kadar), güverteden iskeleye ve kayıktan güverteye (0.8·L) anlık konum atlaması oluyor; merdiven tırmanışı (startClimb) tek animasyonlu yol. → İskele–gemi arası için iskele tahtası/merdiven tırmanma animasyonu (startClimb benzeri 1–1.5 s), kayıktan geminin merdiven istasyonuna yüzme/tırmanma zorunluluğu.
- **Kütle ve su çekimini SHIP_TYPES'a taşı** (`js/ship/ship.js:264, 417`, kucuk): mass getter'ı typeId'ye göre sabit kodlu (brigantine 2.2), draft 1.3+(m-1)·0.4 türetiliyor; yeni gemi tipi eklemek fizik kodunu değiştirmeyi gerektiriyor. → SHIP_TYPES'a `mass` ve `draft` alanları ekle, getter'ı `this.T.mass ?? 1` yap.
- **Rüzgâra karşı 'orsa' bölgesi ve dönüş yarıçapı ayarı** (`js/ship/ship.js:199-204, 353`, kucuk): windEfficiency tabanı 0.37 → rüzgâra tam karşı %37 hız; sloop dönüş yarıçapı 11 m (< gemi boyu) ve durağan/demirli gemi dümenle dönüyor; yelkenli hissi zayıf. → ±30° içinde verimi 0.1'e düşür ve HUD'da uyarı ver; sF tabanını 0.05'e, demirli çarpanı 0'a çek; turnRate'i sloop 0.45 / brigantine 0.33 dene.
- **İstasyon kilitlerini host onaylı yap** (`js/game/shipControl.js:175 / js/net/net.js:262`, orta): İki oyuncu aynı anda E'ye basınca her ikisi yerel kilidi alıp dümene geçiyor; host her iki 'helm' mesajını sırayla uyguluyor (son yazan kazanır). → Konuk 'lockReq' gönderir, host boşsa 'lockOk' ile onaylar, ancak o zaman takeHelm/takeCannon çalışır.
- **Gemiyi taşıyan tek yardımcı (relocate)** (`js/main.js:283 / js/game/events.js:389 / js/game/shipControl.js:39`, kucuk): Hızlı yolculuk, kurtarma, gemi değiştirme ve menü sahnesi geminin konum/hız/çapa/zincir/kayık durumunu ayrı ayrı ve eksik sıfırlıyor (E-01, E-11). → `Ship.prototype.relocate(x, z, yaw, { anchored })` içinde vx/vz/yawRate/anchorPt/_edgeWarned/sinking sıfırla, updateTransform(0) çağır, rowboat.dock(); tüm çağrı noktalarını buna bağla.
- **Sahip olunan gemiler arasında geçiş ve geliştirme devri** (`js/economy/shop.js:208-215 / js/game/shipControl.js:44`, orta): G.ownedShips yazılıyor ama hiçbir yerde okunmuyor; brigantine alınca sloop'un 800–5600 altınlık geliştirmeleri siliniyor, geri dönüş için tekrar 'satın alma' (0 altın) gerekiyor. → Tersanede 'Gemini değiştir' listesi (ownedShips), gemi başına kayıtlı upg/look; ya da satın almada geliştirme bedelinin %50'sini iade et.
- **Geri tepmeyi oyun zamanıyla ve yeniden kurulumla uyumlu yap** (`js/game/combat.js:304-305`, kucuk): setTimeout gerçek zamanla çalışıyor (duraklatmada da geri döner) ve rebuild() sonrasında eski pivot nesnesine yazıyor; görsel tutarsızlık riski. → cannonState[i].recoil = 0.26 sayaç tut, tickCannons'ta pivot.position.z = -0.25·(recoil/0.26) ile sür.
- **Çarpışma yaw itkisinin birimlerini tutarlı yap** (`js/ship/ship.js:402-403`, kucuk): _collide'da J birim kütleli (-(1+e)·vn) hesaplanıp yine kütleye bölünüyor; collideAll'da ise kütleli J kullanılıyor; ağır gemi kara çarpmasında orantısız az dönüyor. → _collide'da `J = -(1+e)*vn*this.mass` kullan ya da bölende mass'ı kaldır.

### F_dusman
- **Hafif vuruş kesme kilidi (poise'sız düşmanlar sürekli kesiliyor)** (`js/game/enemies.js`, orta): Oyuncu hafif zinciri 0.4 sn'de tekrarlanır, düşman hitAt ≥ 0.42 sn; 7 stamina/0.4 sn maliyeti 18/sn yenilenmenin altında → poise'sız/boss olmayan düşman hiç vuramaz (applyDamage:399 her vuruşta 'hit'). → Düşmana kısa bir tepki bekleme süresi (hitReactCd ≈ 1-1.5 sn) ya da basit poise ölçeri ekle; ölçer dolmadan yalnız üst gövde HitRecieve oynat.
- **Hayalet mermisi (ghostbolt) kaçınmayı boşa çıkarıyor** (`js/game/enemies.js`, kucuk): s.vel.lerp(want, dt*homingK) (1456) 4 sn boyunca sürer; kaçınma dokunulmazlığında mermi geçip geri dönüyor → dodge anlamsız. → Hedefi geçince (dot(vel, hedef-pos) < 0) ya da hedef invuln>0 iken homing'i kapat.
- **Konukta hasar sayıları ve düşman can çubukları** (`js/game/enemies.js`, kucuk): dmgNumber yalnız applyDamage'da (host); konuk hurt() 354'te erken döner; _updateHud showBar konukta state hep 'patrol' olduğundan yalnız showT ile görünür. → Konuk hurt() içinde tahmini hasarla dmgNumber emit et; _updateHud'da konukta `hp < maxHp` yeterli olsun; ya da snapshot'a 'lastHit' bayrağı ekle.
- **findCover tüm physics.all dizisini tarıyor** (`js/game/enemies.js`, kucuk): 1369: her nişancı 'chase'teyken 6 Hz ile tüm çarpıştırıcılar (ağaç/kaya/duvar, binlerce olabilir) dolaşılır. → physics.cells uzaysal karmasından 12 m yarıçaplı hücreleri al (resolve/lineBlocked'daki gibi).
- **Kraken dokunaç canı co-op ölçeğinde değil** (`js/game/bosses.js`, kucuk): Dokunaç hp 220 sabit; kesme hasarı (260×coop) ölçekli → kalabalık co-op'ta Kraken orantısız hızlı düşer. → ten.hp/maxHp'yi `220 * (1 + 0.5*G.remotes.size)` yap.
- **Hayaletler arasında ayrışma yok** (`js/game/enemies.js`, kucuk): near() (1344) hayaletleri dışlıyor → hayalet grupları üst üste biniyor (gece dalgaları, Amiral tayfası). → Hayalet-hayalet çiftleri için daha küçük yarıçapla ayrışma uygula (`!o.T.ghost || e.T.ghost`).
- **Uzak oyuncuların algı değiştiricileri (meşale/eğilme/mağara) eşitlenmiyor** (`js/net/net.js`, kucuk): _perceive pl.torch/crouch/inCave okur; RemotePlayer bunları tutmaz (netState torch gönderiyor ama kopyalanmıyor) → konuk meşalesiyle gece görünmez, eğilerek gizlenemez. → RemotePlayer.update'te `this.torch=t.torch; this.crouch=!!t.crouch` ata; netState'e crouch ekle.
- **Saldırı jetonu uzak sahiplerde bayatlıyor** (`js/game/enemies.js`, kucuk): requestToken yalnız ölü/hedef değiştirmiş sahipleri temizler; 7 m'den uzağa itilen/kovalayan sahip jetonu tutar, yakındakiler kuşatmada bekler. → Temizlikte `x.pos.distanceTo(tgt) > 8 || !['chase','attack'].includes(x.state)` sahipleri de düşür.
- **BossBase.dispose geometri/malzemeleri bırakmıyor** (`js/game/bosses.js`, kucuk): parts yalnız scene.remove edilir; Kraken manto/dokunaç InstancedMesh, Yılan gövdesi, sütunlar GPU belleğinde kalır (boss her geri çekilme/yeniden doğuşta yeniden yaratılır). → dispose içinde parts.traverse ile geometry/material.dispose çağır.
- **Güvertede kaçınma yer değiştirmiyor** (`js/player/player.js`, kucuk): _updateDeck action.dir itkisini uygulamaz; dodge güvertede yalnız animasyon + dokunulmazlık (Kraken dokunaç ezmesinden kaçmak zor). → _updateGround'daki dodge wish hesabını gemi yereline çevirip local'e uygula.
- **Bazı saldırı durumları klipten uzun sürüyor (son karede donma)** (`js/game/enemies.js`, kucuk): DASH dur 1.4 vs Atk3 klibi 1.07 sn (0.33 sn donuk poz); summon 2.2 sn vs Taunt 1.03 sn; kalan hamlelerde fark ≤0.03 sn. → DASH için ayrı klip/dur=1.1, insan boss çağırmasında Taunt sonrası IdleCombat'a dön.
- **Boss çubuğu iki kaynaktan her kare yazılıyor** (`js/game/enemies.js`, kucuk): enemies.update her kare bossBar (çoğunlukla null) emit eder, bosses.update aynı karede tekrar; sonuç kayıt sırasına (enemies önce) bağlı; iki kaynak farklı değer verdiğinde (Amiral Enemy + CursedAdmiral) HUD son yazanı gösterir. → Yalnız değişimde emit et ya da hud'da kaynak kimliğiyle öncelik (efsanevi boss > mini boss).

### G_icerik
- **Ganimet üretimini ev sahibi otoriteli yap (lootReq mesajı)** (`/home/user/SON-HAZ-NE/js/treasure/treasure.js`, orta): B03'ün kalıcı çözümü; tüm "loot" olaylarının tek yoldan geçmesi hile ve kayıp riskini kaldırır. → G.on("loot") konukta toHost({t:"lootReq", table, pos, from, src}) göndersin; ev sahibi kaynağı (sandık id, tehlike id) doğrulayıp spawnLoot + pickupSpawn yayınlasın; islands/hazards once-kümelerini ev sahibi tutsun.
- **Ekonomi değişmezi testi: her tüccar×eşya için sellPrice < buyPrice** (`/home/user/SON-HAZ-NE/js/economy/shop.js`, kucuk): B01 benzeri döngülerin tekrar oluşmasını engeller; fiyat tablosu veri odaklı olduğundan test ucuz. → tests/scenarios altına MERCHANTS üzerinde döngü kuran bir senaryo ekle; maksimum priceBonus (0.35) ve mods.price (1.18) ile de kontrol et.
- **Konuk için görev/keşif kalıcılığı** (`/home/user/SON-HAZ-NE/js/game/quests.js`, kucuk): B06; konuk her oturumda haritasını ve koleksiyonunu kaybediyor. → progress._guestSave örüntüsünü quests için uygula (dk_quests_guest); start()'ta G.online && !G.isHost ise oradan oku; stop()/levelUp benzeri anlarda yaz.
- **Kayıt kapsamını genişlet: player.carrying/equipped/stamina/poison, rowboat state+cargo, fishing.bait** (`/home/user/SON-HAZ-NE/js/game/game.js`, orta): B04 ve küçük sürtünmeler (yüklemede yem seçimi/donanım sıfırlanıyor). → game.serialize player bloğuna equipped/carrying ekle; shipControl ya da misc save() içine rowboat {state,x,z,yaw,cargo}; fishing save() {bait}.
- **spawnChest içinde otomatik ağ yayını** (`/home/user/SON-HAZ-NE/js/treasure/treasure.js`, kucuk): B09; her çağıran ayrı emit yapmayı unutuyor. → spawnChest sonunda (G.online && G.isHost && !opts.silentNet) G.emit("netChestSpawn", {chest: this.chestNet(c)}); resolveDig/takeFromHold'daki tekrar emit'leri kaldır.
- **Deniz olaylarını (events) konukla paylaş** (`/home/user/SON-HAZ-NE/js/game/events.js`, orta): B08; co-op'ta içerik eşitsizliği ve "görünmeyen" bildirimler. → spawnFloating/collectFloating için relay + konukta body'siz görsel; etkileşim floatReq ile ev sahibine; G.notify metinlerini broadcast et.
- **Zar oyununu kayda ve adil ödeme tablosuna bağla** (`/home/user/SON-HAZ-NE/js/ui/dice.js`, kucuk): B10. → Keseyi time.save() içine {dicePurses:{id:{day,gold}}} olarak yaz; 6-6 ödülünü ×2 yap ya da rakip 6-6'da bahsin iki katı kaybettir; diceWin XP günlük sınırla.
- **Aşçıya balık pişirtmede onay ve nadir balık koruması** (`/home/user/SON-HAZ-NE/js/game/quests.js`, kucuk): quests.js:369-378 tüm balıkları (420 değerli kılıç balığı dahil) 14 değerli ızgaraya çeviriyor; geri alınamaz. → Yalnız siradan/yaygin balıkları pişir ya da seçim listesi aç; toplam değer kaybını onay kutusunda göster.
- **Hikâye 1. aşamada sandığı açan oyuncuya yönlendirme** (`/home/user/SON-HAZ-NE/js/game/quests.js`, kucuk): Aşama 2 yalnız chestSold ile açılıyor (143-147); Martı sandığını açan oyuncu için ipucu yok, yeni harita 150 altın. → chestOpened dinle: stage===1 && ilkHazineBulundu ise "Sedef Hanım açılmış sandık istemiyor; ganimeti sat ya da yeni harita al" bildirimi; ya da ganimetin Sedef'e satışını da ilk satış say.
- **Martı/balık sürüsü olayını gerçek etkiye bağla** (`/home/user/SON-HAZ-NE/js/game/events.js`, kucuk): events.js:140 "birds" olayı yalnız bildirim; oyuncu oltayı hazırlasa da bir şey değişmiyor. → fish._populate için geçici yoğunluk çarpanı ya da time.isActive("fishFrenzy") benzeri 60 s'lik yerel etkinlik ekle.
- **Ele geçirme ve kazazede altınını da tayfayla paylaş** (`/home/user/SON-HAZ-NE/js/game/events.js`, kucuk): events.js:264-265 ve 207 p.inv.gold += ... doğrudan; satış gelirleri paylaşılırken bu kaynaklar paylaşılmıyor (tutarsızlık). → shop.earn(gold) kullan.
- **Konuk hayalet ışık kurulumunda _seaSpot başarısızlığını ele al** (`/home/user/SON-HAZ-NE/js/game/worldEvents.js`, kucuk): applyNet (330-334) _wisps() false dönerse this.wisps null kalır ve konuk ışıkları hiç görmez. → applyNet içinde orbs'u doğrudan oluşturan ayrı bir _wispsVisual(lead,to) kullan; _seaSpot aramasını yalnız ev sahibinde yap.
- **Hayvan GPU kaynaklarını paylaşımlı önbellekten kullan** (`/home/user/SON-HAZ-NE/js/wildlife/animals.js`, orta): B14; prosedürel modeller her örnekte yeniden üretiliyor. → boarModel/crocModel vb. geometri ve materyalleri modül düzeyinde önbelleğe al (seed yalnız renk/ölçek için), dispose() içinde yalnız örneğe özgü olanları serbest bırak.

### H_coop_ui
- **Pusula işaretlerini her karede innerHTML ile yeniden kurma** (`js/ui/hud.js`, kucuk): Ölçüm: hud.update 0.484 ms/kare (pusula açık) vs 0.038 ms (kapalı); 10 işaret + 1 hedef için 33 span her karede yeniden ayrıştırılıyor; uzak oyuncu ve işaret sayısıyla büyür. → Span'ları işaret kimliği başına bir kez yarat, her karede yalnız style.left/color güncelle; işaret kümesi değişince yeniden kur.
- **Snapshot bant genişliği: delta/yakınlık eleme ve ikili serileştirme** (`js/net/net.js`, orta): Tam snapshot 2.3–3 KB (hayvan listesi 1.4–1.9 KB baskın), konuk başına ~20–36 KB/s; 3 konukta ~1 Mbit/s ev sahibi yükü. Çalışıyor ama mobil/zayıf bağlantıda sorun çıkarır. → Hayvan/düşmanları oyunculara yakınlığa göre ele (ör. 400 m), değişmeyen alanları gönderme, alan adlarını kısalt ya da ArrayBuffer kullan; snapshot sıklığını uzaklığa göre düşür.
- **Konuk başlangıç konumu her zaman ana liman** (`js/main.js`, kucuk): applyWorld (main.js:335) konuğu limana koyar; ev sahibi uzak bir adadaysa konuk saatlerce yol alır ya da hızlı yolculuk bekler. → Konuğu ev sahibinin gemisine (güverte) ya da ev sahibine yakın güvenli noktaya doğur; ya da katılımda isteğe bağlı 'kaptana ışınlan'.
- **Kalp atışı zaman aşımı ve yeniden bağlanma akışı** (`js/net/net.js`, orta): Ping yalnız gösterim; ev sahibi sekmesi arka plana alınırsa dünya donar ve konuklar bilgi almaz; bağlantı koptuğunda konuk menüye düşer, konum/sandık/ilerleme bağlamı kaybolur. → Konukta son snapshot yaşı > 5 s ise uyarı, > 20 s ise otomatik yeniden katılma (aynı kod, aynı ad); ev sahibinde 'st' yaşı ile zaman aşımı ve _dropPeer.
- **Oyuncu atma / engelleme arayüzü** (`js/ui/menu.js`, kucuk): net.js:444 'kick' işleyicisi var ama ev sahibinin gönderebileceği bir arayüz yok; herkese açık odalarda istenmeyen oyuncu çıkarılamaz. → Lobi yuvalarına ve duraklat menüsüne 'At' düğmesi: toPeer(id,{t:'kick', why}) + conn.close + engel listesi (peer id).
- **Mesaj şeması doğrulama ve oran sınırı yardımcısı** (`js/net/net.js`, orta): H07'deki tüm doğrulama eksikleri tek noktadan çözülebilir; ev sahibi otoritesi iddiası belgelerde var ama kodda yalnız fizik/AI için geçerli. → _hostData başında tür başına {alanlar, tipler, aralıklar} tablosu ile doğrula; pid başına token-bucket (ör. 60 msg/s, chat 3/s); hatalı mesajlarda sayaç ve 3 ihlalde düşürme.
- **Panel gövdelerine ortak kaydırma kuralı** (`css/style.css`, kucuk): Lobi ve Oda Kur dışında ileride eklenecek sabit içerikli paneller de 540–600 px yüksekliklerde kırpılacak; .panel overflow hidden. → .panel > .col { min-height:0; overflow:auto } ya da ui.panel() gövdeyi otomatik .scroll sarmalayıcıya alsın; @media (max-height:600px) için uiScale 0.9.
- **Dünya olaylarını konuklarla paylaş** (`js/game/events.js`, orta): H08: olaylar (varil/şişe/sandık/kazazede/gök taşı/düşman gemisi bildirimleri) co-op'ta yalnız ev sahibine; konuk için içerik eksik. → floating → netSnapshot (id,kind,pos) + applySnapshot (mesh yaratma); konuk collectFloating → 'floatReq' → ev sahibi ödülü 'give' ile gönderir; olay bildirimlerini broadcast({t:'notify'}).
- **Ana menü sütunu 540 px yükseklikte kaydırmaya düşüyor** (`css/style.css`, kucuk): Ölçüm: .menu-side scrollHeight 557 > 540; 'ÇIKIŞ' ve alt bilgi görünür alan dışında. → @media (max-height:600px): logo-bottom font küçült, mbtn padding/gap min değerlerini düşür, menu-news zaten gizli.
- **Konuk için duraklat menüsünde kaydet ve periyodik yerel kayıt** (`js/ui/menu.js`, kucuk): H16: konuk ilerlemesi yalnız çıkış olaylarında yazılır; saveNow konuğu zaten destekliyor. → menu.pause'da Kaydet'i herkese göster (konukta 'Kişisel ilerleme'); game.update'te autosave'i isHost koşulundan ayır (konukta yalnız yerel yazım).
- **İşaret silme eşitlemesi ve sınır** (`js/game/quests.js`, kucuk): H19: silme yerel, ağ işaretleri sınırsız. → 'markerDel' {x,z} mesajı; ağ işleyicisinde 30 sınırı ve not uzunluğu 40.
