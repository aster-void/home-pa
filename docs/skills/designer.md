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

日本のユーザー向けパーソナルアシスタント。次にやることを「考えさせない」提案。

### トーン

- **Calm & Intelligent**: 騒がしくない、でも頼れる
- **「禅」的ミニマリズム**: 余白を恐れない、引き算の美学
- **Warm Neutrality**: 冷たすぎないニュートラル、コーラル系アクセント

### 参考イメージ

- Apple Calendar のクリーンさ
- Notion のタイポグラフィ階層
- 無印良品の「これでいい」感

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

### カラー

| 用途         | 値        | 備考                        |
| ------------ | --------- | --------------------------- |
| Accent       | `#F08A77` | Coral, プライマリアクション |
| Accent Hover | `#E87862` |                             |
| Today        | `#0066CC` | 今日のハイライト            |
| Event Blue   | `#4A9EFF` |                             |
| Event Orange | `#F7A700` |                             |
| Event Green  | `#99C66D` |                             |
| Success      | `#22C55E` |                             |
| Danger       | `#EF4444` |                             |

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

- 見出し: `text-lg font-normal`
- 本文: `text-base`
- キャプション: `text-sm text-base-content/60`
- 最小サイズ: 14px

### スペーシング

8px ベース。Tailwind の `space-*`, `p-*`, `m-*` を使用。

### ボトムナビゲーション

```css
--bottom-nav-height: 80px;
```

コンテンツの `padding-bottom`:

```
pb-[calc(80px+env(safe-area-inset-bottom))]
```
