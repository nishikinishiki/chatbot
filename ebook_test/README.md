# ebook_test：Pardot連携テスト

既存のテスト専用質問・UIを維持し、送信先だけ分離。commonと本番フォームは変更しません。
本番GAS、GTM、広告CVイベントへは送信しません。

## まず送信内容だけ確認

初期設定はdryRun: true。第1・第2ステップを回答すると画面内に送信予定の項目が表示されます。
第2ステップにも、第1ステップのメールアドレスと同じsubmission_idを付けます。
個人情報は画面内だけに表示し、テスト用の情報を入力してください。

## Pardotへ実送信

1. テスト専用Form Handlerを2つ作成します。最初は自動返信・営業通知・本番リスト追加を設定しません。
2. js/pardot-config.jsのinitialFieldsとadditionalFieldsに対応する外部項目名を設定。email_addressはPardotのメール項目に対応させ、両Handlerで必須にします。
3. initialEndpointとadditionalEndpointにHTTPSのHandler URLを設定し、dryRunをfalseへ変更。
4. Handlerの成功・エラーの場所を「特定のURL」に設定。例：
   - 成功：https://chatbot.jpreturns.com/ebook_test/callback.html?status=success
   - エラー：https://chatbot.jpreturns.com/ebook_test/callback.html?status=error
   実際の送信では識別用token付きURLをsuccess_location/error_locationで指定します。
   「成功の場所へのデータ転送」はOFFにします。
5. HTTPSで公開した/ebook_test/でテスト。PardotのProspect・送信履歴・日時の更新を確認。

iframeが読み込まれただけでは成功扱いにせず、成功ページからの通知を待ちます。
30秒以内に確認できない場合は結果不明と表示。再試行前にPardot側を確認してください。
メールアドレス重複を許可している環境では、意図したProspectへ更新されたか必ず確認してください。

## 閲覧履歴のテスト

js/tracking.jsに自社環境で生成したPardotトラッキングコードのscriptタグ内を貼り付けます。
LPなど過去の閲覧も確認する場合は、そのページにもトラッキングコードが必要。
Tracker Domain・Cookie・同意設定・ブラウザの制限を確認してください。
トラッキングコードは現在未設定。Cookieの紐付けは実環境での確認が必要です。

## Thanksメールの分岐

第1送信：meeting_date_answered=NO、第2送信：面談希望日があればYES。
submission_idは今回の申込を識別する値です。
メール送信はこのコードでは実装していません。Pardot側で別途設定します。
再申込時は以前の希望日・送信済みフラグが残るため、希望日の空欄判定だけで分岐しないでください。
前回案の「Engagement Studioで10分待機」はそのまま設定できる前提にせず、
利用環境の待機単位・処理タイミングを確認し、必要ならGASなどで待機を管理してください。

## 公式資料

- https://help.salesforce.com/s/articleView?id=sf.pardot_create_form_handler.htm&language=en_US&type=5
- https://help.salesforce.com/s/articleView?id=sf.pardot_considerations_for_using_form_handlers.htm&language=en_US&type=5
- https://help.salesforce.com/s/articleView?id=000384600&language=en_US&type=1
