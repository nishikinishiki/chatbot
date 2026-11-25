# tob_test/salesforce

既存の `tob/salesforce` は変更せず、独立したディレクトリで実装しています。

## フォルダ複製によるフォーム運用

1. `tob_test/salesforce/` をフォルダごと複製し、複製先のディレクトリ名を変更します。
2. **複製先の `question.js` のみ**編集し、見出し・質問・選択肢・各画面の文言や画像・リンクを変更します。
3. 複製先のURLを開き、表示とGASの受信結果を検証します。

`index.html` は表示枠のみのテンプレートです。ユーザーに表示する見出し・案内文・設問・CTA・エラー文などを直接記述していません。これらは `question.js` から `app.js` が描画します。

### question.js 内の設定

| 設定 | 管理項目 |
| --- | --- |
| `page` | ページタイトル、description、画像URL、画像alt、favicon |
| `copy.accessibility` | エリア・ステップのアクセシビリティ用名称 |
| `copy.branding` | ブランド表記、右上の「無料個別相談」 |
| `copy.lead` | 初期画面の見出し、導入文 |
| `copy.privacy` | 個人情報取扱いの案内文とリンク |
| `copy.appointment` | 面談希望日時画面の見出し、説明、CTA |
| `copy.completion` | 完了画面の見出し、説明、リンク、やり直しボタン |
| `copy.footer` | コピーライト、問い合わせ電話番号 |
| `copy.common`, `copy.calendar`, `copy.errors` | 必須ラベル、ナビゲーション、カレンダー、エラー文 |
| `steps` | 各ステップの名称、質問、選択肢、表示文言、CTA |
| `appointments`, `timeSlots` | 第1・第2希望の見出し・注意文・時間帯 |

### 注意：GASとGTM

- フォルダを複製しても、現状では同じGAS URLへ送信されます。送信先を変更するときは `app.js` 側のURLも確認してください。
- GTMコンテナ `GTM-TCL9ZH6` はHTMLで読み込みます。複製したURLごとの区別には `form_variant`（ページパス）を使っています。
- GASの入力キーや選択肢の `value` はサーバー側と整合させてください。表示用の `label` は自由に調整できます。
- 第1送信は氏名・電話番号・メール・年収・年齢等、第2送信は希望日時と `isAdditionalData: true` です。同じ `Session ID` で追送信します。
- 送信は従来の `fetch(mode:'no-cors')` 方式です。ブラウザでの送信処理完了はGAS側の保存成功を保証しません。受信先で確認してください。

## 現在の画面構成

- PC：左65%画像、右35%フォーム。スマートフォンは縦並び。
- ステップ1：基本情報、ステップ2：年収・年齢。横スライド移動。
- ステップ2：チェックボックスなしの個人情報取扱い案内と「同意して送信」。
- 続いて、日付×時間帯の表から第1・第2希望日時を選択。
- デザイン・余白・GAS・GTMの送信方式は維持。

## CSSの編集方法（style.css）

CSSをメンテナンスしやすいよう、**1つの `style.css` にデザイントークンと用途別スタイルを整理**しています。HTML・JavaScriptの参照先は変更していません。複製するときもCSSをそのままコピーできます。

### よく変更する値は先頭の :root

| 変更する内容 | 編集する変数 |
| --- | --- |
| ボタン、選択状態などのメインカラー | `--color-primary` |
| 見出し文字の色 | `--color-heading` |
| 背景の淡いグリーン | `--color-primary-soft` |
| 本文・補助テキスト・枠線 | `--color-text` / `--color-muted` / `--color-border` |
| 左側画像・右側フォームの幅 | `--layout-visual-width` / `--layout-form-width` |
| やや狭いPC（901〜1130px）の左右比率 | `--layout-visual-medium` / `--layout-form-medium` |
| 右側のフォーム最大幅 | `--layout-form-max` |
| 入力欄・選択ボタン・CTAの高さ | `--input-min-height` / `--choice-min-height` / `--button-min-height` |
| 角丸 | `--radius-input` / `--radius-button` |
| ステップのスライド距離・時間 | `--slide-distance` / `--slide-duration` |

例えば、左側を70％・右側を30％にしたい場合は `:root` の以下の2行を変更します。

```css
--layout-visual-width: 70%;
--layout-form-width: 30%;
```

### CSSの見出しと階層

1. BASE：共通リセット・本文
2. LAYOUT：2カラム・画像とフォーム
3. HEADERS：ロゴ・見出し
4. STEPS：ステップの進捗表示
5. FORM：入力欄・選択肢・スライドアニメーション
6. MESSAGES：個人情報の案内・エラー
7. ACTIONS：CTA・完了画面
8. FOOTER：フッター
9. APPOINTMENT：日付×時間帯の選択表
10. RESPONSIVE：画面幅ごとの上書き・動きを減らす設定

**画面幅の区切り（1130px・900px・520px）** はCSS仕様上 `:root` の変数を `@media` の条件に利用できないため、末尾のRESPONSIVE内で管理しています。

なお、`question.js` は表示文言・設問の変更、`style.css` はデザインの変更に使います。通常の取引先別フォームの複製では、`question.js` だけを変更する運用で問題ありません。

## ファイル

- `index.html`：文言を持たない汎用表示テンプレート
- `question.js`：画面文言・質問・選択肢・画像URL・リンクの設定
- `app.js`：画面生成、検証、ステップ遷移、送信処理
- `style.css`：レイアウト・アニメーション
