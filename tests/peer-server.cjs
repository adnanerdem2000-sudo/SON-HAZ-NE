// Yerel PeerJS sinyal sunucusu (co-op testleri için). Gereken paket: npm i peer
//   node tests/peer-server.cjs            → 127.0.0.1:9000
// Oyun, ?peerhost=127.0.0.1&peerport=9000 adres parametreleriyle bu sunucuya bağlanır.
const { PeerServer } = require('peer');
PeerServer({ port: Number(process.env.PEER_PORT || 9000), host: '127.0.0.1', path: '/', allow_discovery: true }, (s) => console.log('peer server up', s.address()));
