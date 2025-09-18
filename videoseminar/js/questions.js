// js/questions.js
// 質問の定義データ

const katakanaRegex = /^[ァ-ヶー　]+$/;

const initialQuestions = [
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
    id: 'investment_experience', 
    item: "不動産投資経験", 
    question: "不動産投資のご経験はありますか？", 
    answer_method: "single-choice", 
    options: [
      { label: "あり", value: "あり" },
      { label: "なし", value: "なし" }
    ], 
    key: "investment_experience", 
    validation: (v) => !!v, 
    errorMessage: "選択してください。" 
  },
  { 
    id: 'investment_purpose', 
    item: "不動産投資の目的", 
    question: "続いて、不動産投資に期待することを1つ教えてください！", 
    answer_method: "single-choice", 
    options: [
      { label: "節税対策", value: "節税対策" },   
      { label: "家賃収入", value: "家賃収入" },
      { label: "相続対策", value: "相続対策" },
      { label: "老後の年金対策", value: "老後の年金対策" },
      { label: "リスク分散", value: "リスク分散" },
      { label: "その他・まだ分からない", value: "その他・まだ分からない" }
    ], 
    key: "investment_purpose", 
    validation: (v) => !!v, 
    errorMessage: "選択してください。" 
  },
  { 
    id: 'investment_interest', 
    item: "不動産投資への興味", 
    question: "不動産投資への興味度合いはいかがでしょうか？", 
    answer_method: "single-choice",
    options: [
      { label: "今すぐ始めたい", value: "今すぐ始めたい" },
      { label: "情報収集したい", value: "情報収集したい" }
    ], 
    key: "investment_interest", 
    validation: (v) => !!v, 
    errorMessage: "選択してください。" 
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
  { id: 'name_kanji', item: "お名前（漢字）", pre_message_1: "ありがとうございます！", answer_method: "text-pair", pairs: [
      { prompt: "お名前を入力してください。", inputs: [ { label: "姓", key: "last_name", placeholder: "山田", type: "text" }, { label: "名", key: "first_name", placeholder: "太郎", type: "text" } ], combinedValidation: (v1, v2) => (v1 && v1.trim().length > 0) && (v2 && v2.trim().length > 0), combinedErrorMessage: "姓と名の両方を入力してください。" }
    ], key_group: "name_details" },
  { id: 'name_kana', item: "お名前（フリガナ）", answer_method: "text-pair", pairs: [
      { prompt: "続いて、フリガナを入力してください。（全角カタカナ）", inputs: [ { label: "セイ", key: "last_name_kana", placeholder: "ヤマダ", type: "text" }, { label: "メイ", key: "first_name_kana", placeholder: "タロウ", type: "text" } ], combinedValidation: (v1, v2) => (v1 && katakanaRegex.test(v1.trim())) && (v2 && katakanaRegex.test(v2.trim())), combinedErrorMessage: "セイとメイの両方を全角カタカナで入力してください。" }
    ], key_group: "name_details" },
  { id: 'phone_number', item: "電話番号", pre_message_1: "残り2問です！", question: "電話番号を入力してください。", placeholder: "09012345678", answer_method: "text", type: "tel", key: "phone_number", validation: (v) => /^[0-9]{10,11}$/.test(v.replace(/-/g, "")), errorMessage: "有効な電話番号をハイフンなし半角数字で入力してください。" },
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
    { id: 'first_choice_date', item: "面談希望日（第一希望）", pre_message: "面談を受けていただくと<span style='color: red;'>最大50,000円相当</span>のえらべるデジタルギフト、プレゼントの対象となります！", question: "【第一希望】<br>ご相談希望日をお選びください", isHtmlQuestion: true, answer_method: "calendar", key: "first_choice_date", validation: (v) => /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/.test(v) && !isNaN(new Date(v)), errorMessage: "YYYY/MM/DD形式で有効な日付を入力してください。" },
    { id: 'first_choice_time', item: "面談希望時間（第一希望）", question: "【第一希望】<br>ご相談希望時間をお選びください", isHtmlQuestion: true, answer_method: "single-choice", options: ["10：00～12：00", "12：00～14：00", "14：00～16：00", "16：00～18：00", "18：00～20：00", "20：00 以降", "その他の時間"], key: "first_choice_time", validation: (v) => !!v, errorMessage: "選択してください。" },
    { id: 'first_choice_time_other', item: "面談希望時間（第一希望その他）", question: "【第一希望】ご相談希望時間を入力ください", answer_method: "text", type: "text", key: "first_choice_time_other", condition: { key: "first_choice_time", value: "その他の時間" }, validation: (v) => v && v.trim().length > 0, errorMessage: "希望時間を入力してください。" },
    { id: 'second_choice_date', item: "面談希望日（第二希望）", question: "【第二希望】<br>ご相談希望日をお選びください", isHtmlQuestion: true, answer_method: "calendar", key: "second_choice_date", validation: (v) => /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/.test(v) && !isNaN(new Date(v)), errorMessage: "YYYY/MM/DD形式で有効な日付を入力してください。" },
    { id: 'second_choice_time', item: "面談希望時間（第二希望）", question: "【第二希望】<br>ご相談希望時間をお選びください", isHtmlQuestion: true, answer_method: "single-choice", options: ["10：00～12：00", "12：00～14：00", "14：00～16：00", "16：00～18：00", "18：00～20：00", "20：00 以降", "その他の時間"], key: "second_choice_time", validation: (v) => !!v, errorMessage: "選択してください。" },
    { id: 'second_choice_time_other', item: "面談希望時間（第二希望その他）", question: "【第二希望】ご相談希望時間を入力ください", answer_method: "text", type: "text", key: "second_choice_time_other", condition: { key: "second_choice_time", value: "その他の時間" }, validation: (v) => v && v.trim().length > 0, errorMessage: "希望時間を入力してください。" }
];