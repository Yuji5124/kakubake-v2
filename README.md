# KAKUBAKE ver.2

青い箱型おもちゃの画面の中に、白いおばけが住んでいます。  
操作がなくても、一人でふわふわ浮いたり、のぞいたり、寝たりします。

---

## ブラウザで開く方法

### 方法 A：直接ファイルを開く

`index.html` をブラウザにドラッグ＆ドロップするだけで動きます。  
（一部ブラウザでは `file://` による画像ロードが制限される場合があります。その場合は方法 B を使用してください）

### 方法 B：ローカルサーバー経由（推奨）

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .
```

→ `http://localhost:8000` をブラウザで開く

### Raspberry Pi フルスクリーン

```bash
# サーバー起動
python3 -m http.server 8000 &

# Chromium キオスクモード
chromium-browser --kiosk --disable-infobars --disable-restore-session-state http://localhost:8000
```

---

## ファイル構成

```
kakubake-v2/
├── index.html       # アプリ本体
├── styles.css       # デザイン・CSSアニメーション（1280×720基準）
├── app.js           # 状態管理・タイマー・タッチ処理・micro-behavior
├── README.md        # このファイル
└── assets/
    ├── README.md    # 画像ファイル一覧・命名規則
    └── *.png        # ゴースト画像（省略可）
```

---

## 状態一覧

| 状態 | 説明 |
|------|------|
| `idle` | ふわふわ浮いて待機。時おり目線変化（micro-behavior） |
| `wander` | 画面内をそっと移動する。位置が変わる |
| `peeking` | 右端・左端・上・下からのぞく（半分以上が隠れた状態） |
| `hiding` | 端にほぼ隠れる。わずかな端だけ見える |
| `sleeping` | 寝ている。タッチしても60%無反応。最大4サイクル眠り続ける |
| `touched` | タッチ反応。バウンスして近づく。2秒後にidleへ戻る |
| `absent` | 画面から消える。3〜8秒後に静かに戻ってくる |

---

## 生活感を出す仕組み

### メインサイクル（6〜16秒ごと）
状態が自動的に切り替わります。idle と wander が最も多く（合計50%）、KAKUBAKEが「そこにいる」感じを維持します。

### 左右ドリフト（3〜8秒ごと）
idle または wander 中に、ゴーストが画面内をふわっと左右へ移動します。  
操作への反応ではなく、普段の生活動作として自然に位置が変わります。  
- idle 時：中央から最大 ±80px 移動
- wander 時：中央から最大 ±120px 移動（上下 ±38px も加わる）

移動量が大きいときは方向に合わせた画像（`ghost_move_right.png` など）に一時切り替わります。

### micro-behavior（7〜15秒ごと）
idle または wander 中に、別の画像を短時間表示してすぐ戻ります。  
画像の例：`ghost_look_right.png`（右を見る）、`ghost_idle_eyes_closed.png`（目を閉じる）  
状態は変化せず、見た目だけが一瞬変わります。

### sleeping（眠り）
眠りに入る際、まず眠そうな画像（`ghost_sleepy.png` など）を表示し、2.4秒後に深い睡眠画像（`ghost_sleep_zzz.png` など）に切り替わります。

---

## PNG を差し替える方法

**PNG がなくても動きます。** 画像ファイルがない場合は CSS で描いたゴーストが自動的に表示されます。  
**PNG を `assets/` に入れると、リロードするだけで自動的に PNG 表示に切り替わります。** CSS の変更は不要です。

PNG を用意したら次の手順で反映されます：

1. `assets/` フォルダに PNG ファイルを置く
2. ファイル名を `assets/README.md` に記載の名前に合わせる
3. ブラウザをリロードするだけ

**HTMLもCSSも変更不要です。**  
新しい画像を追加したい場合は `app.js` の `STATE_IMAGES` オブジェクトにファイル名を1行追加してください。

### 最初に作るべき PNG 5枚

| ファイル名 | 用途 |
|-----------|------|
| `ghost_idle_stand.png` | 最も頻繁に表示される基本表情 |
| `ghost_happy.png` | タッチ反応・micro-behavior 両方で使用 |
| `ghost_sleepy.png` | sleeping 入眠フェーズ |
| `ghost_sleep_zzz.png` | sleeping 深い睡眠 |
| `ghost_look_right.png` | micro-behavior の目線変化（生活感の核心） |

---

## 背景について

**背景はすべて CSS で描いています。** 外部画像・外部ライブラリは使いません。

| 要素 | 内容 |
|------|------|
| `body / html` | 夜の部屋のような濃紺グラデーション |
| `#app` | 中央が少し明るい放射状グラデーション |
| `#screen` 内部 | 暗い青〜紫のグラデーション ＋ `::before` 星（box-shadow）＋ `::after` グロウパッチ |

**PNG 画像は透明背景のまま使います。** PNG に背景を焼き込まないでください。

背景色を変えたい場合は `styles.css` 冒頭の `:root` の CSS 変数を調整してください：

```css
:root {
  --app-bg-center:  #1a2238;   /* アプリ背景の中心色 */
  --app-bg-edge:    #080810;   /* アプリ背景の外周色 */
  --screen-bg-top:  #07091a;   /* 画面上部の色 */
  --screen-bg-mid:  #0c1030;   /* 画面中間の色 */
  --screen-bg-deep: #060710;   /* 画面下部の色 */
  --screen-glow:    rgba(60, 90, 210, 0.14); /* 画面が本体を照らす環境光 */
}
```

---

## 画面サイズについて

設計基準は **1280×720 横長** です。  
Raspberry Pi Touch Display 2 を横向きで使用した場合の解像度に合わせています。  
ブラウザのズームを 100% にした状態で確認してください。

`html/body` はビューポート全体を濃紺背景で覆い、`#app`（1280×720）を中央に配置する構成です。  
1280×720 より大きな画面では、余白部分が濃紺で埋まるだけで内容は切れません。

---

## 対応環境

- **基準**：Raspberry Pi Touch Display 2 横向き（1280×720）+ Chromium
- **補助確認**：PC ブラウザ 1280×720 / それ以上のウィンドウサイズ
- Chrome / Chromium（最新版）
- Firefox
- タッチ操作・マウスクリック両対応
