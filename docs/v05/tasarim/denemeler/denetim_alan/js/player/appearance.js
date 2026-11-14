// Korsan görünüm seçenekleri (veri odaklı)

export const SKIN_TONES = ['#f3d6bd', '#e8bf9a', '#d9a47a', '#c08a5c', '#a06c45', '#7f5234', '#603b24', '#45291a'];
export const HAIR_COLORS = ['#1c1410', '#3b2516', '#5a3a1e', '#8a5a2b', '#b5803f', '#d9b36c', '#a33a1f', '#6e6e6e', '#d8d8d8'];
export const EYE_COLORS = ['#3b2516', '#2b5a8a', '#3d7a3a', '#6b6b6b', '#8a5a2b'];
export const CLOTH_COLORS = ['#7a1f1f', '#a33a2a', '#1f3a5a', '#2a5a7a', '#2f4f2f', '#4f6b2f', '#3b2a1a', '#6b4a2c', '#e8dcc2', '#2a2a2a', '#5a2a5a', '#b8860b'];

export const OPTIONS = {
  gender: [['m', 'Erkek'], ['f', 'Kadın']],
  body: [['kaba', 'Kaba denizci'], ['subay', 'Eski asker'], ['cevik', 'Çevik korsan'], ['kukuleta', 'Kukuletalı'], ['kahin', 'Kâhin']],
  cape: [['yok', 'Yok'], ['var', 'Pelerin']],
  hairStyle: [['kisa', 'Kısa'], ['uzun', 'Uzun'], ['daginik', 'Dağınık'], ['orgulu', 'Örgülü'], ['atkuyrugu', 'At kuyruğu'], ['kel', 'Kel']],
  beard: [['yok', 'Yok'], ['kisa', 'Kısa sakal'], ['uzun', 'Uzun sakal'], ['biyik', 'Bıyık'], ['orgulu', 'Örgülü sakal']],
  face: [['oval', 'Oval'], ['genis', 'Geniş'], ['ince', 'İnce'], ['koseli', 'Köşeli']],
  nose: [['normal', 'Normal'], ['kanca', 'Kanca'], ['kalkik', 'Kalkık'], ['iri', 'İri']],
  chin: [['normal', 'Normal'], ['sivri', 'Sivri'], ['genis', 'Geniş']],
  scar: [['yok', 'Yok'], ['yanak', 'Yanak yarası'], ['goz', 'Göz yarası'], ['alin', 'Alın yarası']],
  tattoo: [['yok', 'Yok'], ['kol', 'Kol dövmesi'], ['iki', 'İki kol']],
  facemark: [['yok', 'Yok'], ['cil', 'Çiller'], ['boya', 'Savaş boyası']],
  hat: [['yok', 'Yok'], ['tricorn', 'Üç köşeli şapka'], ['kaptan', 'Kaptan şapkası'], ['bandana', 'Bandana'], ['korsan', 'Korsan şapkası'], ['orijinal', 'Gövdenin başlığı']],
  coat: [['yok', 'Yok'], ['uzun', 'Uzun korsan ceketi'], ['yelek', 'Deri yelek']],
  eyepatch: [['yok', 'Yok'], ['sol', 'Sol göz'], ['sag', 'Sağ göz']],
  earring: [['yok', 'Yok'], ['altin', 'Altın küpe'], ['gumus', 'Gümüş küpe']],
  necklace: [['yok', 'Yok'], ['altin', 'Altın kolye'], ['madalyon', 'Madalyon']],
  gloves: [['yok', 'Yok'], ['deri', 'Deri eldiven']],
  belt: [['kemer', 'Deri kemer'], ['kusak', 'Kumaş kuşak']],
};

// Mağazada kilidi açılacak kozmetikler (savaş gücü vermez)
export const COSMETIC_PRICES = {
  'hat:kaptan': 350, 'hat:korsan': 220, 'coat:uzun': 400, 'coat:yelek': 180,
  'necklace:altin': 260, 'necklace:madalyon': 480, 'earring:gumus': 90, 'earring:altin': 150,
  'gloves:deri': 120,
};
export const DEFAULT_UNLOCKED = ['hat:yok', 'hat:tricorn', 'hat:bandana', 'hat:orijinal', 'cape:yok', 'cape:var', 'coat:yok', 'eyepatch:yok', 'eyepatch:sol', 'eyepatch:sag', 'earring:yok', 'necklace:yok', 'gloves:yok'];

export function defaultAppearance(gender = 'm') {
  return {
    name: gender === 'm' ? 'Kaptan Deniz' : 'Kaptan Derya',
    gender,
    body: gender === 'm' ? 'kaba' : 'cevik',
    cape: 'yok',
    skin: 2,
    hairStyle: gender === 'm' ? 'daginik' : 'atkuyrugu',
    hairColor: 1,
    beard: gender === 'm' ? 'kisa' : 'yok',
    beardColor: 1,
    eyeColor: 0,
    height: 1.0,
    build: 1.0,
    age: 0.2,
    face: 'oval',
    nose: 'normal',
    chin: 'normal',
    scar: 'yok',
    tattoo: 'yok',
    facemark: 'yok',
    hat: 'tricorn',
    hatColor: '#2a2a2a',
    coat: 'yok',
    coatColor: '#7a1f1f',
    shirtColor: '#e8dcc2',
    pantsColor: '#3b2a1a',
    bootsColor: '#2a2a2a',
    beltColor: '#6b4a2c',
    eyepatch: 'yok',
    earring: 'yok',
    necklace: 'yok',
    gloves: 'yok',
    belt: 'kemer',
  };
}

export function randomAppearance(r = Math.random) {
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const g = r() < 0.5 ? 'm' : 'f';
  const a = defaultAppearance(g);
  a.body = g === 'm' ? pick(['kaba', 'kaba', 'subay', 'kahin']) : pick(['cevik', 'cevik', 'kukuleta', 'kahin']);
  a.cape = r() < 0.25 ? 'var' : 'yok';
  a.skin = Math.floor(r() * SKIN_TONES.length);
  a.hairStyle = pick(OPTIONS.hairStyle)[0];
  a.hairColor = Math.floor(r() * HAIR_COLORS.length);
  a.beard = g === 'm' ? pick(OPTIONS.beard)[0] : 'yok';
  a.beardColor = a.hairColor;
  a.eyeColor = Math.floor(r() * EYE_COLORS.length);
  a.height = 0.94 + r() * 0.12;
  a.build = 0.92 + r() * 0.2;
  a.age = r();
  a.face = pick(OPTIONS.face)[0];
  a.nose = pick(OPTIONS.nose)[0];
  a.chin = pick(OPTIONS.chin)[0];
  a.scar = r() < 0.3 ? pick(OPTIONS.scar)[0] : 'yok';
  a.tattoo = r() < 0.3 ? pick(OPTIONS.tattoo)[0] : 'yok';
  a.hat = pick(OPTIONS.hat)[0];
  a.hatColor = pick(CLOTH_COLORS);
  a.coat = pick(OPTIONS.coat)[0];
  a.coatColor = pick(CLOTH_COLORS);
  a.shirtColor = pick(CLOTH_COLORS);
  a.pantsColor = pick(CLOTH_COLORS);
  a.eyepatch = r() < 0.2 ? pick(OPTIONS.eyepatch)[0] : 'yok';
  a.earring = r() < 0.4 ? 'altin' : 'yok';
  a.necklace = r() < 0.3 ? pick(OPTIONS.necklace)[0] : 'yok';
  return a;
}
