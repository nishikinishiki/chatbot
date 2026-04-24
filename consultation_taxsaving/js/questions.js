// --- システムメッセージ定義 ---
const SYSTEM_MESSAGES = {
    // ウェルカムメッセージ
    welcome: [
        { text: "JPリターンズにご興味を持っていただきありがとうございます！<br>30秒程度の簡単な質問をさせてください。", isHtml: true }
        // メッセージを増やしたい場合は、以下のように追加できます。
        // , { text: "2つ目の吹き出しです。", isHtml: false }
        // , { text: "3つ目の吹き出しです。", isHtml: false }
    ],
    // 前半フロー完了メッセージ
    initial_complete: [
        { text: "送信が完了しました。<br>お問い合わせいただきありがとうございました！", isHtml: true },
        { text: "デジタル書籍は下記から閲覧できます！", isHtml: false },
        { text: "デジタル書籍を閲覧する", isHtml: false, isEbookBtn: true }
    ],
    // 全フロー完了メッセージ
    final_complete: [
        { text: "全ての情報を承りました。ご回答ありがとうございました！<br>後ほど担当よりご連絡いたします。", isHtml: true },
        { text: "お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", isHtml: true }
    ],
    // エラーメッセージ
    error: [
        { text: "エラーが発生し、データを送信できませんでした。お手数ですが、時間をおいて再度お試しください。", isHtml: false, isError: true }
    ]
};

const katakanaRegex = /^[ァ-ヶー　]+$/;

const TIME_SLOTS = [
    { label: "10:00~", value: "10：00～12：00" },
    { label: "12:00~", value: "12：00～14：00" },
    { label: "14:00~", value: "14：00～16：00" },
    { label: "16:00~", value: "16：00～18：00" },
    { label: "18:00~", value: "18：00～20：00" },
    { label: "20:00~", value: "20：00 以降" },
    { label: "その他", value: "その他の時間" }
];

const initialQuestions = [
  
  {
      id: 'first_choice_date',
      item: "面談希望日時（第一希望）",
      summaryLabel: "日時 第1希望",
      question: "【第1希望】<br>ご相談希望日時をお選びください。",
      isHtmlQuestion: true,
      answer_method: "time-table",
      keys: { date: 'first_choice_date', time: 'first_choice_time' },
      timeSlots: TIME_SLOTS,
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
      id: 'second_choice_date',
      item: "面談希望日時（第二希望）",
      summaryLabel: "日時 第2希望",
      question: "【第2希望】<br>ご相談希望日時をお選びください。",
      isHtmlQuestion: true,
      answer_method: "time-table",
      keys: { date: 'second_choice_date', time: 'second_choice_time' },
      timeSlots: TIME_SLOTS,
      validation: (v) => !!v,
      errorMessage: "ご希望の日時を選択してください。"
  },
  { 
      id: 'second_choice_time_other', 
      item: "面談希望時間（第二希望その他）", 
      summaryLabel: "その他時間",
      question: "【第2希望】<br>ご相談希望時間を入力ください。", 
      isHtmlQuestion: true,
      answer_method: "text", 
      type: "text", 
      key: "second_choice_time_other", 
      condition: { key: "second_choice_time", value: "その他の時間" }, 
      validation: (v) => v && v.trim().length > 0, 
      errorMessage: "希望時間を入力してください。" 
  },
  { id: 'occupation', item: "職業", question: "ご職業を教えてください。", answer_method: "single-choice", 
    options: [
      { label: "会社員 (上場企業)", value: "会社員（上場企業）" },
      { label: "会社員 (その他)", value: "会社員（その他）" },
      { label: "公務員", value: "公務員" },
      { label: "経営者,役員", value: "経営者" },
      { label: "医師,看護師", value: "士業（医師、看護師、弁護士、税護士など）" },    
      { label: "士業 (弁護士,税理士等)", value: "士業（医師、看護師、弁護士、税護士など）" },
      { label: "自営業", value: "自営業・その他" },
      { label: "その他", value: "自営業・その他" }
    ], 
    key: "occupation", validation: (v) => !!v, errorMessage: "選択してください。" 
  },
  { id: 'annual_income', item: "年収", question: "続いて、現在の年収を教えてください。", answer_method: "single-choice", 
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
    key: "annual_income", validation: (v) => !!v, errorMessage: "選択してください。" 
  },
  { id: 'age_group', item: "年齢", question: "ご年齢はおいくつでしょうか？", answer_method: "single-choice",
    options: [
      { label: "20歳未満",  value: "20歳未満" },
      { label: "20～24歳",  value: "20～24歳" },
      { label: "25～29歳",  value: "25～29歳" },
      { label: "30～34歳",  value: "30～34歳" },
      { label: "35～39歳",  value: "35～39歳" },
      { label: "40～44歳",  value: "40～44歳" },
      { label: "45～49歳",  value: "45～49歳" },
      { label: "50～54歳",  value: "50～54歳" },
      { label: "55～59歳",  value: "55～59歳" },
      { label: "60歳～",  value: "60～64歳" }
    ], 
    key: "age_group", validation: (v) => !!v, errorMessage: "選択してください。" 
  },
  { id: 'name_kanji', item: "お名前（漢字）", pre_message: "ありがとうございます！", answer_method: "text-pair", 
    prompt: "お名前を入力してください。", 
    inputs: [ 
      { label: "姓", key: "last_name", placeholder: "山田", type: "text" }, 
      { label: "名", key: "first_name", placeholder: "太郎", type: "text" } 
    ], 
    combinedValidation: (v1, v2) => (v1 && v1.trim().length > 0) && (v2 && v2.trim().length > 0), 
    combinedErrorMessage: "姓と名の両方を入力してください。", 
    key_group: "name_details" 
  },
  { id: 'name_kana', item: "お名前（フリガナ）", answer_method: "text-pair", 
    prompt: "続いて、フリガナを入力してください。（全角カタカナ）", 
    inputs: [ 
      { label: "セイ", key: "last_name_kana", placeholder: "ヤマダ", type: "text" }, 
      { label: "メイ", key: "first_name_kana", placeholder: "タロウ", type: "text" } 
    ], 
    combinedValidation: (v1, v2) => (v1 && katakanaRegex.test(v1.trim())) && (v2 && katakanaRegex.test(v2.trim())), 
    combinedErrorMessage: "セイとメイの両方を全角カタカナで入力してください。", 
    key_group: "name_details" 
  },
  { id: 'phone_number', item: "電話番号", pre_message: "残り2問です！", question: "電話番号を入力してください。", placeholder: "09012345678", answer_method: "text", type: "tel", key: "phone_number", validation: (v) => /^[0-9]{10,11}$/.test(v.replace(/-/g, "")), errorMessage: "有効な電話番号をハイフンなし半角数字で入力してください。" },
  { id: 'email_address', item: "メールアドレス", question: "最後に、メールアドレスを入力してください！", placeholder: "user@example.com", answer_method: "text", type: "email", key: "email_address", validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: "有効なメールアドレスを入力してください。" },
  {
    id: 'final_consent',
    item: "最終確認",
    pre_message: "ご回答ありがとうございました！",
    question: "入力内容・利用規約をご確認の上、「同意して送信」を押してください。",
    answer_method: "final-consent",
    privacy_policy_link_text: "個人情報のお取り扱い",
    privacy_policy_url: "https://jpreturns.com/privacypolicy/",
    submit_button_text: "同意して送信",
    key: "final_consent_given"
  }
];

const additionalQuestions = [
    { 
      id: 'referral_source', 
      item: "弊社を知ったきっかけ", 
      question: "これが最後の質問です！<br>弊社を知ったきっかけを教えてください。（複数選択可）",
      isHtmlQuestion: true,
      answer_method: "multi-choice",
      options: [
        { label: "Web検索", value: "ネット検索" },
        { label: "ポイントサイト", value: "ポイントサイト" },
        { label: "SNS広告", value: "SNS広告" },
        { label: "インフルエンサーの投稿", value: "インフルエンサーの投稿" },
        { label: "知人のご紹介", value: "知人紹介" },
        { label: "ホリエモンチャンネル", value: "ホリエモンチャンネル" },
        { label: "その他", value: "その他" }
      ], 
      key: "referral_source", 
      validation: (v) => Array.isArray(v) && v.length > 0, 
      errorMessage: "少なくとも1つ選択してください。" 
    }
];