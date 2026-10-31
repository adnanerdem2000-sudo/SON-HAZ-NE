# 7. Animasyon Listesi (uygulanan)

Oyuncu, NPC'ler, haydutlar, iskeletler ve hayaletler KayKit **Rig_Medium** ortak iskeletini paylaşır; klipler tek bir
animasyon dosyasından (`assets/models/kk/kk_anims.glb`) yüklenir ve oyun içi adlarla eşlenir (`js/core/kk.js` → `ANIM_MAP`,
**89 giriş**).

## 7.1 Katmanlar ve geçişler
- **Alt/üst gövde katmanları:** yürürken üst gövde ayrı klip oynatır (nişan, dolum, blok, saldırı); klipler kemik
  adlarına göre ikiye bölünür.
- **Geçiş:** çapraz geçiş (crossfade) ve "taban değiştirme" ile kesintisiz; tek seferlik klipler bitince otomatik kapanır.
- **Hareket bağlamı:** ivmeye göre yürü/koş/sprint, yan adım ve geri yürüme, iniş sertliğine göre iniş klibi.
- **Ragdoll:** ölümde ya da ağır darbede iskelet üzerinde Verlet tabanlı ragdoll; ayağa kalkış (getup) klibiyle geri dönüş.
- **IK:** analitik iki kemikli IK (ayak/el yerleştirme için), vuruş anında kısa duraksama (hit-stop).
- **Prosedürel pozlar:** yüzme, dalış, tırmanma, kürek çekme, kazma, dümen tutma.

## 7.2 Hayvan ve canavar klipleri
| Model | Klipler |
|---|---|
| Kurt, tilki (Quaternius) | Attack, Death, Eating, Gallop, Gallop_Jump, Idle, Idle_2, Idle_2_HeadLow, Idle_HitReact_Left/Right, Jump_ToIdle, Walk |
| Geyik, erkek geyik | Attack_Headbutt, Attack_Kick, Death, Eating, Gallop, Gallop_Jump, Idle, Idle_2, Idle_Headlow, Idle_HitReact_Left/Right, Jump_toIdle, Walk |
| Kar canavarı (yeti) | Death, Duck, HitReact, Idle, Jump, Jump_Idle, Jump_Land, No, Punch, Run, Walk, Wave, Weapon, Yes |
| Yengeç / dev yengeç | Bite_Front, Bite_InPlace, Dance, Death, HitRecieve, Idle, Jump, No, Walk, Yes |
| Yarasa, kurbağa | Flying / Jump, Idle, Death |
| Prosedürel (domuz, maymun, timsah, papağan, yılan, kutup ayısı) | Bacak/kuyruk/çene/kanat salınımları; kutup ayısında diz bükülmeli yürüyüş |
| Balina, orka, yunus | Köşe gölgelendiricide dikey kuyruk dalgası + göğüs yüzgeci çırpışı; dalış, kuyruk kaldırma, sıçrama, casusluk (spyhop) gövde pozları |
| Bosslar | Kraken dokunaçları (prosedürel), Taş Muhafız/Volkanik Dev (Quaternius dev rig: Punch, Weapon, Jump, Death, HitReact…) |

## 7.3 KayKit klip eşlemesi
### Temel hareket (18)
| Oyun adı | KayKit klibi |
|---|---|
| `Idle` | Idle |
| `IdleB` | Idle_B |
| `IdleCombat` | Idle_Combat |
| `Idle_Sword` | Blocking |
| `Idle_Gun` | Idle |
| `Idle_Gun_Pointing` | 1H_Ranged_Aiming |
| `Idle2H` | 2H_Melee_Idle |
| `Unarmed` | Unarmed_Idle |
| `Walk` | Walking_A |
| `WalkB` | Walking_B |
| `WalkC` | Walking_C |
| `WalkBack` | Walking_Backwards |
| `WalkSk` | Walking_D_Skeletons |
| `Run` | Running_A |
| `RunB` | Running_B |
| `Sprint` | Running_C |
| `StrafeL` | Running_Strafe_Left |
| `StrafeR` | Running_Strafe_Right |

### Zıplama/düşme (7)
| Oyun adı | KayKit klibi |
|---|---|
| `Jump` | Jump_Idle |
| `JumpStart` | Jump_Start |
| `JumpLong` | Jump_Full_Long |
| `JumpShort` | Jump_Full_Short |
| `Jump_Idle` | Jump_Idle |
| `Jump_Land` | Jump_Land |
| `Roll` | Dodge_Forward |

### Yakın dövüş (19)
| Oyun adı | KayKit klibi |
|---|---|
| `Sword` | 1H_Melee_Attack_Chop |
| `Sword_Slash` | 1H_Melee_Attack_Slice_Diagonal |
| `Atk1` | 1H_Melee_Attack_Slice_Diagonal |
| `Atk2` | 1H_Melee_Attack_Slice_Horizontal |
| `Atk3` | 1H_Melee_Attack_Chop |
| `AtkStab` | 1H_Melee_Attack_Stab |
| `AtkHeavy` | 1H_Melee_Attack_Jump_Chop |
| `Counter` | Block_Attack |
| `Atk2H` | 2H_Melee_Attack_Slice |
| `Heavy2H` | 2H_Melee_Attack_Chop |
| `Spin2H` | 2H_Melee_Attack_Spin |
| `Stab2H` | 2H_Melee_Attack_Stab |
| `DualChop` | Dualwield_Melee_Attack_Chop |
| `DualSlice` | Dualwield_Melee_Attack_Slice |
| `DualStab` | Dualwield_Melee_Attack_Stab |
| `Punch` | Unarmed_Melee_Attack_Punch_A |
| `Punch_Right` | Unarmed_Melee_Attack_Punch_A |
| `Punch2` | Unarmed_Melee_Attack_Punch_B |
| `Kick` | Unarmed_Melee_Attack_Kick |

### Savunma (7)
| Oyun adı | KayKit klibi |
|---|---|
| `Block` | Blocking |
| `BlockHit` | Block_Hit |
| `Parry` | Block |
| `Dodge_F` | Dodge_Forward |
| `Dodge_B` | Dodge_Backward |
| `Dodge_L` | Dodge_Left |
| `Dodge_R` | Dodge_Right |

### Menzilli/büyü (11)
| Oyun adı | KayKit klibi |
|---|---|
| `Aim` | 1H_Ranged_Aiming |
| `Gun_Shoot` | 1H_Ranged_Shoot |
| `Reload` | 1H_Ranged_Reload |
| `Aim2H` | 2H_Ranged_Aiming |
| `Shoot2H` | 2H_Ranged_Shoot |
| `Reload2H` | 2H_Ranged_Reload |
| `Throw` | Throw |
| `Cast` | Spellcast_Shoot |
| `CastLong` | Spellcast_Long |
| `CastRaise` | Spellcast_Raise |
| `Summon` | Spellcast_Summon |

### Tepki/ölüm (10)
| Oyun adı | KayKit klibi |
|---|---|
| `HitRecieve` | Hit_A |
| `HitRecieve_2` | Hit_B |
| `HitReact` | Hit_A |
| `Death` | Death_A |
| `Death2` | Death_B |
| `DeathSk` | Death_C_Skeletons |
| `Resurrect` | Death_C_Skeletons_Resurrect |
| `Awaken` | Skeletons_Awaken_Floor |
| `AwakenStand` | Skeletons_Awaken_Standing |
| `SpawnGround` | Spawn_Ground_Skeletons |

### Etkileşim/sosyal (17)
| Oyun adı | KayKit klibi |
|---|---|
| `Interact` | Interact |
| `PickUp` | PickUp |
| `UseItem` | Use_Item |
| `Wave` | Cheer |
| `Cheer` | Cheer |
| `Taunt` | Taunt |
| `Yes` | Cheer |
| `No` | Hit_B |
| `SitDown` | Sit_Chair_Down |
| `Sit` | Sit_Chair_Idle |
| `SitUp` | Sit_Chair_StandUp |
| `SitFloorDown` | Sit_Floor_Down |
| `SitFloor` | Sit_Floor_Idle |
| `SitFloorUp` | Sit_Floor_StandUp |
| `LieDown` | Lie_Down |
| `Lie` | Lie_Idle |
| `LieUp` | Lie_StandUp |
