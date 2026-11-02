"use strict";

/**
 * 複製先フォームの文言・選択肢・画像・リンクの管理ファイル。
 * 表示テキストの変更では index.html / app.js / style.css を編集する必要はありません。
 *
 * 手順：tob_test/salesforce フォルダをコピーし、コピー先のこのファイルを書き換えてください。
 * - page: ブラウザタイトル、説明文、画像・アイコン
 * - copy: ブランド、見出し、案内文、CTA、エラー文、完了文など全表示テキスト
 * - steps: 入力項目・選択肢・ステップ名・ボタン
 * - appointments: 希望日時テーブルの見出し・案内・自由入力欄
 * - timeSlots: 時間帯のラベルとGAS送信用の値
 *
 * GASの入力キー（key, dateKey, timeKey, otherKey）と値（options[].value,
 * timeSlots[].value）は、既存の受信仕様を変える場合以外は変更しないでください。
 */
window.FORM_QUESTIONS = Object.freeze({
  page: {
    title: "無料個別相談｜J.P.RETURNS",
    description: "マンション投資・資産形成に関する無料個別相談のお申し込み",
    favicon: "/common/images/favicon.png",
    heroImage: "/common/images/test.jpg",
    heroAlt: "J.P.RETURNS マンション投資のご案内"
  },

  copy: {
    accessibility: {
      visualPane: "マンション投資のご案内",
      formPane: "無料個別相談フォーム",
      initialPage: "お申し込みフォーム",
      progressNav: "入力の進捗"
    },
    branding: {
      symbol: "▰",
      name: "J.P.RETURNS",
      caption: "無料個別相談"
    },
    lead: {
      eyebrow: "FREE CONSULTATION",
      heading: "無料個別相談のお申し込み",
      intro: "以下の項目をご入力ください。"
    },
    privacy: {
      before: "",
      linkText: "個人情報のお取り扱い",
      linkUrl: "/privacypolicy",
      after: "を確認し、同意します。"
    },
    appointment: {
      eyebrow: "APPOINTMENT",
      heading: "ご面談の希望日時",
      intro: [
        "ご希望の日時をお選びください。",
        "面談日程はお電話での事前確認後に確定します。"
      ],
      submit: "入力内容を確認する"
    },
    completion: {
      symbol: "✓",
      heading: "ご入力ありがとうございます",
      intro: "入力いただいた内容を承りました。面談日程は現時点では仮予約です。担当者からの事前確認のお電話をもって確定となります。",
      linkText: "資産形成のeBookを見る",
      linkUrl: "https://library.jpreturns.com/",
      restart: "最初から入力する"
    },
    footer: {
      copyright: "© J.P.RETURNS",
      contact: "お問い合わせ 0120-147-104"
    },
    common: {
      required: "必須",
      multiChoice: "複数選択可",
      back: "前の画面に戻る",
      nextArrow: "→",
      externalArrow: "↗",
      sending: "送信しています…",
      familyNameLabel: "姓",
      givenNameLabel: "名"
    },
    calendar: {
      timeColumn: "時間",
      weekdays: ["日", "月", "火", "水", "木", "金", "土"],
      previousWeek: "前の7日間",
      nextWeek: "次の7日間",
      previousArrow: "‹",
      nextArrow: "›",
      availableMark: "○",
      unavailableMark: "×",
      sameMonth: "{year}年 {month}月",
      monthRange: "{startMonth}月 ～ {endMonth}月",
      dayLabel: "{month}月{day}日({weekday}) {time}",
      weekdayLabel: "({weekday})",
      selected: "選択中：",
      otherValue: "その他の時間"
    },
    errors: {
      name: "姓・名の両方を入力してください。",
      phone: "電話番号を正しく入力してください。",
      email: "メールアドレスを正しく入力してください。",
      choice: "{label}を選択してください。",
      required: "{label}を入力してください。",
      appointmentRequired: "{label}の日時を選択してください。",
      otherTimeRequired: "{label}の希望時間を入力してください。",
      duplicateAppointment: "第1希望・第2希望は異なる日時を選択してください。",
      network: "通信エラーが発生しました。時間をおいて再度お試しください。"
    }
  },

  steps: [
    {
      step: 1,
      progressLabel: "基本情報",
      trackingName: "basic_info",
      title: "お客様情報",
      nextButton: "次へ進む",
      fields: [
        {
          id: "name", label: "お名前", type: "name", required: true,
          inputs: [
            {id:"familyName",name:"family-name",key:"last_name",label:"姓",placeholder:"姓　山田",autocomplete:"family-name"},
            {id:"givenName",name:"given-name",key:"first_name",label:"名",placeholder:"名　太郎",autocomplete:"given-name"}
          ]
        },
        {id:"phone",label:"電話番号",key:"phone_number",type:"tel",name:"tel",autocomplete:"tel",placeholder:"09012345678",required:true},
        {id:"email",label:"メールアドレス",key:"email_address",type:"email",name:"email",autocomplete:"email",placeholder:"example@email.com",required:true}
      ]
    },
    {
      step: 2,
      progressLabel: "年収・年齢",
      trackingName: "income_age",
      title: "年収・年齢について",
      nextButton: "同意して送信",
      fields: [
        {id:"annual_income",containerId:"annualIncome",label:"ご年収",type:"choice",multiple:false,required:true,options:[
          {label:"700万～",value:"700～799万"},
          {label:"800万～",value:"800～899万"},
          {label:"900万～",value:"900～999万"},
          {label:"1000万～",value:"1000～1099万"},
          {label:"1500万～",value:"1500～1999万"},
          {label:"2000万～",value:"2000～2499万"},
          {label:"3000万～",value:"3000～3999万"},
          {label:"5000万～",value:"5000万～1億未満"}
        ]},
        {id:"age_group",containerId:"ageGroup",label:"ご年齢",type:"choice",multiple:false,required:true,options:[
          {label:"22～24歳",value:"20～24歳"},
          {label:"25～29歳",value:"25～29歳"},
          {label:"30～34歳",value:"30～34歳"},
          {label:"35～39歳",value:"35～39歳"},
          {label:"40～44歳",value:"40～44歳"},
          {label:"45～49歳",value:"45～49歳"},
          {label:"50～54歳",value:"50～54歳"},
          {label:"55～59歳",value:"55～59歳"},
          {label:"60歳～",value:"60～64歳"}
        ]}
      ]
    }
  ],

  appointments: [
    {
      id:"first",label:"第1希望",title:"第1希望日時",
      note:"ご希望の日付と時間帯をお選びください。",
      tableId:"timeTable1",otherId:"timeOther1",
      otherPlaceholder:"ご希望の時間帯をご入力ください",
      otherAriaLabel:"第1希望 その他の時間",
      dateKey:"first_choice_date",timeKey:"first_choice_time",otherKey:"first_choice_time_other"
    },
    {
      id:"second",label:"第2希望",title:"第2希望日時",
      note:"第1希望と異なる日時をご選択ください。",
      tableId:"timeTable2",otherId:"timeOther2",
      otherPlaceholder:"ご希望の時間帯をご入力ください",
      otherAriaLabel:"第2希望 その他の時間",
      dateKey:"second_choice_date",timeKey:"second_choice_time",otherKey:"second_choice_time_other"
    }
  ],
  timeSlots: [
    {label:"10:00～",value:"10：00～12：00",hour:10},
    {label:"12:00～",value:"12：00～14：00",hour:12},
    {label:"14:00～",value:"14：00～16：00",hour:14},
    {label:"16:00～",value:"16：00～18：00",hour:16},
    {label:"18:00～",value:"18：00～20：00",hour:18},
    {label:"20:00～",value:"20：00 以降",hour:20},
    {label:"その他",value:"その他の時間",hour:null}
  ]
});
