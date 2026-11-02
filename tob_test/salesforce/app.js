"use strict";
// テストページのため、本番へのGAS送信/GTM送信を行わない。
// 本番切替時は別途レビュー・検証が必要です。
const PREVIEW_ONLY = true;
const GAS_WEB_APP_URL = ""; // 意図的に未設定。公開テストから本番GASを呼ばない。
const FORM_VARIANT = location.pathname;
const params = new URLSearchParams(location.search);
const utmKeys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","yclid","fbclid"];
const utmParameters = Object.fromEntries(utmKeys.filter(k=>params.has(k)).map(k=>[k,params.get(k)]));
const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2,15);

const OPTIONS = {
 annual_income: [
  ["700万～","700～799万"],["800万～","800～899万"],["900万～","900～999万"],
  ["1000万～","1000～1099万"],["1500万～","1500～1999万"],["2000万～","2000～2499万"],
  ["3000万～","3000～3999万"],["5000万～","5000万～1億未満"]
 ],
 theme: [
  ["所得税・住民税の節税対策","所得税・住民税などの節税対策"],
  ["インフレ時代の資産防衛術","インフレ時代の資産防衛術"],
  ["老後資金の確保","老後資金の確保"],["家計・生命保険の見直し","家計・生命保険の見直し"]
 ],
 investment: [
  ["株式・投資信託","株式・投資信託"],["新NISA","新NISA"],["iDECO・企業型DC","iDECO・企業型DC"],
  ["外貨預金","外貨預金"],["不動産投資","不動産投資"],["その他","その他"],["特になし","特になし"]
 ],
 age_group: [
  ["22～24歳","20～24歳"],["25～29歳","25～29歳"],["30～34歳","30～34歳"],
  ["35～39歳","35～39歳"],["40～44歳","40～44歳"],["45～49歳","45～49歳"],
  ["50～54歳","50～54歳"],["55～59歳","55～59歳"],["60歳～","60～64歳"]
 ]
};
const TIME_SLOTS=[
 ["10:00～","10：00～12：00"],["12:00～","12：00～14：00"],
 ["14:00～","14：00～16：00"],["16:00～","16：00～18：00"],
 ["18:00～","18：00～20：00"],["20:00～","20：00 以降"],
 ["その他","その他の時間"]
];
const selections={annual_income:new Set(),theme:new Set(),investment:new Set(),age_group:new Set()};
const groups={
 annual_income:document.querySelector("#annualIncome .choices"),
 theme:document.querySelector("#theme .choices"),
 investment:document.querySelector("#investment .choices"),
 age_group:document.querySelector("#ageGroup .choices")
};
function addOptionButtons(){
 Object.entries(groups).forEach(([key,group])=>{
  OPTIONS[key].forEach(([label,value])=>{
   const button=document.createElement("button");
   button.type="button";button.className="choice-button";button.textContent=label;button.dataset.value=value;
   button.setAttribute("aria-pressed","false");
   button.addEventListener("click",()=>{
    const selected=selections[key];
    if(key==="investment"){
     if(value==="特になし") selected.clear();
     else selected.delete("特になし");
     if(selected.has(value))selected.delete(value);else selected.add(value);
    }else{
     selected.clear();selected.add(value);
    }
    for(const b of group.querySelectorAll("button"))b.setAttribute("aria-pressed",String(selected.has(b.dataset.value)));
    document.getElementById("leadError").textContent="";
   });
   group.append(button);
  });
 });
}
function normalizePhone(value){
 let digits=value.trim().replace(/[ー－‐\-\s]/g,"");
 if(digits.startsWith("+81"))digits="0"+digits.slice(3);
 else if(digits.startsWith("81")&&digits.length>=12)digits="0"+digits.slice(2);
 return digits;
}
function validatePhone(value){return /^0\d{9,10}$/.test(value)&&!(/^(.)\1+$/.test(value));}
function validateEmail(value){return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:\.[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)*\.[a-zA-Z]{2,}$/.test(value)&&!value.includes("..");}
let leadData=null;
function collectLead(){
 const lastName=document.getElementById("familyName").value.trim();
 const firstName=document.getElementById("givenName").value.trim();
 const phone=normalizePhone(document.getElementById("phone").value);
 const email=document.getElementById("email").value.trim();
 if(!lastName||!firstName)throw new Error("姓・名の両方を入力してください。");
 if(!validatePhone(phone))throw new Error("電話番号を正しく入力してください。");
 if(!validateEmail(email))throw new Error("メールアドレスを正しく入力してください。");
 for(const key of Object.keys(selections)){
  if(selections[key].size===0){
   const labels={annual_income:"ご年収",theme:"関心のあるテーマ",investment:"ご経験のある投資",age_group:"ご年齢"};
   throw new Error(labels[key]+"を選択してください。");
  }
 }
 if(!document.getElementById("consent").checked)throw new Error("個人情報のお取り扱いへの同意をお願いします。");
 return {...utmParameters,last_name:lastName,first_name:firstName,phone_number:phone,email_address:email,
  annual_income:[...selections.annual_income][0],theme:[...selections.theme][0],
  investment:[...selections.investment].join(";"),age_group:[...selections.age_group][0]};
}
function setStep(id){
 for(const el of document.querySelectorAll(".step"))el.hidden=el.id!==id;
 document.querySelector(".form-pane").scrollTo({top:0,behavior:"instant"});
 if(window.innerWidth<=920)document.querySelector(".form-pane").scrollIntoView({behavior:"smooth",block:"start"});
}
function installTimeSlots(){
 for(const id of ["time1","time2"]){
  const select=document.getElementById(id);
  select.add(new Option("時間帯を選択してください",""));
  TIME_SLOTS.forEach(([label,value])=>select.add(new Option(label,value)));
  select.addEventListener("change",()=>{
   const other=document.getElementById(id==="time1"?"timeOther1":"timeOther2");
   other.hidden=select.value!=="その他の時間";
   other.required=!other.hidden;
   if(other.hidden)other.value="";
  });
 }
 // 日付は既存コードと同様、当日から14日先までを想定した入力UI。
 const now=new Date();
 const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
 const min=local.toISOString().slice(0,10);
 const future=new Date(local);future.setDate(future.getDate()+14);
 const max=future.toISOString().slice(0,10);
 for(const id of ["date1","date2"]){const input=document.getElementById(id);input.min=min;input.max=max;}
}
function appointmentPayload(){
 const d1=document.getElementById("date1").value,t1=document.getElementById("time1").value;
 const d2=document.getElementById("date2").value,t2=document.getElementById("time2").value;
 if(!d1||!t1||!d2||!t2)throw new Error("第1希望・第2希望の日時を選択してください。");
 const dateInputs=["date1","date2"];
 for(const id of dateInputs){const el=document.getElementById(id);if(!el.checkValidity())throw new Error("面談希望日は本日から14日以内で選択してください。");}
 const extra1=document.getElementById("timeOther1").value.trim();
 const extra2=document.getElementById("timeOther2").value.trim();
 if(t1==="その他の時間"&&!extra1)throw new Error("第1希望の時間を入力してください。");
 if(t2==="その他の時間"&&!extra2)throw new Error("第2希望の時間を入力してください。");
 if(d1===d2&&t1===t2&&(t1!=="その他の時間"||extra1===extra2))throw new Error("第1希望・第2希望は異なる日時を選択してください。");
 return {first_choice_date:d1.replaceAll("-","/"),first_choice_time:t1,
  ...(t1==="その他の時間"?{first_choice_time_other:extra1}:{}),
  second_choice_date:d2.replaceAll("-","/"),second_choice_time:t2,
  ...(t2==="その他の時間"?{second_choice_time_other:extra2}:{})};
}
document.getElementById("leadForm").addEventListener("submit",(event)=>{
 event.preventDefault();
 const error=document.getElementById("leadError");error.textContent="";
 try{
  leadData=collectLead();
  // GASとGTMは一切呼ばない。個人情報はブラウザ内のみで保持。
  setStep("appointmentStep");
 }catch(err){error.textContent=err.message;}
});
document.getElementById("appointmentForm").addEventListener("submit",(event)=>{
 event.preventDefault();
 const error=document.getElementById("appointmentError");error.textContent="";
 try{
  const dateData=appointmentPayload();
  // GASへの追加送信の形式は既存実装と同じフィールド名を維持。
  // 現在は画面フローの検証のみ。データは外部へ送信しない。
  void {...leadData,...dateData,"Session ID":sessionId};
  setStep("completeStep");
 }catch(err){error.textContent=err.message;}
});
document.getElementById("backButton").addEventListener("click",()=>setStep("initialStep"));
document.getElementById("restartButton").addEventListener("click",()=>location.reload());
addOptionButtons();installTimeSlots();
