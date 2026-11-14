const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
for (const id of ['kizil_kanyon_ruin_0', 'sis_adasi_ruin_0', 'buzdisi_ruin_1', 'kadim_tapinak_ruin_1', 'mercan_halkasi_ruin_0']) console.log(id, hashStr(id) % 10, (hashStr(id) % 10) < 6 ? 'BULMACA ADAYI' : '-');
