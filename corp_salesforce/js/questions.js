// --- UTM条件定義 ---
const UTM_RULES = {
  //utm_sourceで指定
  hideKeywords: [
    'ALA_gift_',
    'BKR_gift_',
    'GMO_gift_',
    'CRS_gift_',
    'fbtrg_',
    'google',
    'yahoo'
  ],
  //utm_sourceで指定
  hideAgeKeywords_60: [
    'ALA_gift_',
    'BKR_gift_',
    'GMO_gift_',
    'CRS_gift_',
    'google',
    'yahoo'
  ],
  //utm_sourceで指定「お申し込みの決め手」
  showApplicationReason: [
    'ALA_gift_ebook_4362',
    'ALA_gift_ebook_4362PM'
  ],
  //utm_campaignで指定「進呈条件」
  customGiftTermsKeywordsAff: [
    'gift_up_campaign'
  ],
  customGiftTermsKeywordsHp: [
    'hp_gift_ebook',
    'wk_gift_ebook',
    'wk_gift_movie'
  ]
};

// --- システムメッセージ定義 ---
const SYSTEM_MESSAGES = {
  // ウェルカムメッセージ
  welcome: [
    { text: "【Salesforce様限定】ご面談フォームです！<br>30秒程度の簡単な質問をさせてください。", isHtml: true }
  ],
  // 前半フロー完了メッセージ
  initial_complete: [
    { text: "送信が完了しました。<br>お問い合わせいただきありがとうございました！", isHtml: true },
    { text: "デジタル書籍は下記から閲覧できます！" },
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

const initialQuestions = [
  {
    id: 'annual_income', item: "年収", question: "資産形成に関する現在の課題に最も近いものを教えてください。", answer_method: "single-choice",
    options: [
      { label: "自分に最適な節税方法を把握したい", value: "700～799万" },
      { label: "節税の仕組みが分からないので学びたい", value: "800～899万" },
      { label: "不動産投資を", value: "900～999万" },
      { label: "1000万～", value: "1000～1099万" },
      { label: "1500万～", value: "1500～1999万" },
      { label: "2000万～", value: "2000～2499万" },
      { label: "3000万～", value: "3000～3999万" },
      { label: "5000万～", value: "5000万～1億未満" }
    ],
    key: "annual_income", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'annual_income', item: "年収", question: "まずはじめに、現在のご年収を教えてください。", answer_method: "single-choice",
    options: [
      { label: "株", value: "株" },
      { label: "不動産投資", value: "不動産投資" },
      { label: "投資信託", value: "投資信託" },
      { label: "金", value: "金" },
      { label: "その他", value: "その他" }
    ],
    key: "annual_income", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'annual_income', item: "年収", question: "まずはじめに、現在のご年収を教えてください。", answer_method: "single-choice",
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
      {
        label: "20～24歳", value: "20～24歳",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideKeywords.some(keyword => source.includes(keyword));
        }
      },
      { label: "25～29歳", value: "25～29歳" },
      { label: "30～34歳", value: "30～34歳" },
      { label: "35～39歳", value: "35～39歳" },
      { label: "40～44歳", value: "40～44歳" },
      { label: "45～49歳", value: "45～49歳" },
      { label: "50～54歳", value: "50～54歳" },
      { label: "55～59歳", value: "55～59歳" },
      {
        label: "60歳～", value: "60～64歳",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideAgeKeywords_60.some(keyword => source.includes(keyword));
        }
      }
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
    key: "phone_number",
    validation: (v) => {
      const digits = v.replace(/[ー－‐-]/g, "").trim();
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
    summaryLabel: "日時 第1希望",
    pre_message: (utmParams) => {
      const campaign = utmParams?.utm_campaign || '';
      const source = utmParams?.utm_source || '';

      const isCampaignHp = UTM_RULES.customGiftTermsKeywordsHp.some(keyword =>
        source.includes(keyword) || campaign.includes(keyword)
      );
      const isCampaignAff = UTM_RULES.customGiftTermsKeywordsAff.some(keyword =>
        source.includes(keyword) || campaign.includes(keyword)
      );

      if (isCampaignHp) {
        return "面談を受けていただくと<span style='color: red;'>最大70,000円相当</span>のえらべるデジタルギフト、プレゼントの対象となります！";
      } else if (isCampaignAff) {
        return "面談を受けていただくと<span style='color: red;'>最大60,000円相当</span>のえらべるデジタルギフト、プレゼントの対象となります！";
      } else {
        return "面談を受けていただくと<span style='color: red;'>最大50,000円相当</span>のえらべるデジタルギフト、プレゼントの対象となります！";
      }
    },
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
  }
];
