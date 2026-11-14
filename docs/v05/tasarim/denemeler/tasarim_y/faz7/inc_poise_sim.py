# İnceleme denemesi (salt-okur model): H-20 / K7-5 önerisi gerçekçi kılıç zinciri altında ölçütü sağlıyor mu?
# Model: enemies.js applyDamage (377-417) tepki dalları + _attackUpdate (941-977) + combat.js zincir (chainAt) kuralları.
import random
def run(player_hitAt, proposed, seed, cadence='real', T=10.0, dt=1/60):
    rnd = random.Random(seed)
    sw = [dict(hitAt=0.42,dur=0.9),dict(hitAt=0.44,dur=0.95),dict(hitAt=0.52,dur=1.05),dict(hitAt=0.58,dur=1.2)]
    # oyuncu vuruş zamanları
    hits=[]; t=0.0; step=1
    chainAt={1:0.40,2:0.42,3:0.82}
    while t < T:
        hits.append((t+player_hitAt[step], step==3))
        t += chainAt[step] if cadence=='real' else 0.42
        step = step%3+1
    hits.sort()
    st='chase'; stT=0.0; stunT=0; atkCd=0.8+rnd.random(); mv=None; flinchCd=0.0
    started=0; reached=0; hi=0; tt=0.0
    while tt < T:
        # oyuncu vuruşları
        while hi < len(hits) and hits[hi][0] <= tt:
            fin = hits[hi][1]; hi+=1
            if fin:
                st='stunned'; stunT=1.0; stT=0; mv=None; continue
            if st in ('stunned',):
                continue
            if proposed:
                armored = (st=='attack' and stT >= 0.7*mv['hitAt'])
                if flinchCd>0 or armored:
                    continue
            st='hit'; stT=0; mv=None
            if proposed: flinchCd=1.2
        # düşman
        stT+=dt; atkCd-=dt; flinchCd=max(0,flinchCd-dt)
        if st=='stunned':
            stunT-=dt
            if stunT<=0: st='chase'; stT=0
        elif st=='hit':
            if stT>0.45: st='chase'; stT=0
        elif st=='chase':
            if atkCd<=0:
                mv=rnd.choice(sw); st='attack'; stT=0; started+=1; mv['done']=False
        elif st=='attack':
            if not mv.get('done') and stT>=mv['hitAt']:
                mv['done']=True; reached+=1
            if stT>=mv['dur']:
                atkCd=1.0+rnd.random()*1.1; st='chase'; stT=0
        tt+=dt
    return started, reached
for label, ph in (('bugünkü oyuncu hitAt',{1:0.25,2:0.27,3:0.36}),('F7-2 oyuncu hitAt',{1:0.26,2:0.16,3:0.44})):
    for prop in (False, True):
        for cad in ('real','0.42'):
            res=[run(ph,prop,s,cad) for s in range(200)]
            avg_s=sum(r[0] for r in res)/len(res); avg_r=sum(r[1] for r in res)/len(res)
            ge2=sum(1 for r in res if r[1]>=2)/len(res)
            print(f"{label:22s} öneri={'evet' if prop else 'hayır':5s} tempo={cad:5s}  başlatılan={avg_s:5.2f}  vuruş anına ulaşan={avg_r:5.2f}  P(>=2)={ge2:.2f}")
