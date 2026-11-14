# İnceleme denemesi: player.js:541-545 geri tepme modeli (60 Hz), duran oyuncuda (wish=0, accel 13) toplam yer değiştirme
import math
def disp(K, T=1.5, dt=1/60, accel=13):
    v=0; x=0; k=K; t=0; vmax=0
    while t<T:
        # damp(v, 0, accel, dt) = v*exp(-accel*dt)
        v = v*math.exp(-accel*dt)
        v += k*60*dt
        k *= math.exp(-9*dt)
        if abs(k) < 0.1: k = 0
        x += v*dt; vmax=max(vmax,v); t+=dt
    return x, vmax
for K in (0.8, 1.5, 3, 4.5, 6, 9, 11):
    x,vm = disp(K); print(f"knock büyüklüğü {K:>4}: toplam itme {x:.2f} m, en yüksek hız {vm:.2f} m/sn")
