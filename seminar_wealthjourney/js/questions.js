const questions = [
    { 
    id: 'digital_gift_choice', 
    item: "希望デジタルギフト", 
    question: "ご希望のデジタルギフトをお選びください！", 
    answer_method: "single-choice", 
    options: [
      { label: "Amazonギフトカード", value: "Amazonギフトカード" },
      { label: "PayPayポイント", value: "PayPayポイント" },
      { label: "楽天ポイント", value: "楽天ポイント" }
    ], 
    key: "digital_gift_choice", 
    validation: (v) => !!v, 
    errorMessage: "選択してください。" 
    },
    {
        id: 'first_choice_date',
        item: "面談希望日時（第一希望）",
        summaryLabel: "日時 第1希望",
        question: "セミナーの参加ご希望日時を教えてください！",
        isHtmlQuestion: true,
        answer_method: "time-table",
        keys: { date: 'first_choice_date', time: 'first_choice_time' },
        timeSlots: [
            { label: "10:00~", value: "10：00～12：00" },
            { label: "11:00~", value: "12：00～14：00" },
            { label: "12:00~", value: "14：00～16：00" },
            { label: "13:00~", value: "16：00～18：00" },
            { label: "14:00~", value: "18：00～20：00" },
            { label: "15:00~", value: "20：00 以降" },
            { label: "16:00~", value: "20：00 以降" },
            { label: "17:00~", value: "20：00 以降" },
            { label: "18:00~", value: "20：00 以降" },
            { label: "19:00~", value: "20：00 以降" }
        ],
        validation: (v) => !!v,
        errorMessage: "ご希望の日時を選択してください。"
    },
    { 
        id: 'first_choice_time_other', 
        item: "面談希望時間（第一希望その他）",
        summaryLabel: "その他時間",
        question: "【第1希望】<br>ご相談希望時間を入力ください。",
        isHtmlQuestion: true, 
        answer_method: "text", 
        type: "text", 
        key: "first_choice_time_other", 
        condition: { key: "first_choice_time", value: "その他の時間" }, 
        validation: (v) => v && v.trim().length > 0, 
        errorMessage: "希望時間を入力してください。" 
    },
    { 
        id: 'occupation', 
        item: "職業", 
        summaryLabel: "職業",
        question: "ありがとうございます！<br>続いて、ご職業を教えてください。", 
        isHtmlQuestion: true,
        answer_method: "single-choice", 
        options: [
            { label: "会社員 (上場企業)", value: "会社員（上場企業）" },
            { label: "会社員 (その他)", value: "会社員（その他）" },
            { label: "公務員", value: "公務員" },
            { label: "経営者", value: "経営者" },
            { label: "士業<br>(医師、弁護士等)", value: "士業（医師、看護師、弁護士、税護士など）" },
            { label: "自営業・その他", value: "自営業・その他" }
        ], 
        key: "occupation", 
        validation: (v) => !!v, 
        errorMessage: "選択してください。" 
    },
    { 
        id: 'annual_income', 
        item: "年収", 
        summaryLabel: "年収",
        question: "現在の年収を教えてください。", 
        answer_method: "single-choice", 
        options: [
            { label: "500万未満",   value: "0～399万" },
            { label: "500万～",   value: "500～599万" },
            { label: "600万～",   value: "600～699万" },
            { label: "700万～",   value: "700～799万" },
            { label: "800万～",   value: "800～899万" },
            { label: "900万～",   value: "900～999万" },
            { label: "1000万～",  value: "1000～1099万" },
            { label: "1200万～",  value: "1200～1299万" },
            { label: "1500万～",  value: "1500～1999万" },
            { label: "2000万～",  value: "2000～2499万" },
            { label: "3000万～",  value: "3000～3999万" },
            { label: "5000万～",  value: "5000万～1億未満" }
        ], 
        key: "annual_income", 
        validation: (v) => !!v, 
        errorMessage: "選択してください。" 
    },
    { 
        id: 'age_group', 
        item: "年齢", 
        summaryLabel: "年齢",
        question: "ご年齢はおいくつでしょうか？", 
        answer_method: "single-choice", 
        options: ["20歳未満", "20～24歳", "25～29歳", "30～34歳", "35～39歳", "40～44歳", "45～49歳", "50～54歳", "55～59歳", "60～64歳", "65～69歳", "70歳以上"], 
        key: "age_group", 
        validation: (v) => !!v, 
        errorMessage: "選択してください。" 
    },
    { 
        id: 'name_kanji', 
        item: "お名前（漢字）", 
        pre_message_1: "ありがとうございます！", 
        answer_method: "text-pair", 
        pairs: [
            { 
                prompt: "お名前を入力してください。", 
                inputs: [ 
                    { label: "姓", key: "last_name", placeholder: "山田", type: "text" }, 
                    { label: "名", key: "first_name", placeholder: "太郎", type: "text" } 
                ], 
                combinedValidation: (v1, v2) => (v1 && v1.trim().length > 0) && (v2 && v2.trim().length > 0), 
                combinedErrorMessage: "姓と名の両方を入力してください。" 
            }
        ], 
        key_group: "name_details" 
    },
    { 
        id: 'name_kana', 
        item: "お名前（フリガナ）", 
        answer_method: "text-pair", 
        pairs: [
            { 
                prompt: "続いて、フリガナを入力してください。（全角カタカナ）", 
                inputs: [ 
                    { label: "セイ", key: "last_name_kana", placeholder: "ヤマダ", type: "text" }, 
                    { label: "メイ", key: "first_name_kana", placeholder: "タロウ", type: "text" } 
                ], 
                combinedValidation: (v1, v2) => {
                    const katakanaRegex = /^[ァ-ヶー　]+$/;
                    return (v1 && katakanaRegex.test(v1.trim())) && (v2 && katakanaRegex.test(v2.trim()));
                },
                combinedErrorMessage: "セイとメイの両方を全角カタカナで入力してください。" 
            }
        ], 
        key_group: "name_details" 
    },
    { 
        id: 'phone_number', 
        item: "電話番号", 
        summaryLabel: "電話番号",
        pre_message_1: "残り2問です！", 
        question: "電話番号を入力してください。", 
        placeholder: "09012345678", 
        answer_method: "text", 
        type: "tel", 
        key: "phone_number", 
        validation: (v) => /^[0-9]{10,11}$/.test(v.replace(/-/g, "")), 
        errorMessage: "有効な電話番号をハイフンなし半角数字で入力してください。" 
    },
    { 
        id: 'email_address', 
        item: "メールアドレス", 
        summaryLabel: "メールアドレス",
        question: "最後に、メールアドレスを入力してください！", 
        placeholder: "user@example.com", 
        answer_method: "text", 
        type: "email", 
        key: "email_address", 
        validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 
        errorMessage: "有効なメールアドレスを入力してください。" 
    },
    {
        id: 'final_consent',
        item: "最終確認",
        pre_message: "ご回答ありがとうございました！",
        question: "入力内容・利用規約をご確認の上、「同意して送信」を押してください。",
        answer_method: "final-consent",
        privacy_policy_link_text: "個人情報のお取り扱い",
        privacy_policy_url: "https://jpreturns.com/privacypolicy/",
        gift_terms_link_text: "選べるデジタルギフトプレゼント条件",
        gift_terms_popup_title: "",
gift_terms_popup_content: `
      <h3>セミナー参加で えらべるデジタルギフト<br>2,000円相当プレゼント条件</h3>
      <h4>キャンペーン概要</h4>
      <p>プレゼントは、セミナーの参加完了で2,000円相当のえらべるデジタルギフトカード（デジタルギフト）を予定しております。プレゼント条件を満たした方が対象となります。<br>
      ※特典は電子メールにてご送付いたします（弊社指定の方法による）。<br>
      ※特典の発送は、お申込みから約90日以内を予定しております。<br>
      また、えらべるデジタルギフトではAmazonギフトカード、PayPayポイント、楽天ポイント（期間限定ポイント※）からご希望の1種のみを選択いただけます。<br>
      ご希望のポイントは、フォームの「ご質問・ご要望」欄に記入ください。お申し込み時にご記入がない場合は、Amazonギフトカードをプレゼントいたします。お申し込み完了後の変更は原則受け付けておりませんので、予めご了承ください。<br>
      ※獲得いただけるポイントは期間限定ポイントになり、有効期限はポイント獲得後、6ヶ月間です。<br>
      ※お申し込み後、より適切なご案内を行う目的で、弊社よりお電話にて簡単なヒアリングをさせていただく場合がございます。ヒアリング内容を踏まえ、お客様のご状況によっては、対象セミナーまたはセミナー後のご案内を見送らせていただく場合がございますので、あらかじめご了承ください。</p>

      <h4>プレゼント条件</h4>
      <p>下記の項⽬を満たしている⽅が対象になります。</p>
      <ul>
          <li>キャンペーン期間中に対象のセミナーに申し込み、最後まで受講すること</li>
          <li>申込者ご本人様がカメラONで最後まで受講すること ※不正防止のため、申込者ご本人様の顔が画面上で明確に認識できること</li>
          <li>年収700万円以上、年齢25歳～50歳の方</li>
          <li>ご職業が以下のいずれかに該当する方：<br>
          （正社員（上場企業・非上場企業）、教職員（学校・大学など）、医療従事者（医師、看護師、薬剤師、医療技師など）、士業（弁護士、会計士、社労士など）、専門職（パイロット、研究職、技術士など）、公務員（地方・国家など）、消防・警察・自衛隊（公安職・防衛関係など）、法人経営者・役員）<br>
          ※現在就業中の方限定。休業・休職中の方は対象外となります。</li>
          <li>世帯で初めて「J.P.リターンズ」のサービス（セミナー、面談、資料請求）を利用する方</li>
          <li>お申込みいただいた内容に、虚偽・誤りがないこと<br>
          ※お渡し条件を満たしているか確認するため、状況に応じて本業収入が確認できる書類（例：源泉徴収票など）のご提出をお願いする場合がございます。<br>
          ※ご提出をお願いした際に内容の確認が取れない場合や、虚偽の申告が判明した場合は、キャンペーンの対象外となります。</li>
      </ul>

      <h4>プレゼント対象外</h4>
      <ul>
          <li>1世帯で2回以上の申込みの場合</li>
          <li>虚偽、重複、悪戯、迷惑行為、不正申込、またはキャンセルされた場合</li>
          <li>同業他社にお勤めの方</li>
          <li>弊社で行っている他キャンペーン（資料請求・動画セミナー・個別相談・セミナー・イベント等）に応募したことがある方</li>
          <li>弊社が提携している他社サービスから応募したことがある方、過去にご面談やお電話でのやり取りがある方</li>
          <li>電話が繋がらない方、弊社営業担当と電話での本人確認ができなかった方（お申込み内容の確認も含む）</li>
          <li>特典目的と弊社が判断した場合</li>
          <li>セミナー中に「暴言を吐く、質問に対して反応しない」など、弊社コンサルタントと対話する姿勢が見られない場合</li>
          <li>連絡が取れなくなった場合（申告のない連絡先変更、個人情報削除依頼など）</li>
          <li>途中で退出し、セミナーを最後まで受講しなかった場合</li>
          <li>セミナー参加時にプレゼント対象条件を満たしていないことが判明した場合</li>
      </ul>

      <h4>ご注意</h4>
      <ul>
          <li>キャンペーン参加等により被った一切の損害について弊社は責任を負わないものとします。</li>
          <li>弊社は、諸事情等により、予告なく本キャンペーンの内容の全部または一部を変更したり、本キャンペーンの適正な運用を確保するために必要と判断した措置を講じることができたり、本キャンペーンを早期に終了したりすることができるものとします。</li>
          <li>プレゼント条件に該当しない方は、お断りさせていただく可能性がございます。予めご了承ください。</li>
          <li>弊社の意に沿わない場合、お断りの理由については一切お答えが出来ませんのでご了承ください。</li>
          <li>本キャンペーンはJ.P.RETURNS株式会社による提供です。本キャンペーンについてのお問い合わせはAmazon・PayPay・楽天でお受けしておりません。Amazon、Amazon.co.jpおよびそれらのロゴはAmazon.com,Inc.またはその関連会社の商標です。</li>
      </ul>`,
        submit_button_text: "同意して送信",
        key: "final_consent_given"
    }
];

