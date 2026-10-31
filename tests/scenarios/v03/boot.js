[
 {wait: 1500, shot: '/tmp/preview/p2/menu.png'},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `for(let i=0;i<4;i++) DK.sim(1); ({hour: DK.sky.hour.toFixed(2), w: DK.sky.weatherKey, day: DK.time.day, tide: DK.time.tide().toFixed(2), bodies: DK.bodies.list.length, ships: DK.G.ships.map(s=>s.id), fc: DK.sky.forecast.map(f=>f.key+'@'+f.at.toFixed(1))})`},
 {wait: 500, shot: '/tmp/preview/p2/start.png'},
 {js: `DK.sky.hour=10.2; DK.time.day=2; for(let i=0;i<3;i++) DK.sim(1); ({trader: !!DK.details.trader, phase: DK.details.trader&&DK.details.trader.phase, active:[...DK.time._active]})`},
 {js: `DK.sky.setWeather('firtina', true); for(let i=0;i<6;i++) DK.sim(1); ({w: DK.sky.weatherKey, wet: DK.sky.wetness.toFixed(2)})`},
 {wait: 500, shot: '/tmp/preview/p2/storm.png'},
]
