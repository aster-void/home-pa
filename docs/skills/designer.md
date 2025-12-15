# Designer Role

HomePA のデザイン作業ガイド。

## 技術スタック

- **Tailwind CSS v4** + **DaisyUI**
- モバイルファースト（768px ブレークポイント）

---

## 1. デザイン原則（一般論・抽象）

- **Content-first**: デザインは可読性に奉仕し、主張しない
- **Restraint builds trust**: 装飾が少ない = プロフェッショナルに見える
- **Progressive disclosure**: 情報密度を段階的に開示
- **Motion serves clarity**: アニメーションは装飾ではなく明確化のため
- **Consistency over creativity**: 一貫したパターンで「考えずに使える」体験
- **Intentionality > intensity**: 方向性を決めて精密に実行

---

## 2. デザインインスピレーション（アプリケーション固有・抽象）

### コンセプト: 「静かな知性」

ユーザー向けパーソナルアシスタント。次にやることを「考えさせない」提案。

### トーン

- **Calm & Intelligent**: 騒がしくない、でも頼れる
- **「禅」的ミニマリズム**: 余白を恐れない、引き算の美学
- **Warm Neutrality**: 冷たすぎないニュートラル、コーラル系アクセント

---

## 3. チェックリスト

UI 作業時、上から順に確認:

(コアデザイン時)

1. [ ] **Purpose**: 何を解決する？誰が使う？
2. [ ] **Tone**: 「静かな知性」に合っているか？
3. [ ] **NEVER**: 以下を避けているか？
   - Generic fonts (Inter, Roboto, Arial そのまま)
   - AI感光沢
   - ダッシュボード的情報過多
   - ゲーミフィケーション的過剰演出
     (以下実装)
4. [ ] **Tailwind/DaisyUI** ユーティリティを優先使用
5. [ ] **タッチターゲット** 44px 以上
6. [ ] **コントラスト比** 4.5:1 以上
7. [ ] **フォーカス状態** が視認可能
       (以下アクセシビリティ)
8. [ ] **モバイル**: bottom nav (80px) + safe-area 考慮
9. [ ] **ポップアップ**: モバイル=ボトムシート、デスクトップ=中央モーダル
10. [ ] **トランジション** 200-300ms, ease-out
11. [ ] **モーダル**: Escape / backdrop クリックで閉じる
12. [ ] **prefers-reduced-motion** 対応

---

## 4. デザイン言語（固有・具体）

アプリケーション共通のデザインは `app.css` で DaisyUI を上書きする。

### Aesthetics (ミニマリスト向け)

- **Typography**: 軽い印象。太字より font-normal。明確な階層。
- **Color**: CSS変数で一貫性。支配色 + シャープなアクセント。
- **Motion**: 高インパクトな瞬間に集中。ページロード、ホバー。控えめに。
- **Spatial**: 余白を贅沢に。密度より呼吸。
- **Background**: シンプル。必要なら微細なテクスチャ程度。

### カラーシステム

**コンセプト**: 機能的で拡張可能な3色コアシステム。装飾的な色は含まない。

#### 1. Core Brand / Interaction Colors (3)

**Primary — Neptune**

- HEX: `#7BBEBB`
- 用途: 選択状態、今日のインジケーター、プライマリボタン、フォーカスリング
- Derived shades:
  - Primary 100: `#E6F3F2` — 選択背景
  - Primary 400: `#9ED1CF` — hover
  - Primary 600: `#7BBEBB` — default
  - Primary 800: `#4E8F8C` — active/pressed

**Soft Surface / Tint — Surf Crest**

- HEX: `#CEE3D3`
- 用途: ホバー行、範囲プレビュー、セカンダリパネル、ソフト強調ブロック
- Derived shades:
  - Surface 50: `#F4FAF6` — subtle background
  - Surface 100: `#CEE3D3` — default tint
  - Surface 200: `#B6D6C1` — stronger highlight
- この色は頻繁に、しかし控えめに使用

**Semantic Positive — Jungle Green**

- HEX: `#2AB388`
- 用途: 可用性、確認状態、成功フィードバック、ポジティブバッジ
- Derived shades:
  - Success 100: `#E6F7F1`
  - Success 500: `#2AB388`
  - Success 700: `#1E8A69`
- 稀に、意図的に使用

#### 2. Neutral System (必須、ブランド色ではない)

**Backgrounds**

- App background: `#FFFFFF`
- Surface (cards/panels): `#F6F7F8`
- Calendar grid: `#FAFAFA`

**Text**

- Primary text: `#1F2937`
- Secondary text: `#6B7280`
- Muted/disabled: `#9CA3AF`

**Borders / Dividers**

- Default border: `#E5E7EB`
- Strong divider: `#D1D5DB`

⚠️ ニュートラルをブランド色で置き換えない

#### 3. Required Semantic Colors (最小限)

**Error / Conflict**

- Error 500: `#DC2626`
- Error 100: `#FEE2E2`
- 用途: イベントの競合、バリデーションエラー、失敗アクション

**Warning (オプション)**

- Warning 500: `#F59E0B`
- Warning 100: `#FEF3C7`
- 用途: 締切接近、時間制約、非クリティカルアラート

#### 4. Interaction States (クロスプラットフォーム)

- **Hover**: +8–12% brightness または Primary 400
- **Active**: Primary 800
- **Focus**: 2px outline in Primary 600 at 60% opacity
- **Disabled**: Neutral text + 40% opacity、色での意味付けなし

新しい色を状態のために導入しない。

#### 5. Event Colors (明示的に分離されたシステム)

イベント色はカテゴリー分類用で、コアの一部ではない。

**ルール**:

- ユーザーがカスタマイズ可能
- UI クロームより高い彩度
- 以下を再利用しない: Neptune、Surf Crest、Jungle Green
- UI はイベント色なしで読みやすくあるべき

#### 6. 総在庫

- **Core (3)**: Neptune、Surf Crest、Jungle Green
- **Neutrals (7)**: Background、Surface、Grid、Primary text、Secondary text、Disabled text、Borders
- **Semantic (2–3)**: Error、Warning (optional)、Success (already Jungle Green)

**総機能色数**: 制御され、スケーラブルで、レビュー可能

#### 強制ルール (重要)

すべての色は「これはどの状態や意味を伝えるか？」という質問に答えられなければならない。
答えられない場合、それはシステムに属さない。

### Z-Index

| レイヤー          | 値   |
| ----------------- | ---- |
| Modals/Popups     | 2100 |
| Bottom Navigation | 2000 |
| Suggestion Card   | 1000 |
| Settings Panel    | 500  |

### コンポーネントパターン

**カード**

```
bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm
```

**プライマリボタン**

```
btn bg-[#F08A77] hover:bg-[#E87862] text-white border-none
```

**セカンダリボタン**

```
btn btn-ghost border border-base-300
```

**入力フィールド**

```
input input-bordered w-full
```

**モーダル backdrop**

```
fixed inset-0 bg-black/40 backdrop-blur-sm
```

### タイポグラフィ

#### フォントファミリー

- **Primary**: Source Code JP (本文コンテンツ)
- **UI/Monospace**: Source Code JP (UI コンポーネント、ラベル、メタデータ)
- **Fallback**: Inter
- **制限**: 2-3 フォントファミリーまで

#### フォントウェイト

| Weight   | Value | Usage                          |
| -------- | ----- | ------------------------------ |
| Light    | 100   | ディスプレイテキスト、大見出し |
| Normal   | 400   | 本文、デフォルト、説明文       |
| Medium   | 500   | 見出し、強調コンテンツ         |
| Semibold | 600   | 強い強調、時刻表示             |

#### フォントサイズスケール

| Size    | Line Height | Usage                        |
| ------- | ----------- | ---------------------------- |
| 10-12px | +3px        | 小ラベル、キャプション、タグ |
| 13-14px | +4px        | 本文、説明、サブタイトル     |
| 16-18px | +4-5px      | 見出し、セクションタイトル   |
| 20-24px | +6px        | ページタイトル、大見出し     |
| 32px    | +8px        | ディスプレイ数値、特大表示   |

**ルール:**

- 最小サイズ: 12px (可読性のため)
- Line height は font size とマッチさせる (tight layout 用)
- Letter spacing: `-0.04em` (メタデータ), `0.08em` (大文字ラベル)

#### テキストアライメント

- **Left**: デフォルト (ほとんどのコンテンツ)
- **Center**: 日付表示、数値、中央寄せヘッドライン
- **Right**: タイムスタンプ、期日、メタデータ

#### タイポグラフィルール

- `display: flex; align-items: center` で縦方向の一貫性を保つ
- 見出しは太字よりも `font-normal` を優先（軽い印象）
- 階層は weight よりも size と spacing で作る
- `text-transform: uppercase` は `letter-spacing: 0.08em` と組み合わせる

### スペーシング

#### ベースユニット

- **Base**: 8px (すべてのスペーシングは 8px の倍数)
- **Fine adjustment**: 2px (微調整用)

#### スペーシングスケール

| Value   | Usage                                        |
| ------- | -------------------------------------------- |
| 4-6px   | タイトな spacing、アイコン padding、タグ内部 |
| 8-10px  | 標準コンテンツ gap、フォームフィールド       |
| 12-16px | セクション spacing、カードコンテンツ         |
| 18-24px | カード padding、主要セクション               |
| 32-48px | 大きなマージン、レイアウト gap               |

#### パディングパターン

| Pattern       | Value       | Usage                          |
| ------------- | ----------- | ------------------------------ |
| Card Standard | `16px 24px` | 標準カードコンテンツ           |
| Card Large    | `24px`      | ヒーローカード、特集コンテンツ |
| Card Hero     | `48px 24px` | 大きなトップ padding           |
| Tag           | `6px 16px`  | タグ/バッジ内部                |

#### スペーシングルール

- **垂直リズム**: 見出しの上に 2× base unit、下に 1× base unit
- **Gap 一貫性**: コンポーネント内で一貫した gap 値 (8px, 12px, 16px)
- **余白**: 控えめな情報密度、余白を贅沢に使う
- **ネスト**: ネストされたコンポーネントでは spacing を減らす (16px → 8px → 6px)
- Tailwind の `space-*`, `p-*`, `m-*` を使用

### Border Radius

| Value | Usage                             |
| ----- | --------------------------------- |
| 4-6px | 小要素、インプット、角丸スクエア  |
| 8px   | ボタン、小カード                  |
| 12px  | 標準カード、コンテナ (デフォルト) |
| 24px  | 大カード、ヒーローカード          |
| 100px | ピル型タグ、完全な丸み            |

**ルール:**

- 標準カードは 12px、大/ヒーローカードは 24px
- 同類のコンポーネント間で一貫した corner radius
- 変数を使用、マジックナンバーを避ける

### レイアウトパターン

#### Flexbox パターン

```css
/* Column (垂直スタック) */
.stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

/* Row (水平スタック) */
.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

/* Centered */
.centered {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
}
```

#### カードコンテナ

```css
.card {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  gap: 10px;
  border-radius: 12px;
}
```

#### レイアウトルール

- **Flex direction**: スタックは `column`、水平レイアウトは `row`
- **Gap 一貫性**: 8px, 12px, 16px, 24px を使用
- **Alignment**: デフォルトは `flex-start`、中央寄せは `center`
- **Width**: 柔軟なレイアウトは `100%`、固定は 400-600px
- **ネスト構造**: 外側 16px、内側 8px のように段階的に減らす

### コンポーネントサイズ

#### アイコンサイズ

| Size    | Usage                      |
| ------- | -------------------------- |
| 12px    | 極小ヘッダーアイコン       |
| 16px    | 小、インラインメタデータ   |
| 24px    | 標準 UI 要素               |
| 36px    | 中、プロフィール写真       |
| 40-64px | 大、特徴的なビジュアル要素 |

#### タッチターゲット

- **最小高さ**: 44px (インタラクティブ要素)
- **適切な spacing**: タッチターゲット間 8px 以上

### ボトムナビゲーション

```css
--bottom-nav-height: 80px;
```

コンテンツの `padding-bottom`:

```
pb-[calc(80px+env(safe-area-inset-bottom))]
```

### レスポンシブ

#### ブレークポイント

| Breakpoint | Value   | Usage                          |
| ---------- | ------- | ------------------------------ |
| Mobile     | < 768px | ボトムシート、フル幅レイアウト |
| Desktop    | ≥ 768px | 中央モーダル、横並びレイアウト |

#### レスポンシブルール

- **モバイルファースト**: デフォルトスタイルはモバイル向け
- **Desktop 強化**: `@media (min-width: 768px)` でデスクトップ対応
- **カード幅**: 220-600px を目指す、狭いビューポートでラップ
- **Overflow**: 本文テキストは truncate より wrap を優先
