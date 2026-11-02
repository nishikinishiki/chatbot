"use strict";

/* 入力設問・選択肢：question.js / GAS：既存 tob/salesforce と同じ送信仕様 */
const QUESTIONS = window.FORM_QUESTIONS;
if (!QUESTIONS) throw new Error("question.js を読み込めませんでした。");
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxFiCz5dYlDo2c-JXyB6oogZfy6x7qiVYaiBF2-hnHdW_rCFAD4XFyeQ4xP28CRxm2F/exec";
const FORM_VARIANT = location.pathname;
const COPY=QUESTIONS.copy;
const STEP_LABELS=Object.fromEntries(QUESTIONS.steps.map(step=>[step.step,step.trackingName]));
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

/* question.jsの内容をDOMへ反映。HTMLにはユーザー向けの文言を置かない。 */
function byId(id){const el=document.getElementById(id);if(!el)throw Error("Missing UI element: "+id);return el;}
function textAt(id,text){byId(id).textContent=text??"";}
function phrase(pattern,values={}){return String(pattern).replace(/\{([a-zA-Z]+)\}/g,(_,key)=>String(values[key]??""));}
function linesAt(id,lines){const el=byId(id);el.replaceChildren();(Array.isArray(lines)?lines:[lines]).forEach((x,i)=>{if(i)el.append(document.createElement("br"));el.append(document.createTextNode(x));});}
function buttonLabel(el,label,arrow){
  el.textContent=label;el.dataset.label=label;
  if(arrow){const i=document.createElement("span");i.setAttribute("aria-hidden","true");i.textContent=arrow;el.append(" ",i);el.dataset.arrow=arrow;}
}
function headerLabel(number,title,id){
  const el=document.createElement("div");el.className="section-label";
  const badge=document.createElement("span");badge.textContent=String(number).padStart(2,"0");
  const h=document.createElement("h2");h.textContent=title;if(id){h.id=id;h.tabIndex=-1;}
  el.append(badge,h);return el;
}
function applyPageCopy(){
  const p=QUESTIONS.page,c=COPY;
  document.title=p.title;byId("metaDescription").content=p.description;byId("favicon").href=p.favicon;
  byId("visualImage").src=p.heroImage;byId("visualImage").alt=p.heroAlt;
  byId("visualPane").setAttribute("aria-label",c.accessibility.visualPane);
  byId("formPane").setAttribute("aria-label",c.accessibility.formPane);
  byId("initialStep").setAttribute("aria-label",c.accessibility.initialPage);
  byId("stepper").setAttribute("aria-label",c.accessibility.progressNav);
  textAt("brandMark",c.branding.symbol);textAt("brandName",c.branding.name);textAt("brandCaption",c.branding.caption);
  textAt("leadEyebrow",c.lead.eyebrow);textAt("leadHeading",c.lead.heading);textAt("leadIntro",c.lead.intro);
  textAt("appointmentEyebrow",c.appointment.eyebrow);textAt("appointmentHeading",c.appointment.heading);
  linesAt("appointmentIntro",c.appointment.intro);
  buttonLabel(byId("appointmentSubmit"),c.appointment.submit,c.common.nextArrow);
  textAt("completeIcon",c.completion.symbol);textAt("completeHeading",c.completion.heading);
  textAt("completeIntro",c.completion.intro);
  const book=byId("completeLink");book.href=c.completion.linkUrl;
  buttonLabel(book,c.completion.linkText,c.common.externalArrow);
  textAt("restartButton",c.completion.restart);
  const contact=document.createElement("span");contact.textContent=c.footer.contact;
  byId("siteFooter").replaceChildren(document.createTextNode(c.footer.copyright+" "),contact);
}
function makePrivacy(){
  const p=document.createElement("p");p.className="consent-notice";
  const link=document.createElement("a");link.href=COPY.privacy.linkUrl;
  link.target="_blank";link.rel="noopener noreferrer";link.textContent=COPY.privacy.linkText;
  p.append(document.createTextNode(COPY.privacy.before),link,document.createTextNode(COPY.privacy.after));
  return p;
}
function renderStepStructure(){
  const nav=byId("stepperList"),host=byId("panelStage");nav.replaceChildren();host.replaceChildren();
  QUESTIONS.steps.forEach((step,index)=>{
    const next=QUESTIONS.steps[index+1],last=!next;
    const li=document.createElement("li");li.dataset.progressStep=String(step.step);
    if(index===0)li.setAttribute("aria-current","step");
    const n=document.createElement("span");n.className="stepper-number";n.textContent=String(step.step).padStart(2,"0");
    const l=document.createElement("span");l.className="stepper-name";l.textContent=step.progressLabel;
    li.append(n,l);nav.append(li);
    const panel=document.createElement("section");panel.className="form-panel"+(index===0?" is-active":"");
    panel.dataset.formStep=String(step.step);panel.setAttribute("aria-labelledby","stepTitle"+step.step);panel.hidden=index!==0;
    const fields=document.createElement("div");fields.id="stepFields"+step.step;
    const err=document.createElement("p");err.id="stepError"+step.step;err.className="error-message";
    err.setAttribute("role","alert");err.setAttribute("aria-live","polite");
    const action=document.createElement("button");action.className="primary-button";action.type=last?"submit":"button";
    buttonLabel(action,step.nextButton,COPY.common.nextArrow);
    if(next){action.id="nextTo"+next.step;action.addEventListener("click",()=>advanceStep(step.step,next.step));}
    panel.append(headerLabel(step.step,step.title,"stepTitle"+step.step),fields);
    if(last)panel.append(makePrivacy());
    panel.append(err,action);
    if(index>0){
      const back=document.createElement("button");back.type="button";back.className="secondary-button";
      back.dataset.backStep=String(QUESTIONS.steps[index-1].step);back.textContent=COPY.common.back;
      back.addEventListener("click",()=>{setStepError(step.step,"");showFormStep(QUESTIONS.steps[index-1].step);});
      panel.append(back);
    }
    host.append(panel);
  });
}
function renderAppointmentStructure(){
  const host=byId("appointmentSections");host.replaceChildren();
  QUESTIONS.appointments.forEach((q,index)=>{
    const section=document.createElement("div");section.className="appointment-section";
    const note=document.createElement("p");note.className="appointment-note";note.textContent=q.note;
    const table=document.createElement("div");table.id=q.tableId;table.className="time-table-container";
    table.setAttribute("aria-label",q.title);
    const other=document.createElement("input");other.id=q.otherId;other.className="other-time";
    other.type="text";other.maxLength=120;other.placeholder=q.otherPlaceholder;
    other.setAttribute("aria-label",q.otherAriaLabel);other.hidden=true;
    section.append(headerLabel(index+1,q.title),note,table,other);host.append(section);
  });
}
function requiredMark(){
  const el=document.createElement("span");el.className="required";el.textContent=COPY.common.required;return el;
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
    input.setAttribute("aria-label",item.label);
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
    const small=document.createElement("small");small.textContent=COPY.common.multiChoice;label.append(small);
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
        if(option.value===field.exclusiveValue){
          const alreadySelected=values.has(option.value);
          values.clear();if(!alreadySelected)values.add(option.value);
        }else{
          if(field.exclusiveValue)values.delete(field.exclusiveValue);
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
        throw new Error(COPY.errors.name);
    }else if(field.type==="tel"){
      if(!validatePhone(normalizePhone(document.getElementById(field.id).value)))
        throw new Error(COPY.errors.phone);
    }else if(field.type==="email"){
      if(!validateEmail(document.getElementById(field.id).value.trim()))
        throw new Error(COPY.errors.email);
    }else if(field.type==="choice" && field.required && !selections[field.id].size){
      throw new Error(phrase(COPY.errors.choice,{label:field.label}));
    }else if(field.type!=="choice" && field.required && !document.getElementById(field.id).value.trim()){
      throw new Error(phrase(COPY.errors.required,{label:field.label}));
    }
  }
}
function collectLead(){
  for(const step of QUESTIONS.steps)validateFormStep(step.step);
  const result={...utmParameters};
  // GASへの送信キーはquestion.jsに記載した各フィールドのkey/idを使用する。
  for(const step of QUESTIONS.steps){
    for(const field of step.fields){
      if(field.type==="name"){
        for(const input of field.inputs){
          result[input.key]=document.getElementById(input.id).value.trim();
        }
      }else if(field.type==="choice"){
        const selected=[...selections[field.id]];
        result[field.key||field.id]=field.multiple?selected.join(";"):selected[0];
      }else{
        const value=document.getElementById(field.id).value.trim();
        result[field.key||field.id]=field.type==="tel"?normalizePhone(value):value;
      }
    }
  }
  return result;
}
function scrollToFormTop(){
  const pane=document.querySelector(".form-pane");
  if(window.matchMedia("(max-width: 900px)").matches)
    pane.scrollIntoView({behavior:"smooth",block:"start"});
  else pane.scrollTo({top:0,behavior:"smooth"});
}
function updateProgress(){
  document.getElementById("progressFill").style.width=((QUESTIONS.steps.length>1?(activeStep-1)/(QUESTIONS.steps.length-1):1)*100)+"%";
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
  button.disabled=busy;
  if(busy)button.textContent=textWhenBusy;
  else buttonLabel(button,button.dataset.label,button.dataset.arrow);
}

/* 日付×時間帯の選択表：既存版と同じ7日×7時間帯 */
const WEEKDAYS=COPY.calendar.weekdays;
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
  prev.textContent=COPY.calendar.previousArrow;prev.disabled=start<=todayMidnight();
  prev.setAttribute("aria-label",COPY.calendar.previousWeek);
  prev.addEventListener("click",()=>changeStartDate(choice,-7));
  const heading=document.createElement("span");heading.className="time-table-month";
  const end=new Date(start);end.setDate(end.getDate()+6);
  heading.textContent=start.getMonth()===end.getMonth()
    ?phrase(COPY.calendar.sameMonth,{year:start.getFullYear(),month:start.getMonth()+1})
    :phrase(COPY.calendar.monthRange,{startMonth:start.getMonth()+1,endMonth:end.getMonth()+1});
  const next=document.createElement("button");next.type="button";next.className="time-table-nav";
  next.textContent=COPY.calendar.nextArrow;next.setAttribute("aria-label",COPY.calendar.nextWeek);
  next.addEventListener("click",()=>changeStartDate(choice,7));
  nav.append(prev,heading,next);

  const scroll=document.createElement("div");scroll.className="time-table-scroll";
  const table=document.createElement("table");table.className="time-table";
  const thead=table.createTHead(),tr=thead.insertRow();
  const corner=document.createElement("th");corner.scope="col";corner.textContent=COPY.calendar.timeColumn;tr.append(corner);
  const dates=Array.from({length:7},(_,i)=>{
    const d=new Date(start);d.setDate(d.getDate()+i);return d;
  });
  for(const date of dates){
    const th=document.createElement("th");th.scope="col";
    if(date.getDay()===0)th.classList.add("sunday");
    if(date.getDay()===6)th.classList.add("saturday");
    th.append(document.createTextNode(String(date.getDate())));
    const weekday=document.createElement("span");weekday.textContent=phrase(COPY.calendar.weekdayLabel,{weekday:WEEKDAYS[date.getDay()]});
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
      button.textContent=disabled?COPY.calendar.unavailableMark:COPY.calendar.availableMark;
      button.setAttribute("aria-label",phrase(COPY.calendar.dayLabel,{month:date.getMonth()+1,day:date.getDate(),weekday:WEEKDAYS[date.getDay()],time:slot.label}));
      const chosen=appointmentSelections[choice];
      const pressed=chosen && chosen.date===dateKey(date) && chosen.time===slot.value;
      button.setAttribute("aria-pressed",String(!!pressed));
      if(pressed)button.classList.add("selected");
      button.addEventListener("click",()=>{
        appointmentSelections[choice]={date:dateKey(date),time:slot.value};
        const other=document.getElementById(q.otherId);
        other.hidden=slot.value!==COPY.calendar.otherValue;
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
    info.textContent=COPY.calendar.selected+appointmentSelections[choice].date+" "+QUESTIONS.timeSlots.find(s=>s.value===appointmentSelections[choice].time).label;
    container.append(info);
  }
}
function collectAppointment(){
  const data={};
  const selected=[];
  for(const q of QUESTIONS.appointments){
    const current=appointmentSelections[q.id];
    if(!current)throw new Error(phrase(COPY.errors.appointmentRequired,{label:q.label}));
    const otherInput=document.getElementById(q.otherId);
    const otherValue=current.time===COPY.calendar.otherValue?otherInput.value.trim():"";
    if(current.time===COPY.calendar.otherValue&&!otherValue)throw new Error(phrase(COPY.errors.otherTimeRequired,{label:q.label}));
    data[q.dateKey]=current.date;data[q.timeKey]=current.time;
    if(current.time===COPY.calendar.otherValue)data[q.otherKey]=otherValue;
    selected.push({date:current.date,time:current.time,other:otherValue});
  }
  if(selected[0].date===selected[1].date&&selected[0].time===selected[1].time&&selected[0].other===selected[1].other)
    throw new Error(COPY.errors.duplicateAppointment);
  return data;
}
function init(){
  applyPageCopy();
  renderStepStructure();
  renderQuestions();
  renderAppointmentStructure();
  for(const q of QUESTIONS.appointments)renderTimeTable(q.id);
  updateProgress();trackStepView(1);
  document.getElementById("leadForm").addEventListener("submit",async event=>{
    event.preventDefault();
    if(stepTransitioning||leadSending)return;
    if(activeStep!==QUESTIONS.steps.length)return;
    const finalStep=QUESTIONS.steps[QUESTIONS.steps.length-1].step;
    setStepError(finalStep,"");
    try{
      leadData=collectLead();
      if(leadSubmitted){setPage("appointmentStep");return;}
      leadSending=true;
      const button=event.submitter||document.querySelector('#leadForm button[type="submit"]');
      setBusy(button,true,COPY.common.sending);
      try{
        await sendToGas(leadData,false);
        leadSubmitted=true;
        trackStepComplete(finalStep);
        publishLeadTracking(leadData);
        setPage("appointmentStep");
      }catch(err){
        console.error("Lead submission failed",err);
        setStepError(finalStep,COPY.errors.network);
      }finally{
        leadSending=false;setBusy(button,false);
      }
    }catch(err){setStepError(finalStep,err.message);}
  });
  document.getElementById("appointmentForm").addEventListener("submit",async event=>{
    event.preventDefault();
    if(appointmentSending||appointmentSubmitted)return;
    const error=document.getElementById("appointmentError");error.textContent="";
    try{
      const payload=collectAppointment();
      appointmentSending=true;
      const button=event.submitter||document.querySelector('#appointmentForm button[type="submit"]');
      setBusy(button,true,COPY.common.sending);
      try{
        await sendToGas(payload,true);
        appointmentSubmitted=true;
        setPage("completeStep");
      }catch(err){
        console.error("Appointment submission failed",err);
        error.textContent=COPY.errors.network;
        trackEvent("form_appointment_submission_error");
      }finally{
        appointmentSending=false;setBusy(button,false);
      }
    }catch(err){error.textContent=err.message;}
  });
  document.getElementById("restartButton").addEventListener("click",()=>location.reload());
}
init();
