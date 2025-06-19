// js/questions.js
// 質問の定義データ

const katakanaRegex = /^[ァ-ヶー　]+$/;

// =================================================
// ▼▼▼ 変更点 ▼▼▼
// id:4を「お名前（漢字）」とid:5「お名前（フリガナ）」に分割しました。
// それに伴い、後続のIDを振り直しています。
// =================================================
const initialQuestions = [
  { id: 1, item: "職業", question: "まずはじめに、ご職業を教えてください。", answer_method: "single-choice", options: ["会社員（上場企業）", "会社員（その他）", "公務員", "経営者", "士業（医師、看護師、弁護士、税理士など）", "自営業・その他"], key: "occupation", validation: (v) => !!v, errorMessage: "選択してください。" },
  { id: 2, item: "年収", question: "続いて、現在の年収を教えてください。", answer_method: "single-choice", options: ["0～399万", "400～499万", "500～599万", "600～699万", "700～799万", "800～899万", "900～999万", "1000～1099万", "1100～1199万", "1200～1299万", "1300～1399万", "1400～1499万", "1500～1999万", "2000～2499万", "2500～2999万", "3000～3999万", "4000～4999万", "5000万～1億未満", "1億以上"], key: "annual_income", validation: (v) => !!v, errorMessage: "選択してください。" },
  { id: 3, item: "年齢", question: "ご年齢はおいくつでしょうか？", answer_method: "single-choice", options: ["20歳未満", "20～24歳", "25～29歳", "30～34歳", "35～39歳", "40～44歳", "45～49歳", "50～54歳", "55～59歳", "60～64歳", "65～69歳", "70歳以上"], key: "age_group", validation: (v) => !!v, errorMessage: "選択してください。" },
  { id: 4, item: "お名前（漢字）", pre_message_1: "ありがとうございます！", answer_method: "text-pair", pairs: [
      { prompt: "お名前を入力してください。", inputs: [ { label: "姓", key: "last_name", placeholder: "山田", type: "text" }, { label: "名", key: "first_name", placeholder: "太郎", type: "text" } ], combinedValidation: (v1, v2) => (v1 && v1.trim().length > 0) && (v2 && v2.trim().length > 0), combinedErrorMessage: "姓と名の両方を入力してください。" }
    ], key_group: "name_details" },
  { id: 5, item: "お名前（フリガナ）", answer_method: "text-pair", pairs: [
      { prompt: "続いて、フリガナを入力してください。（全角カタカナ）", inputs: [ { label: "セイ", key: "last_name_kana", placeholder: "ヤマダ", type: "text" }, { label: "メイ", key: "first_name_kana", placeholder: "タロウ", type: "text" } ], combinedValidation: (v1, v2) => (v1 && katakanaRegex.test(v1.trim())) && (v2 && katakanaRegex.test(v2.trim())), combinedErrorMessage: "セイとメイの両方を全角カタカナで入力してください。" }
    ], key_group: "name_details" },
  { id: 6, item: "電話番号", pre_message_1: "ご入力ありがとうございます！", pre_message_2: "残り2問です！", question: "電話番号を入力してください。", placeholder: "09012345678", answer_method: "text", type: "tel", key: "phone_number", validation: (v) => /^[0-9]{10,11}$/.test(v.replace(/-/g, "")), errorMessage: "有効な電話番号をハイフンなし半角数字で入力してください。" },
  { id: 7, item: "メールアドレス", question: "メールアドレスを入力してください！", placeholder: "user@example.com", answer_method: "text", type: "email", key: "email_address", validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: "有効なメールアドレスを入力してください。" },
  {
    id: 8,
    item: "最終確認",
    pre_message: "ご回答ありがとうございました！",
    question: "入力内容・利用規約をご確認の上、「同意して送信」を押してください。",
    answer_method: "final-consent",
    privacy_policy_link_text: "個人情報のお取り扱い",
    privacy_policy_url: "https://jpreturns.com/privacypolicy/",
    gift_terms_link_text: "選べるデジタルギフトプレゼント条件",
    gift_terms_popup_title: "えらべるデジタルギフトプレゼント条件",
    gift_terms_popup_content: `(えらべるデジタルギフトプレゼント条件<br>以下ダミー<br>000000000000000000000<br>000000000000000000000)`,
    submit_button_text: "同意して送信",
    key: "final_consent_given"
  }
];

const additionalQuestions = [
    { id: 9, item: "面談希望日（第一希望）", pre_message: "面談を受けていただくと<span style='color: red;'>最大50,000円相当</span>のえらべるデジタルギフト、プレゼントの対象となります！", question: "【第一希望】<br>ご相談希望日をお選びください", isHtmlQuestion: true, answer_method: "calendar", key: "first_choice_date", validation: (v) => /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/.test(v) && !isNaN(new Date(v)), errorMessage: "YYYY/MM/DD形式で有効な日付を入力してください。" },
    { id: 10, item: "面談希望時間（第一希望）", question: "【第一希望】<br>ご相談希望時間をお選びください", isHtmlQuestion: true, answer_method: "single-choice", options: ["10：00～12：00", "12：00～14：00", "14：00～16：00", "16：00～18：00", "18：00～20：00", "20：00 以降", "その他の時間"], key: "first_choice_time", validation: (v) => !!v, errorMessage: "選択してください。" },
    { id: 11, item: "面談希望時間（第一希望その他）", question: "【第一希望】その他のご相談希望時間を入力ください", answer_method: "text", type: "text", key: "first_choice_time_other", condition: { key: "first_choice_time", value: "その他の時間" }, validation: (v) => v && v.trim().length > 0, errorMessage: "希望時間を入力してください。" },
    { id: 12, item: "面談希望日（第二希望）", question: "【第二希望】<br>ご相談希望日をお選びください", isHtmlQuestion: true, answer_method: "calendar", key: "second_choice_date", validation: (v) => /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/.test(v) && !isNaN(new Date(v)), errorMessage: "YYYY/MM/DD形式で有効な日付を入力してください。" },
    { id: 13, item: "面談希望時間（第二希望）", question: "【第二希望】<br>ご相談希望時間をお選びください", isHtmlQuestion: true, answer_method: "single-choice", options: ["10：00～12：00", "12：00～14：00", "14：00～16：00", "16：00～18：00", "18：00～20：00", "20：00 以降", "その他の時間"], key: "second_choice_time", validation: (v) => !!v, errorMessage: "選択してください。" },
    { id: 14, item: "面談希望時間（第二希望その他）", question: "【第二希望】その他のご相談希望時間を入力ください", answer_method: "text", type: "text", key: "second_choice_time_other", condition: { key: "second_choice_time", value: "その他の時間" }, validation: (v) => v && v.trim().length > 0, errorMessage: "希望時間を入力してください。" }
];
