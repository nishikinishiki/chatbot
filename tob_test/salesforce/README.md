# tob_test/salesforce

`tob/salesforce` の本番HTML/JS/CSSは変更せず、独立したディレクトリで実装しています。

## フロントエンド
- PCは左65%画像・右35%フォーム。左のみ独立スクロール。狭い画面では画像の下にフォーム。
- 画像: `/common/images/test.jpg`
- 申込フォーム上部の「Salesforce様限定」は `question.js` の `partnerName: "Salesforce"` から表示。取引先ごとにこの設定のみ変更すればラベルとページタイトルが切り替わります。
- 上部見出しは淡いグリーンのパネルにまとめ、余白・区切り線・進捗表示のレイアウトを最適化。
- 2ステップの横スライド式入力
  1. 氏名・電話番号・メールアドレス
  2. 年収・年齢
- 「個人情報のお取り扱いを確認し、同意します。」の文言とリンクは残し、チェックボックスだけを撤去。
- お名前・電話・メールはブラウザのオートコンプリートに対応。
- 質問・選択肢・日時テーブルのラベルや送信キーは `question.js` で一元管理。表示と送信処理は `app.js`。
- 面談希望日時は旧UIと同じ7日×時間帯の表（○で選択）。前後7日の切り替え、過去日時の無効化、第一・第二希望の選択、「その他」自由入力に対応。

## GAS連携
- `tob/salesforce/js/config.js` に設定されている既存のGAS WebアプリURLを使います。
- 第1送信: 年収・年齢・氏名・電話・メール・UTM・`Session ID` をJSON POST（`theme` と `investment` は送信しない）。
- 第2送信: `first_choice_date` / `first_choice_time` / `second_choice_date` / `second_choice_time`、必要なら `*_time_other`、同じ `Session ID`、`isAdditionalData: true` をPOST。
- 送信方式は本番コードと同じ `fetch(mode:'no-cors', method:'POST', Content-Type:'text/plain;charset=utf-8')`。
- 送信中の多重押下を抑止し、ブラウザが検出可能な通信エラー時は再送できるようにします。
- **重要：** `no-cors` の応答はopaqueなので、ブラウザだけではGASが受領・保存したかを確認できません。送信完了UIとGTM送信イベントは「fetchがrejectしなかった」ことを基準に動作します。厳密な保存成功判定が必要ならGAS側に応答可能なAPIを設け、CORS/認証を含めて改修してください。

## GTM
- 既存コンテナ：`GTM-TCL9ZH6`
- フォーム操作：`form_step_view`、`form_step_complete`、`form_step_validation_error`、`form_appointment_view`、`form_appointment_complete`、`form_appointment_submission_error`
- 第1送信がresolveした時点で、旧コードに合わせた `lead_attributes_ready` と `chat_form_submission_success` を発火。
- 送信後の追加データは既存と同じく `isAdditionalData` で送信し、リードCVの二重発火を避けます。
- `chat_form_submission_success` の `user_data` には既存仕様に合わせた氏名・電話・メールが入ります。GTM側のタグ設定と個人情報の送信先を確認してください。

## ファイル
- `index.html`：表示枠とフォーム各ステップ
- `question.js`：すべての質問データと日時テーブルの選択肢
- `app.js`：UI生成・バリデーション・ステップ遷移・GAS・GTM送信
- `style.css`：レイアウト・アニメーション・日時テーブル
