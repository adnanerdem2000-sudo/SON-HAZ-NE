#!/usr/bin/env python3
# B2 düzeltme koşularının özeti: her rapor için durum, kontrol sayısı, kalanlar, sayfa hatası, işaretçi kilidi kipi; HYS-01 değeri.
import json, glob, os, sys
kok = sys.argv[1] if len(sys.argv) > 1 else '/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme'
for f in sorted(glob.glob(kok + '/*.json') + glob.glob(kok + '/once/*.json') + glob.glob(kok + '/tani/*.json')):
    try: d = json.load(open(f))
    except Exception as e: print(os.path.relpath(f, kok), 'OKUNAMADI', e); continue
    ks = d.get('kontroller') or []
    if not ks and 'checks' in d: ks = d['checks']
    ok = [c for c in ks if c.get('ok')]
    kalan = [c.get('id') or (c.get('etiket') or c.get('label') or '')[:12] for c in ks if not c.get('ok')]
    s = d.get('sonuc') or {}
    durum = s.get('durum') if isinstance(s, dict) else s
    hys = [c.get('deger') for c in ks if c.get('id') == 'HYS-01']
    sayfa = (d.get('hatalar') or {}).get('sayfa')
    kip = (d.get('isaretciKilidi') or {}).get('kip')
    print(f"{os.path.relpath(f, kok)} | {durum} | {len(ok)}/{len(ks)} | kalan {','.join(map(str, kalan)) or '-'} | sayfa {len(sayfa) if isinstance(sayfa, list) else sayfa} | kilit {kip}" + (f" | HYS-01 {hys[0]}" if hys else ''))
