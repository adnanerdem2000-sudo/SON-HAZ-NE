// dice.js kurallarının beklenen değeri (bahis = 1), tam sayım
let ev = 0, pWin = 0, pLose = 0, pTie = 0;
for (let a1 = 1; a1 <= 6; a1++) for (let a2 = 1; a2 <= 6; a2++) for (let b1 = 1; b1 <= 6; b1++) for (let b2 = 1; b2 <= 6; b2++) {
  const pr = 1 / 1296; const me = a1 + a2, they = b1 + b2; let net;
  if (a1 === 6 && a2 === 6) net = 3;          // win = bet*4 → net +3
  else if (a1 === 1 && a2 === 1) net = -1;
  else if (b1 === 6 && b2 === 6) net = -1;
  else if (me > they) net = 1;
  else if (me < they) net = -1;
  else net = 0;
  ev += pr * net; if (net > 0) pWin += pr; else if (net < 0) pLose += pr; else pTie += pr;
}
console.log(JSON.stringify({ evPerBet: +ev.toFixed(4), pWin: +pWin.toFixed(4), pLose: +pLose.toFixed(4), pTie: +pTie.toFixed(4) }));
