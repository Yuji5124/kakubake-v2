# KAKUBAKE assets — 画像ファイル一覧

このフォルダに PNG 画像を置いてください。  
ファイルがない場合、CSS で描いたゴーストが代わりに表示されます（アプリは正常に動作します）。

画像のサイズ：**200×200px 〜 320×320px**、PNG透過推奨。  
背景透過の白〜青白いキャラクターが最も映えます。

---

## 状態別ファイル一覧

### idle（待機）
通常表示。ふわふわ浮いている状態。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_idle_stand.png` | 正面を向いて立っている |
| `ghost_float.png` | 少し浮いている |
| `ghost_idle_eyes_closed.png` | 目を閉じてのんびりしている |

### wander（移動中）
画面内をそっと移動している状態。idle と同じ画像でも可。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_move_right.png` | 右へ移動中 |
| `ghost_move_left.png` | 左へ移動中 |

### peeking（のぞく）
画面の端から顔だけ出している状態。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_peek_right_full.png` | 右からのぞく |
| `ghost_peek_right_surprised.png` | 右からびっくり顔でのぞく |
| `ghost_peek_shy_wave.png` | 恥ずかしそうに手を振る |
| `ghost_hide_top_peek.png` | 上からのぞく |
| `ghost_hide_right_edge_smile.png` | 右端から笑顔でのぞく |
| `ghost_hide_right_wink.png` | 右端からウィンク |

### hiding（隠れる）
端にほぼ隠れて、わずかな端だけ見えている状態。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_hide_bottom_peek.png` | 下端からちょっとだけ見える |
| `ghost_hide_left_bottom_peek.png` | 左下からのぞく |
| `ghost_hide_shy_pout.png` | 恥ずかしそうに隠れる |
| `ghost_hide_sleepy_curl.png` | 眠そうに丸まって隠れる |

### sleeping（睡眠）入眠フェーズ
眠りに入るときに最初に表示される画像（2.4秒後に深い睡眠画像に切替）。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_sleepy.png` | 眠そう |
| `ghost_drowsy.png` | うとうと |
| `ghost_yawn.png` | あくび |

### sleeping（睡眠）深い睡眠
しっかり寝ている状態。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_doze.png` | うたた寝 |
| `ghost_sleep_side.png` | 横になって寝ている |
| `ghost_sleep_zzz.png` | zzz... 熟睡 |
| `ghost_sleep_smile.png` | 寝顔でほほえみ |

### touched（タッチ反応）
タッチされた時だけ短時間表示。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_happy.png` | 喜んでいる |
| `ghost_pet_happy.png` | なでられて喜んでいる |
| `ghost_smile.png` | にっこり笑顔 |

### 起床（sleeping中のタッチで起きた時）

| ファイル名 | 説明 |
|-----------|------|
| `ghost_rub_eyes.png` | 目をこすっている |
| `ghost_still_sleepy.png` | まだ眠い |
| `ghost_wake_up.png` | 目覚め |

### micro-behavior（idle/wander中の一時的な目線変化）
状態を変えず、短時間だけ表示される。生活感を出すための画像。

| ファイル名 | 説明 |
|-----------|------|
| `ghost_look_right.png` | 右を見ている |
| `ghost_look_left.png` | 左を見ている |
| `ghost_idle_eyes_closed.png` | 目を閉じた（idleと共用） |
| `ghost_happy.png` | ふと笑顔（touchedと共用） |
| `ghost_smile.png` | にっこり（touchedと共用） |

---

## 画像追加の手順

1. `assets/` フォルダに PNG ファイルを置く
2. `app.js` の `STATE_IMAGES` オブジェクト内、対応する状態のリストにファイル名を追加
3. ブラウザをリロード

**HTML・CSS の変更は不要です。**

---

## 最初に作るべき PNG 5枚

まずこの5枚から始めてください。この5枚だけでアプリの主要な表情が揃います。

| 優先 | ファイル名 | 用途 |
|------|-----------|------|
| 1 | `ghost_idle_stand.png` | 最も頻繁に表示される基本表情 |
| 2 | `ghost_happy.png` | タッチ反応・micro-behavior 両方で使用 |
| 3 | `ghost_sleepy.png` | sleeping 入眠フェーズ（最初の2.4秒） |
| 4 | `ghost_sleep_zzz.png` | sleeping 深い睡眠 |
| 5 | `ghost_look_right.png` | micro-behavior の目線変化。生活感の核心 |

その後に追加すると効果的な画像：

- `ghost_float.png` — idle の浮遊バリエーション
- `ghost_peek_right_full.png` — のぞくポーズ
- `ghost_look_left.png` — 左向きの目線
- `ghost_idle_eyes_closed.png` — 目を閉じたのんびり顔
- `ghost_sleep_side.png` — 横向き睡眠
