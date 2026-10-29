
// --- システムメッセージ定義 ---
const SYSTEM_MESSAGES = {
  // ウェルカムメッセージ
  welcome: [
    { text: "【Salesforce様限定】ご面談フォームです！<br>30秒程度の簡単な質問をさせてください。", isHtml: true }
  ],
  // 前半フロー完了メッセージ
  initial_complete: [
    { text: "送信が完了しました。<br>Salesforce様限定キャンペーンにお問い合わせいただきありがとうございました。", isHtml: true },
    { text: "お問い合わせいただきました皆様限定で、不動産投資を始めとした、資産形成の方法や節税についてまとめたeBookを無料で閲覧いただけます！<br>よろしければ是非ご利用ください。", isHtml: true },
    { text: "eBookを閲覧する", isHtml: false, isEbookBtn: true }
  ],
  // 全フロー完了メッセージ
  final_complete: [
    { text: "全ての情報を承りました。ご回答いただきありがとうございました！<br>お申し込みいただいた面談日程は、現時点では仮予約となっております。お電話での事前確認をもって、面談予約の確定とさせていただきます。", isHtml: true },
    { text: "後ほど弊社担当コンサルタントより事前確認のお電話を差し上げますので、ご対応のほどよろしくお願いいたします。", isHtml: true },
    { text: "お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～19:00（お盆・年末年始除く）", isHtml: true }
  ],
  // エラーメッセージ
  error: [
    { text: "エラーが発生し、データを送信できませんでした。お手数ですが、時間をおいて再度お試しください。", isHtml: false, isError: true }
  ]
};


const katakanaRegex = /^[ァ-ヶー　]+$/;

const initialQuestions = [
  {
    id: 'theme', item: "関心", question: "資産形成や税金対策において、現在最も関心のあるテーマを教えてください。", answer_method: "single-choice",
    options: [
      { label: "所得税・住民税の節税対策", value: "所得税・住民税などの節税対策" },
      { label: "インフレ時代の資産防衛術", value: "インフレ時代の資産防衛術" },
      { label: "老後資金の確保", value: "老後資金の確保" },
      { label: "家計・生命保険の見直し", value: "家計・生命保険の見直し" }
    ],
    key: "theme", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'investment', item: "投資経験", question: "現在実践している、または過去経験のある投資をお聞かせください（複数選択可）", answer_method: "multi-choice",
    options: [
      { label: "株式・投資信託", value: "株式・投資信託" },
      { label: "新NISA", value: "新NISA" },
      { label: "iDECO・企業型DC", value: "iDECO・企業型DC" },
      { label: "外貨預金", value: "外貨預金" },
      { label: "不動産投資", value: "不動産投資" },
      { label: "その他", value: "その他" },
      { label: "特になし", value: "特になし" }
    ],
    key: "investment", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'annual_income', item: "年収", question: "現在のご年収を教えてください。", answer_method: "single-choice",
    options: [
      { label: "700万～", value: "700～799万" },
      { label: "800万～", value: "800～899万" },
      { label: "900万～", value: "900～999万" },
      { label: "1000万～", value: "1000～1099万" },
      { label: "1500万～", value: "1500～1999万" },
      { label: "2000万～", value: "2000～2499万" },
      { label: "3000万～", value: "3000～3999万" },
      { label: "5000万～", value: "5000万～1億未満" }
    ],
    key: "annual_income", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'age_group', item: "年齢", question: "ご年齢はおいくつでしょうか？", answer_method: "single-choice",
    options: [
      { label: "22～24歳", value: "20～24歳" },
      { label: "25～29歳", value: "25～29歳" },
      { label: "30～34歳", value: "30～34歳" },
      { label: "35～39歳", value: "35～39歳" },
      { label: "40～44歳", value: "40～44歳" },
      { label: "45～49歳", value: "45～49歳" },
      { label: "50～54歳", value: "50～54歳" },
      { label: "55～59歳", value: "55～59歳" },
      { label: "60歳～", value: "60～64歳" }
    ],
    key: "age_group", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'name_kanji', item: "お名前（漢字）", pre_message: "ありがとうございます！", answer_method: "text-pair",
    prompt: "お名前を入力してください。",
    inputs: [
      { label: "姓", key: "last_name", placeholder: "山田", type: "text" },
      { label: "名", key: "first_name", placeholder: "太郎", type: "text" }
    ],
    combinedValidation: (v1, v2) => (v1 && v1.trim().length > 0) && (v2 && v2.trim().length > 0),
    combinedErrorMessage: "姓と名の両方を入力してください。",
    key_group: "name_details"
  },
  {
    id: 'phone_number',
    item: "電話番号",
    pre_message: "ありがとうございます。残り2問です！",
    question: "電話番号を入力してください。",
    placeholder: "09012345678",
    answer_method: "text",
    type: "tel",
    autocomplete: "tel",
    key: "phone_number",
    validation: (v) => {
      let digits = v.replace(/[ー－‐\-\s]/g, "").trim();

      // +81 を 0 に変換してから判定
      if (digits.startsWith('+81')) {
        digits = '0' + digits.slice(3);
      } else if (digits.startsWith('81') && digits.length >= 12) {
        digits = '0' + digits.slice(2);
      }

      // 1. 先頭が0で始まる10〜11桁の数字
      const isValidLength = /^0\d{9,10}$/.test(digits);
      // 2. 全て同じ数字の繰り返しを禁止
      const isNotRepeated = !/^(.)\1+$/.test(digits);

      return isValidLength && isNotRepeated;
    },
    errorMessage: "有効な電話番号をハイフンなし半角数字で入力してください。"
  },
  {
    id: 'email_address',
    item: "メールアドレス",
    question: "最後に、メールアドレスを入力してください！",
    placeholder: "user@example.com",
    answer_method: "text",
    type: "email",
    autocomplete: "email",
    key: "email_address",
    validation: (v) => {
      const email = v.trim();
      // 1. @の直後にドットを禁止
      // 2. 連続ドットを禁止
      // 3. 英数字・各種記号@ドメイン名.2文字以上
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:\.[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)*\.[a-zA-Z]{2,}$/;

      return emailRegex.test(email) && !/@\./.test(email) && !/\.\./.test(email);
    },
    errorMessage: "有効なメールアドレスを入力してください。"
  },
  {
    id: 'final_consent',
    item: "最終確認",
    pre_message: "ご回答ありがとうございました！",
    question: "入力内容・利用規約をご確認の上、「同意して送信」を押してください。",
    answer_method: "final-consent",
    privacy_policy_link_text: "個人情報のお取り扱い",
    privacy_policy_url: "https://chatbot.jpreturns.com/privacypolicy",
    submit_button_text: "同意して送信",
    key: "final_consent_given"
  }
];

const TIME_SLOTS = [
  { label: "10:00~", value: "10：00～12：00" },
  { label: "12:00~", value: "12：00～14：00" },
  { label: "14:00~", value: "14：00～16：00" },
  { label: "16:00~", value: "16：00～18：00" },
  { label: "18:00~", value: "18：00～20：00" },
  { label: "20:00~", value: "20：00 以降" },
  { label: "その他", value: "その他の時間" }
];
const additionalQuestions = [
  {
    id: 'first_choice_date',
    item: "面談希望日時（第一希望）",
    pre_message: "ご面談を受けていただくと、10,000円相当のアマゾンギフトプレゼントの対象となります！",
    summaryLabel: "日時 第1希望",
    question: "【第1希望】<br>ご面談希望日時をお選びください。<br>※ご予約は仮となっております。お電話での事前確認をもって、面談予約の確定とさせていただきます。",
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
    question: "【第1希望】<br>ご面談希望時間を入力ください。",
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
    question: "【第2希望】<br>ご面談希望日時をお選びください。<br>※ご予約は仮となっております。お電話での事前確認をもって、面談予約の確定とさせていただきます。",
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
    question: "【第2希望】<br>ご面談希望時間を入力ください。",
    isHtmlQuestion: true,
    answer_method: "text",
    type: "text",
    key: "second_choice_time_other",
    condition: { key: "second_choice_time", value: "その他の時間" },
    validation: (v) => v && v.trim().length > 0,
    errorMessage: "希望時間を入力してください。"
  }
];
