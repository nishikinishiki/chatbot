"use strict";

// 質問・選択肢はこのファイルのみで管理する。
// valueは既存 tob/salesforce/js/questions.js およびGASの受け取り値を踏襲。
window.FORM_QUESTIONS = Object.freeze({
  // 取引先名を変更する場合はこの1か所を書き換える。
  partnerName: "Salesforce",
  steps: [
    {
      step: 1, title: "お客様情報",
      fields: [
        {id:"name",label:"お名前",type:"name",required:true,inputs:[
          {id:"familyName",name:"family-name",key:"last_name",placeholder:"姓　山田",autocomplete:"family-name"},
          {id:"givenName",name:"given-name",key:"first_name",placeholder:"名　太郎",autocomplete:"given-name"}
        ]},
        {id:"phone",label:"電話番号",key:"phone_number",type:"tel",name:"tel",autocomplete:"tel",placeholder:"09012345678",required:true},
        {id:"email",label:"メールアドレス",key:"email_address",type:"email",name:"email",autocomplete:"email",placeholder:"example@email.com",required:true}
      ]
    },
    {
      step: 2, title:"年収・年齢について",
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
          {label:"22～24歳",value:"20～24歳"},{label:"25～29歳",value:"25～29歳"},
          {label:"30～34歳",value:"30～34歳"},{label:"35～39歳",value:"35～39歳"},
          {label:"40～44歳",value:"40～44歳"},{label:"45～49歳",value:"45～49歳"},
          {label:"50～54歳",value:"50～54歳"},{label:"55～59歳",value:"55～59歳"},
          {label:"60歳～",value:"60～64歳"}
        ]}
      ]
    }
  ],
  appointments: [
    {id:"first",label:"第1希望",tableId:"timeTable1",otherId:"timeOther1",
     dateKey:"first_choice_date",timeKey:"first_choice_time",otherKey:"first_choice_time_other"},
    {id:"second",label:"第2希望",tableId:"timeTable2",otherId:"timeOther2",
     dateKey:"second_choice_date",timeKey:"second_choice_time",otherKey:"second_choice_time_other"}
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
