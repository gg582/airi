# VRM & PMX Model Expression Classifier Audit Report

Generated on: `2026-08-31T01:11:46.119Z`
Dataset: `/Volumes/airi-backup-share/assets/models/manifest.json`

## 1. Executive Summary

| Metric | Count | Percentage |
|---|---|---|
| **Target Models Analyzed** (VRM + PMX) | **907** | 100% |
| - Models with expressions in `manifest.json` | 68 | 7.5% |
| - Models recovered via direct `.bin` GLB parsing | 813 | 89.6% |
| - Models with **0 expressions** (Empty / Missing) | 26 | 2.9% |
| **Total Expression Instances Extracted** | **33151** | 100% |
| **Filtered Noise** (ARKit + Visemes + Blinks + Neutral) | **22650** | **68.3%** |
| **Classified Emotes / Facial Expressions** | **8798** | **26.5%** |
| **Wardrobe / Mesh Toggles** | **1536** | **4.6%** |
| **Unclassified Leakage Remainder** | **167** | **0.5%** |

---

## 2. Category Distribution Breakdown

| Category | Instance Count | % of Total | Description |
|---|---|---|---|
| 🟢 **Emote (Signal)** | 8798 | 26.5% | High-value emotional and expressive facial morphs |
| 🛡️ **ARKit 52 Primitives** | 8261 | 24.9% | Low-level Apple FACS motion-capture blendshapes |
| 👄 **Visemes & Phonemes** | 4674 | 14.1% | Standard speech mouth shapes (A/I/U/E/O, Oculus visemes) |
| 👁️ **Procedural Eye/Blinks/Bones** | 7481 | 22.6% | LookAt / Blink channels, jaw/teeth and sub-rig morphs |
| ⚪ **Neutral / Rest / Index** | 2234 | 6.7% | Base neutral poses and raw numeric indices |
| 👗 **Wardrobe / Toggles** | 1536 | 4.6% | Props, clothes, hair, glasses mesh toggles |
| 🔍 **Unclassified Leakage** | 167 | 0.5% | Expressions requiring manual inspection & classifier rule refinement |

---

## 3. Data Gaps: Models with 0 Expressions (26 Total)

The following 26 models had no extractable blendshapes in manifest or binary:

| Model ID | Model Name | Format | Reason |
|---|---|---|---|
| `display-model-xhht753R4M_fGwMvgPnTy` | Elizabeth by Caesar - 260155815737035898.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-UmuSw_ADujOAo1VShVp6D` | sailor_uniform_wo_glasses.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-fOXxatLNf7zkI1wCnodQa` | shinobu_white_dress_sunhat.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-uwynwcrNpQE7Q4dhrFFGK` | shinobu_blackdress.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-G33G-EBc6yAIW9jLSdR6M` | 6620706177430633408.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-Pgfm5ZIMz-q51WOUXV9Yn` | 8875923121260254283.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-PtvSA0t5H6gLJvwNRS2sN` | Jane Doe by AdanJD - 6229829988037337224.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-_-6pKLRebBcnHJHwkkIIL` | 3845540875186246300.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-hFVjl6tnjTfdUpKTFmNbh` | Nicole Demara (Zenless zone zero) by AdanJD - 4436167541922528111.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-gM-YNAwDfqdcMuzRJQUJ0` | Nozomi01 by nuu - 252070000030905835.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-nFrpXttuhTJL563qIsoBP` | Sangonomiya Kokomi by raidenshougun - 7640264508715737329.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-nlI9QqS7z1nv4LRWh6yke` | roomwere_full by suya - 4700715553410510943.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-poL_k6xmy3P9m9_AUARyA` | a by a - 9087681681928388609.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-9ue8KOQB6eYj9_XKtQGdN` | ネゲヴ by ジンゴ - 7804480850860116.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-zPRnZ_GtOPrtpQx_lbHqL` | Lilium_VRM by HImura Yuya - 4370315994636104692.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-4L7ccnl1vAo0DTcE40YOT` | R18 Seed Bikini Naked Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-60sJ4-cLsOHGyv7fZAb6v` | R18 Jufufu Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-EjXgmaSpRTSf0iK3O-Co5` | R18 Luciana Bikini Naked.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-PwWFEhBlQkq607MEjLw3o` | R18 Luciana Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-W8mZKy2PHlW6N_Dv1mb5E` | R18 Jufufu Bikini Naked Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-bs8eZUqzMY1RQqtY6Vqha` | R18 Hysilens Level 4 (R18 Hysilens Level 4 PMX,VRM by MikelX3D).vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-ecH4LiMtaazM7hAR86ZUD` | R18 Cerydra Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-ksBrIkfvOCtK6oZvak0Dl` | R18 Cerydra Bikini Naked Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-oetmq9cSeHEGfaZAL25Va` | R18 Hysilens Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-twXbCM6WS5p59TK6CDYHZ` | R18 Seed Level 4 by MikelX3D.vrm | `vrm` | Binary exists but contains 0 blendshapes |
| `display-model-wAdFd9jwo_Tfb6AIFjLEG` | R18 Hysilens Bikini Naked Level 4.vrm | `vrm` | Binary exists but contains 0 blendshapes |


---

## 4. Top 50 High-Signal Emotes Found

| Frequency | Expression Key | Sample Category Interpretation |
|---|---|---|
| 808x | `Joy` | Emote |
| 801x | `Angry` | Emote |
| 800x | `Sorrow` | Emote |
| 792x | `Fun` | Emote |
| 468x | `Surprised` | Emote |
| 95x | `surprised` | Emote |
| 70x | `生意気` | Emote |
| 70x | `ドヤ顔` | Emote |
| 70x | `ドヤ顔2` | Emote |
| 69x | `じと目` | Emote |
| 68x | `生意気2` | Emote |
| 66x | `白目` | Emote |
| 66x | `恥じらい` | Emote |
| 65x | `うるうる` | Emote |
| 65x | `死んだ目` | Emote |
| 65x | `あせり` | Emote |
| 65x | `恐れ` | Emote |
| 63x | `怒りマーク` | Emote |
| 62x | `-_-` | Emote |
| 57x | `hehe` | Emote |
| 53x | `chill` | Emote |
| 52x | `XP` | Emote |
| 51x | `hah` | Emote |
| 51x | `hehe2` | Emote |
| 51x | `Confused` | Emote |
| 51x | `Tongue` | Emote |
| 51x | `XP1` | Emote |
| 50x | `hah2` | Emote |
| 50x | `XP2` | Emote |
| 50x | `XP3` | Emote |
| 47x | `hmpf` | Emote |
| 46x | `Surprised2` | Emote |
| 45x | `angry` | Emote |
| 45x | `sorrow` | Emote |
| 44x | `joy` | Emote |
| 40x | `fun` | Emote |
| 36x | `tongue-out` | Emote |
| 29x | `Smile` | Emote |
| 28x | `X` | Emote |
| 25x | `Blush` | Emote |
| 24x | `Fcl_BRW_Fun` | Emote |
| 24x | `Fcl_BRW_Joy` | Emote |
| 24x | `Fcl_BRW_Sorrow` | Emote |
| 24x | `Fcl_EYE_Angry` | Emote |
| 22x | `Fcl_BRW_Angry` | Emote |
| 22x | `Fcl_BRW_Surprised` | Emote |
| 22x | `Fcl_EYE_Fun` | Emote |
| 22x | `Fcl_EYE_Joy` | Emote |
| 22x | `Fcl_EYE_Joy_L` | Emote |
| 22x | `Fcl_EYE_Joy_R` | Emote |

---

## 5. Unclassified Leakage Registry (165 Unique Keys, 167 Total Instances)

Dense list written to: `docs/reports/unclassified-keys.txt`

| Frequency | Unclassified Key | Sample Models |
|---|---|---|
| 2x | `woow` | *Evernight by Original model provided by miHoYo. - 7352930988217671155.vrm*, *Iuno by Авторские права на модель принадлежат правообладателю игры «鸣潮 (Wuthering Waves)». - 3807764001981467959.vrm* |
| 2x | `＞＿＜` | *TERUFY_CozyPuff_VRM by - - 5508453223895565661.vrm*, *KYONYUTEU_VRM by - - 6737979451101481349.vrm* |
| 1x | `INA-new2_INA-ver2_clown` | *INA-KIMONO.vrm* |
| 1x | `31.□２` | *Ellen Joe by Original model provided by miHoYo. - 8055477510520626817.vrm* |
| 1x | `XI` | *Cielle by Авторские права на модель принадлежат Day1 Studio - 8877858225508098733.vrm* |
| 1x | `オフセットショルダーset` | *BINACO2.0 dolfin by DOLOS - 2864925740792971202.vrm* |
| 1x | `上三角嘴` | *tony 小慕 by 空猫 Nilcat - 7554416228018682101.vrm* |
| 1x | `方形嘴` | *tony 小慕 by 空猫 Nilcat - 7554416228018682101.vrm* |
| 1x | `Blank Face` | *Tsukimiya Neneko by NOXXma - 1160656039975456746.vrm* |
| 1x | `DeadEyes` | *Tsukimiya Neneko by NOXXma - 1160656039975456746.vrm* |
| 1x | `- -` | *Pecorine by PCR - 3754091772587383046.vrm* |
| 1x | `MTH_Sankaku` | *ももんが by クリシェ - 3985998164359090446.vrm* |
| 1x | `MTH_Maru` | *ももんが by クリシェ - 3985998164359090446.vrm* |
| 1x | `Shiitake` | *ももんが by クリシェ - 3985998164359090446.vrm* |
| 1x | `earsback` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `-_-a` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `eee` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `AAA` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `OOO` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsroll` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsside` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsfront` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsdown` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsup` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earstanosi` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsupn` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsikari` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsbiku` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsbikun` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsyure` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earskanasi` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `earsbase` | *Tamamo Cross by Assets - Cygames - 686880670649588099.vrm* |
| 1x | `oa` | *Charlotte by Model by SenDieMMD. - 6448623457941774970.vrm* |
| 1x | `sheep` | *Charlotte by Model by SenDieMMD. - 6448623457941774970.vrm* |
| 1x | `眼泪汪汪` | *洋葱圈 by 猫御daze - 6501497366182876717.vrm* |
| 1x | `Correction01` | *CunnyKarin by Nutchakrit - 8973624661394299922.vrm* |
| 1x | `Correction02` | *CunnyKarin by Nutchakrit - 8973624661394299922.vrm* |
| 1x | `-35prefab 6other MouthS` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-37prefab 6other Sareyes` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-40prefab 6other O O` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-42prefab 6other  -v-` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-43prefab 7other  o` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-44prefab 7other  o🔺` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-45prefab 7other carelessly` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-46prefab 7other  -S-` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `-47prefab 7other  white Eyes` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `SeraDefualt` | *MiyaSeraDress(Black) by namekuji1337 - 2512163744707425361.vrm* |
| 1x | `Slant` | *Lilith by NOFAL - 1099369737914350689.vrm* |
| 1x | `Calm` | *Lilith by NOFAL - 1099369737914350689.vrm* |
| 1x | `Hachu Eye` | *Lilith by NOFAL - 1099369737914350689.vrm* |
| 1x | `HorrorChild !` | *Lilith by NOFAL - 1099369737914350689.vrm* |
| 1x | `Oh1` | *Lilith by NOFAL - 1099369737914350689.vrm* |
| 1x | `Mouth Side Hydration` | *Lilith by NOFAL - 1099369737914350689.vrm* |
| 1x | `HeadbandL` | *小萌衣 こもえ Komoe by 空猫 Nilcat - 3832634725106865639.vrm* |
| 1x | `HeadbandR` | *小萌衣 こもえ Komoe by 空猫 Nilcat - 3832634725106865639.vrm* |
| 1x | `0.up` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `1.down` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `10.中` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `2.right` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `24.怪訝右` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `25.怪訝左` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `27.上L` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `28.上R` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `3.left` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `30.下L` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `31.下R` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `42.淫邪` | *null by KuroG - 1633529160853259778.vrm* |
| 1x | `电` | *忍喵 by 猫御daze - 5160570953980547926.vrm* |
| 1x | `恶魔化` | *忍喵 by 猫御daze - 5160570953980547926.vrm* |
| 1x | `Pero` | *御庭みに3 by みに - 7163521991242775333.vrm* |
| 1x | `Grgr` | *御庭みに3 by みに - 7163521991242775333.vrm* |
| 1x | `钱多多` | *占卜师 by 阿潼 - 2296544354772553213.vrm* |
| 1x | `猫咪特效` | *占卜师 by 阿潼 - 2296544354772553213.vrm* |
| 1x | `猫爪` | *占卜师 by 阿潼 - 2296544354772553213.vrm* |
| 1x | `Lamp` | *【DE】Seiya by 空猫 Nilcat - 7796259520545305336.vrm* |
| 1x | `口罩` | *地雷1 by 猫御daze - 6069377206484941928.vrm* |
| 1x | `AA2` | *Daitaku Helios by Original model provided by Cygames. - 668239230050825136.vrm* |
| 1x | `LampOnly` | *【DE】Seiya by 空猫 Nilcat - 4496303805434295644.vrm* |
| 1x | `睡觉眼` | *小只芋 Satoimo by 空猫 Nilcat - 4643458454827372991.vrm* |
| 1x | `三角嘴` | *小只芋 Satoimo by 空猫 Nilcat - 4643458454827372991.vrm* |
| 1x | `咧嘴笑` | *小只芋 Satoimo by 空猫 Nilcat - 4643458454827372991.vrm* |
| 1x | `换泳衣` | *小只芋 Satoimo by 空猫 Nilcat - 4643458454827372991.vrm* |
| 1x | `EXT01` | *LuMiE by miso - 2197791325649251194.vrm* |
| 1x | `-face black` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `-face red` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `-pupil s` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `-highlightoff1` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `-highlightoff2` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `-white eyes` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- -_-` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- anxious` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- mesugaki1` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- mesugaki2` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `-complacent` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- oo` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- ？` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- Beaneye` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- drunk` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- cachinnation` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |
| 1x | `- titter` | *Seth Vrm 1.0.0 by namekuji1337 - 5338426900665460105.vrm* |

*... and 65 more unique unclassified keys.*
