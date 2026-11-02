"use strict";

/* 入力設問・選択肢：question.js / GAS：既存 tob/salesforce と同じ送信仕様 */
const QUESTIONS = window.FORM_QUESTIONS;
if (!QUESTIONS) throw new Error("question.js を読み込めませんでした。");
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxFiCz5dYlDo2c-JXyB6oogZfy6x7qiVYaiBF2-hnHdW_rCFAD4XFyeQ4xP28CRxm2F/exec";
const FORM_VARIANT = location.pathname;
const STEP_LABELS = {1:"basic_info",2:"income_age"};
const URL_PARAMS = new URLSearchParams(location.search);
const UTM_KEYS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","yclid","fbclid"];
const utmParameters = Object.fromEntries(UTM_KEYS.filter(k=>URL_PARAMS.has(k)).map(k=>[k,URL_PARAMS.get(k)]));
const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2,15);

window.dataLayer = window.dataLayer || [];
const selections = Object.create(null);
for(const step of QUESTIONS.steps) {
  for(const field of step.fields) {
    if(field.type==="choice")selections[field.id]=new Set();
  }
}
const appointmentSelections = {first:null,second:null};
const appointmentStart = {first:todayMidnight(),second:todayMidnight()};
let activeStep=1, stepTransitioning=false;
let leadData=null,leadSubmitted=false,appointmentSubmitted=false;
let leadSending=false,appointmentSending=false;

function trackEvent(event,detail={}) {
  window.dataLayer.push({event,form_variant:FORM_VARIANT,...detail});
}
function trackStepView(step) {
  trackEvent("form_step_view",{step_number:step,step_name:STEP_LABELS[step]});
}
function trackStepComplete(step) {
  trackEvent("form_step_complete",{step_number:step,step_name:STEP_LABELS[step]});
}
function requiredMark(){
  const el=document.createElement("span");el.className="required";el.textContent="必須";return el;
}
function fieldLabel(field,targetId){
  const label=document.createElement("label");
  label.className="field-label";
  label.htmlFor=targetId;
  label.append(document.createTextNode(field.label+" "));
  if(field.required)label.append(requiredMark());
  return label;
}
function renderNameField(field,parent){
  const outer=document.createElement("div");outer.className="field";
  outer.append(fieldLabel(field,field.inputs[0].id));
  const pair=document.createElement("div");pair.className="two-fields";
  for(const item of field.inputs) {
    const input=document.createElement("input");input.type="text";
    input.id=item.id;input.name=item.name;input.placeholder=item.placeholder;
    input.autocomplete=item.autocomplete;input.maxLength=100;input.required=true;
    input.setAttribute("aria-label",item.id==="familyName"?"姓":"名");
    pair.append(input);
  }
  outer.append(pair);parent.append(outer);
}
function renderTextField(field,parent){
  const outer=document.createElement("div");outer.className="field";
  outer.append(fieldLabel(field,field.id));
  const input=document.createElement("input");input.id=field.id;input.type=field.type;
  input.name=field.name;input.placeholder=field.placeholder;
  input.autocomplete=field.autocomplete;
  input.required=!!field.required;
  input.inputMode=field.type==="tel"?"tel":(field.type==="email"?"email":"text");
  outer.append(input);parent.append(outer);
}
function renderChoiceField(field,parent){
  const outer=document.createElement("div");outer.className="choice-field";outer.id=field.containerId;
  outer.dataset.group=field.id;
  const label=document.createElement("div");
  label.className="field-label";label.id=field.id+"Label";
  label.append(document.createTextNode(field.label+" "));
  if(field.required)label.append(requiredMark());
  if(field.multiple){
    const small=document.createElement("small");small.textContent="複数選択可";label.append(small);
  }
  const group=document.createElement("div");group.className="choices";
  group.setAttribute("role","group");group.setAttribute("aria-labelledby",label.id);
  for(const option of field.options){
    const button=document.createElement("button");
    button.type="button";button.className="choice-button";button.textContent=option.label;
    button.dataset.value=option.value;
    button.setAttribute("aria-pressed","false");
    button.addEventListener("click",()=>{
      const values=selections[field.id];
      if(field.multiple){
        if(option.value==="特になし"){
          const alreadySelected=values.has(option.value);
          values.clear();if(!alreadySelected)values.add(option.value);
        }else{
          values.delete("特になし");
          if(values.has(option.value))values.delete(option.value);
          else values.add(option.value);
        }
      }else{
        values.clear();values.add(option.value);
      }
      for(const b of group.querySelectorAll("button")){
        b.setAttribute("aria-pressed",String(values.has(b.dataset.value)));
      }
      setStepError(activeStep,"");
    });
    group.append(button);
  }
  outer.append(label,group);parent.append(outer);
}
function renderQuestions(){
  for(const step of QUESTIONS.steps){
    const root=document.getElementById("stepFields"+step.step);
    if(!root)throw new Error("質問フォームの配置先がありません: "+step.step);
    for(const field of step.fields){
      if(field.type==="name")renderNameField(field,root);
      else if(field.type==="choice")renderChoiceField(field,root);
      else renderTextField(field,root);
    }
  }
}
function normalizePhone(value){
  let digits=value.trim().replace(/[ー－‐\-\s]/g,"");
  if(digits.startsWith("+81"))digits="0"+digits.slice(3);
  else if(digits.startsWith("81")&&digits.length>=12)digits="0"+digits.slice(2);
  return digits;
}
function validatePhone(value){return /^0\d{9,10}$/.test(value)&&!(/^(.)\1+$/.test(value));}
function validateEmail(value){
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*(?:\.[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)*\.[a-zA-Z]{2,}$/.test(value)&&!value.includes("..");
}
function setStepError(step,message){
  document.getElementById("stepError"+step).textContent=message;
  if(message)trackEvent("form_step_validation_error",{step_number:step,step_name:STEP_LABELS[step]});
}
function validateFormStep(stepNumber){
  const step=QUESTIONS.steps.find(s=>s.step===stepNumber);
  for(const field of step.fields){
    if(field.type==="name"){
      if(field.inputs.some(item=>!document.getElementById(item.id).value.trim()))
        throw new Error("姓・名の両方を入力してください。");
    }else if(field.type==="tel"){
      if(!validatePhone(normalizePhone(document.getElementById(field.id).value)))
        throw new Error("電話番号を正しく入力してください。");
    }else if(field.type==="email"){
      if(!validateEmail(document.getElementById(field.id).value.trim()))
        throw new Error("メールアドレスを正しく入力してください。");
    }else if(field.type==="choice" && field.required && !selections[field.id].size){
      throw new Error(field.label+"を選択してください。");
    }
  }
}
function collectLead(){
  for(const step of QUESTIONS.steps)validateFormStep(step.step);
  return {
    ...utmParameters,
    last_name:document.getElementById("familyName").value.trim(),
    first_name:document.getElementById("givenName").value.trim(),
    phone_number:normalizePhone(document.getElementById("phone").value),
    email_address:document.getElementById("email").value.trim(),
    annual_income:[...selections.annual_income][0],
    age_group:[...selections.age_group][0]
  };
}
function scrollToFormTop(){
  const pane=document.querySelector(".form-pane");
  if(window.matchMedia("(max-width: 900px)").matches)
    pane.scrollIntoView({behavior:"smooth",block:"start"});
  else pane.scrollTo({top:0,behavior:"smooth"});
}
function updateProgress(){
  document.getElementById("progressFill").style.width=(((activeStep-1)/(QUESTIONS.steps.length-1))*100)+"%";
  document.querySelectorAll("[data-progress-step]").forEach(node=>{
    const n=Number(node.dataset.progressStep);
    node.classList.toggle("is-done",n<activeStep);
    if(n===activeStep)node.setAttribute("aria-current","step");
    else node.removeAttribute("aria-current");
  });
}
function showFormStep(nextNumber){
  if(stepTransitioning||nextNumber===activeStep||nextNumber<1||nextNumber>QUESTIONS.steps.length)return;
  stepTransitioning=true;
  const old=document.querySelector('[data-form-step="'+activeStep+'"]');
  const next=document.querySelector('[data-form-step="'+nextNumber+'"]');
  const backwards=nextNumber<activeStep;
  const leavingClass=backwards?"is-leaving-back":"is-leaving";
  const enteringClass=backwards?"is-entering-left":"is-entering-right";
  old.classList.add(leavingClass);next.classList.add(enteringClass);next.hidden=false;
  activeStep=nextNumber;updateProgress();trackStepView(nextNumber);scrollToFormTop();
  requestAnimationFrame(()=>requestAnimationFrame(()=>next.classList.remove(enteringClass)));
  window.setTimeout(()=>{
    old.hidden=true;old.classList.remove(leavingClass);
    stepTransitioning=false;
    const title=document.getElementById("stepTitle"+nextNumber);
    if(title)title.focus({preventScroll:true});
  },320);
}
function advanceStep(from,to){
  if(stepTransitioning||leadSending)return;
  setStepError(from,"");
  try{validateFormStep(from);trackStepComplete(from);showFormStep(to);}
  catch(error){setStepError(from,error.message);}
}
function setPage(id){
  for(const el of document.querySelectorAll(".page-view"))el.hidden=el.id!==id;
  scrollToFormTop();
  if(id==="appointmentStep")trackEvent("form_appointment_view");
  if(id==="completeStep")trackEvent("form_appointment_complete");
}

/* GAS：本番と同じSession ID/追送信フラグ/ヘッダーを使用。
 * Google Apps Scriptのno-cors応答はopaqueでサーバー処理結果を確認できません。
 * fetchのrejectは検知できますが、resolveはDB書込成功の保証ではありません。 */
async function sendToGas(data,isAdditional){
  const payload={...data,"Session ID":sessionId};
  if(isAdditional)payload.isAdditionalData=true;
  await fetch(GAS_WEB_APP_URL,{
    method:"POST",mode:"no-cors",cache:"no-cache",
    headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify(payload)
  });
}
function publishLeadTracking(data){
  trackEvent("lead_attributes_ready",{
    lead_annual_income:data.annual_income,
    lead_age_group:data.age_group,
    lead_utm_source:utmParameters.utm_source,
    lead_utm_medium:utmParameters.utm_medium,
    lead_utm_campaign:utmParameters.utm_campaign,
    lead_form_variant:FORM_VARIANT
  });
  const phone=data.phone_number;
  const formatted=phone.startsWith("0")?"+81"+phone.substring(1):"+81"+phone;
  trackEvent("chat_form_submission_success",{
    user_data:{
      email:data.email_address,
      phone_number:formatted,
      address:{last_name:data.last_name,first_name:data.first_name}
    },
    modified_phone:phone.substring(3)
  });
}
function setBusy(button,busy,textWhenBusy){
  if(!button)return;
  if(!button.dataset.label)button.dataset.label=button.textContent;
  button.disabled=busy;
  button.textContent=busy?textWhenBusy:button.dataset.label;
}

/* 日付×時間帯の選択表：既存版と同じ7日×7時間帯 */
const WEEKDAYS=["日","月","火","水","木","金","土"];
function todayMidnight(){const d=new Date();d.setHours(0,0,0,0);return d;}
function dateKey(date){
  return date.getFullYear()+"/"+String(date.getMonth()+1).padStart(2,"0")+"/"+String(date.getDate()).padStart(2,"0");
}
function changeStartDate(choice,days){
  const next=new Date(appointmentStart[choice]);
  next.setDate(next.getDate()+days);
  if(next<todayMidnight())return;
  appointmentStart[choice]=next;renderTimeTable(choice);
}
function isUnavailable(date,slot){
  const today=todayMidnight();
  if(date<today)return true;
  if(date.getTime()===today.getTime() && slot.hour!==null) {
    return new Date().getHours()>=slot.hour;
  }
  return false;
}
function renderTimeTable(choice){
  const q=QUESTIONS.appointments.find(x=>x.id===choice);
  const container=document.getElementById(q.tableId);
  const priorScroll=container.querySelector(".time-table-scroll");
  const savedScrollLeft=priorScroll?priorScroll.scrollLeft:0;
  container.replaceChildren();
  const start=appointmentStart[choice];
  const nav=document.createElement("div");nav.className="time-table-header";
  const prev=document.createElement("button");prev.type="button";prev.className="time-table-nav";
  prev.textContent="‹";prev.disabled=start<=todayMidnight();
  prev.setAttribute("aria-label","前の7日間");
  prev.addEventListener("click",()=>changeStartDate(choice,-7));
  const heading=document.createElement("span");heading.className="time-table-month";
  const end=new Date(start);end.setDate(end.getDate()+6);
  heading.textContent=(start.getMonth()===end.getMonth()
    ?start.getFullYear()+"年 "+(start.getMonth()+1)+"月"
    :String(start.getMonth()+1)+"月 ～ "+String(end.getMonth()+1)+"月");
  const next=document.createElement("button");next.type="button";next.className="time-table-nav";
  next.textContent="›";next.setAttribute("aria-label","次の7日間");
  next.addEventListener("click",()=>changeStartDate(choice,7));
  nav.append(prev,heading,next);

  const scroll=document.createElement("div");scroll.className="time-table-scroll";
  const table=document.createElement("table");table.className="time-table";
  const thead=table.createTHead(),tr=thead.insertRow();
  const corner=document.createElement("th");corner.scope="col";corner.textContent="時間";tr.append(corner);
  const dates=Array.from({length:7},(_,i)=>{
    const d=new Date(start);d.setDate(d.getDate()+i);return d;
  });
  for(const date of dates){
    const th=document.createElement("th");th.scope="col";
    if(date.getDay()===0)th.classList.add("sunday");
    if(date.getDay()===6)th.classList.add("saturday");
    th.append(document.createTextNode(String(date.getDate())));
    const weekday=document.createElement("span");weekday.textContent="("+WEEKDAYS[date.getDay()]+")";
    th.append(weekday);tr.append(th);
  }
  const tbody=table.createTBody();
  for(const slot of QUESTIONS.timeSlots){
    const row=tbody.insertRow();
    const label=document.createElement("th");label.scope="row";label.className="time-label";label.textContent=slot.label;
    row.append(label);
    for(const date of dates){
      const cell=row.insertCell();cell.className="time-slot-cell";
      const button=document.createElement("button");button.type="button";button.className="time-slot-button";
      const disabled=isUnavailable(date,slot);
      button.disabled=disabled;
      button.textContent=disabled?"×":"○";
      button.setAttribute("aria-label",date.getMonth()+1+"月"+date.getDate()+"日("+WEEKDAYS[date.getDay()]+") "+slot.label);
      const chosen=appointmentSelections[choice];
      const pressed=chosen && chosen.date===dateKey(date) && chosen.time===slot.value;
      button.setAttribute("aria-pressed",String(!!pressed));
      if(pressed)button.classList.add("selected");
      button.addEventListener("click",()=>{
        appointmentSelections[choice]={date:dateKey(date),time:slot.value};
        const other=document.getElementById(q.otherId);
        other.hidden=slot.value!=="その他の時間";
        if(other.hidden)other.value="";
        other.required=!other.hidden;
        document.getElementById("appointmentError").textContent="";
        renderTimeTable(choice);
      });
      cell.append(button);
    }
  }
  scroll.append(table);container.append(nav,scroll);
  scroll.scrollLeft=savedScrollLeft;
  if(appointmentSelections[choice]){
    const info=document.createElement("p");info.className="time-table-picked";
    info.textContent="選択中："+appointmentSelections[choice].date+" "+QUESTIONS.timeSlots.find(s=>s.value===appointmentSelections[choice].time).label;
    container.append(info);
  }
}
function collectAppointment(){
  const data={};
  const selected=[];
  for(const q of QUESTIONS.appointments){
    const current=appointmentSelections[q.id];
    if(!current)throw new Error(q.label+"の日時を選択してください。");
    const otherInput=document.getElementById(q.otherId);
    const otherValue=current.time==="その他の時間"?otherInput.value.trim():"";
    if(current.time==="その他の時間"&&!otherValue)throw new Error(q.label+"の希望時間を入力してください。");
    data[q.dateKey]=current.date;data[q.timeKey]=current.time;
    if(current.time==="その他の時間")data[q.otherKey]=otherValue;
    selected.push({date:current.date,time:current.time,other:otherValue});
  }
  if(selected[0].date===selected[1].date&&selected[0].time===selected[1].time&&selected[0].other===selected[1].other)
    throw new Error("第1希望・第2希望は異なる日時を選択してください。");
  return data;
}
function applyPartnerBranding(){
  const name=typeof QUESTIONS.partnerName==="string" ? QUESTIONS.partnerName.trim() : "";
  const target=document.getElementById("partnerCompanyName");
  if(target)target.textContent=name||"Salesforce";
  if(name)document.title="【"+name+"様限定】無料個別相談｜J.P.RETURNS";
}
function init(){
  applyPartnerBranding();
  renderQuestions();
  for(const q of QUESTIONS.appointments)renderTimeTable(q.id);
  updateProgress();trackStepView(1);
  document.getElementById("nextTo2").addEventListener("click",()=>advanceStep(1,2));
  document.querySelectorAll("[data-back-step]").forEach(button=>button.addEventListener("click",()=>{
    const from=activeStep;setStepError(from,"");
    showFormStep(Number(button.dataset.backStep));
  }));
  document.getElementById("leadForm").addEventListener("submit",async event=>{
    event.preventDefault();
    if(stepTransitioning||leadSending)return;
    if(activeStep!==QUESTIONS.steps.length)return;
    setStepError(2,"");
    try{
      leadData=collectLead();
      if(leadSubmitted){setPage("appointmentStep");return;}
      leadSending=true;
      const button=event.submitter||document.querySelector('#leadForm button[type="submit"]');
      setBusy(button,true,"送信しています…");
      try{
        await sendToGas(leadData,false);
        leadSubmitted=true;
        trackStepComplete(2);
        publishLeadTracking(leadData);
        setPage("appointmentStep");
      }catch(err){
        console.error("Lead submission failed",err);
        setStepError(2,"通信エラーが発生しました。時間をおいて再度お試しください。");
      }finally{
        leadSending=false;setBusy(button,false);
      }
    }catch(err){setStepError(2,err.message);}
  });
  document.getElementById("appointmentForm").addEventListener("submit",async event=>{
    event.preventDefault();
    if(appointmentSending||appointmentSubmitted)return;
    const error=document.getElementById("appointmentError");error.textContent="";
    try{
      const payload=collectAppointment();
      appointmentSending=true;
      const button=event.submitter||document.querySelector('#appointmentForm button[type="submit"]');
      setBusy(button,true,"送信しています…");
      try{
        await sendToGas(payload,true);
        appointmentSubmitted=true;
        setPage("completeStep");
      }catch(err){
        console.error("Appointment submission failed",err);
        error.textContent="通信エラーが発生しました。時間をおいて再度お試しください。";
        trackEvent("form_appointment_submission_error");
      }finally{
        appointmentSending=false;setBusy(button,false);
      }
    }catch(err){error.textContent=err.message;}
  });
  document.getElementById("restartButton").addEventListener("click",()=>location.reload());
}
init();
