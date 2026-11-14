// PeerJS 1.5.5 JSON DataConnection._send davranışının birebir kopyası (vendor/peerjs/peerjs.min.js):
//   let n=this.encoder.encode(this.stringify(e)); if(n.byteLength>=ef.chunkedMTU) return void this.emitError('message-too-big',...); this._bufferedSend(n)
import fs from 'node:fs';
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/vendor/peerjs/peerjs.min.js', 'utf8');
const MTU = +(/chunkedMTU=(\d+)/.exec(src)[1]);
console.log('vendor chunkedMTU =', MTU, '| JSON _send sınırı kodda:', /byteLength>=ef\.chunkedMTU\)return void this\.emitError\(ew\.MessageToBig/.test(src));
const enc = new TextEncoder();
const send = (m) => { const n = enc.encode(JSON.stringify(m)).byteLength; return n >= MTU ? { gonderildi: false, hata: 'message-too-big', bayt: n } : { gonderildi: true, bayt: n }; };
// 1) 06a/06a2 testi: konuk 200 KB sohbet gönderir → konuğun kendi PeerJS'i göndermez; ev sahibinin 64 KB sınırına hiç ulaşmaz
console.log('1) 200 KB sohbet (konuk tarafı):', send({ t: 'chat', text: 'A'.repeat(200000) }));
console.log('   65 KB sohbet  (konuk tarafı):', send({ t: 'chat', text: 'A'.repeat(65000) }), '→ ev sahibindeki MAX_MSG_BYTES=64 KB dalı stok istemciyle erişilemez');
// 2) ~15 KB'lık 'st' konukta gönderilebiliyor; ev sahibi bunu her anlık görüntüye ham ekliyor (net.js:737)
const st = { x: 1.23, y: 2.5, z: -40.1, yaw: 1.2, mode: 'ground', anim: 'Run', hp: 100, eq: 'sword', pad: 'A'.repeat(15800) };
console.log('2) 15 KB st (konuk tarafı):', send({ t: 'st', s: st }));
const hostSt = { x: 10, y: 2, z: 5, yaw: 0, mode: 'deck', anim: 'Idle', hp: 100, eq: 'none', ship: 'ship_main', lx: 0.2, ly: 0, lz: 1 };
const ship = { id: 'ship_main', typeId: 'sloop', look: {}, name: 'Martı', st: Array.from({ length: 23 }, (_, i) => i * 1.1) };
const snap = { t: 'snap', players: { host: hostSt, guestA: st, guestB: hostSt }, ships: [ship], floats: [], shots: [] };
console.log('   ev sahibinin sonraki anlık görüntüsü:', send(snap), '→ her konuk bağlantısında error → net.js:233 _dropPeer');
// 3) Gerçekçi ek yük (02. belge/E-09 ölçümü: anlık görüntü 2,3–3 KB): 13 KB'lık st bile yeter
const st13 = { ...st, pad: 'A'.repeat(13000) };
const extra = Array.from({ length: 30 }, (_, i) => [ 'en' + i, +(i * 3.3).toFixed(2), 1.2, -(i * 2.1).toFixed(2), 0.5, 80, 'chase', 'Run' ]);
console.log('3) 13 KB st (konuk):', send({ t: 'st', s: st13 }), '| ağır anlık görüntü (en dahil):', send({ ...snap, players: { host: hostSt, guestA: st13 }, en: extra }));
