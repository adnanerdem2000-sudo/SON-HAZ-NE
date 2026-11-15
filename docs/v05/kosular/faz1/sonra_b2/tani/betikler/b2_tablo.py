# B2 önce/sonra tablosu: siniflandirma.json (v0.4 "önce") + sonra_b2 raporları (yalnız okuma)
import json, glob, os, sys
S = json.load(open('/home/user/SON-HAZ-NE-w2/docs/v05/kosular/faz1/b/siniflandirma.json', encoding='utf8'))
O = '/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2'
def kontroller(ad):
    f = f'{O}/{ad}.json'
    if not os.path.exists(f): return {}
    r = json.load(open(f, encoding='utf8'))
    out = {}
    for k in r.get('kontroller', []) or r.get('checks', []):
        kid = (k.get('id') or k.get('etiket') or k.get('name') or '')
        lab = k.get('etiket') or k.get('label') or k.get('name') or ''
        key = lab.split(' ')[0] if lab else kid
        out[key] = ('GECTI' if k.get('ok') else 'KALDI', json.dumps(k.get('deger', k.get('value')), ensure_ascii=False)[:90])
    return out
esle = {'02_hizli_yolculuk.js': ['02_hizli_yolculuk_normal', '02_hizli_yolculuk_noworker_1', '02_hizli_yolculuk_noworker_2', '02_hizli_yolculuk_noworker_3'],
        'coop/02_hizli_yolculuk_konuk.cjs': ['coop_02_hizli_yolculuk_konuk'], '02_depolama_kapali.js': ['02_depolama_kapali'], '02_acilis_akisi.js': ['02_acilis_akisi'],
        '00_acilis.js': ['00_acilis'], '02_acilis_hatalari.js': ['02_acilis_hatalari'], '02_yukleme_bekleme.js': ['02_yukleme_bekleme']}
for r in S:
    if r['test'] not in esle: continue
    if r['once_v04'] == 'YESIL' and '-v' not in sys.argv: continue
    sonra = []
    for ad in esle[r['test']]:
        k = kontroller(ad).get(r['kimlik'])
        sonra.append(f"{ad.replace('02_hizli_yolculuk_','')}: {k[0]} ({k[1]})" if k else f"{ad}: yok")
    print(f"{r['test']} | {r['kimlik']} | önce {r['once_v04']} | " + ' ; '.join(sonra))
