// js/main.js
// アプリケーションのメインロジック

// --- アプリケーションの状態管理 ---
const state = {
    currentSessionId: '',
    currentFlow: 'initial',
    currentStep: 0,
    subStep: 0,
    userResponses: {},
    additionalUserResponses: {},
    utmParameters: {},
    completedEffectiveQuestions: 0,
    questions: [],
    gaStepCounter: 0,
    chatHistory: [],  
    isRestoring: false,
    waitingForInput: false // 増殖バグ防止用フラグ
};

// ==========================================
// ★ かご落ち対策のフックと保存・復元ロジック
// ==========================================

// ボットメッセージの保存
const originalAddBotMessage = addBotMessage;
addBotMessage = async function(text, isHtml = false, isError = false, isEbookBtn = false) {
    if (!state.isRestoring) {
        state.chatHistory.push({ sender: 'bot', text, isHtml, isError, isEbookBtn });
        saveState();
    }
    return await originalAddBotMessage(text, isHtml, isError, isEbookBtn);
};

// ユーザーメッセージの保存
const originalAddUserMessage = addUserMessage;
addUserMessage = function(text) {
    if (!state.isRestoring) {
        state.chatHistory.push({ sender: 'user', text });
        saveState();
    }
    return originalAddUserMessage(text);
};

function saveState() {
    if (state.isRestoring) return;
    const stateToSave = { ...state };
    delete stateToSave.questions;
    delete stateToSave.isRestoring;
    localStorage.setItem('jp_returns_chat_state', JSON.stringify(stateToSave));
}

function clearState() {
    localStorage.removeItem('jp_returns_chat_state');
}

// タイムラインへのシステムメッセージ挿入
function insertTimelineSystemMessage() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'system-timeline-message';
    wrapper.innerHTML = `
        <div class="system-timeline-message-content">
            <span>前回の回答の続きから表示しています。</span>
            <a href="#" onclick="window.resetChatAndReload(event)">最初から回答する</a>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
}

// リセット処理（アラートなし）
window.resetChatAndReload = function(e) {
    e.preventDefault();
    clearState();
    window.location.reload();
};

// --- GAイベント送信 ---
function sendGaEvent(question, answerValue) {
    if (!window.dataLayer) return;
    state.gaStepCounter++; 
    window.dataLayer.push({
        'event': 'question_answered',
        'form_variant': window.location.pathname,
        'step_number': state.gaStepCounter,
        'question_id': question.id.toString(), 
        'question_item': question.item,
        'answer_value': answerValue
    });
}

async function showSystemMessages(messageArray) {
    if (!messageArray || !Array.isArray(messageArray)) return;
    for (const msg of messageArray) {
        await addBotMessage(msg.text, msg.isHtml || false, msg.isError || false, msg.isEbookBtn || false);
    }
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', initializeChat);

async function initializeChat() {
    initializeUI();
    adjustChatHeight();
    window.addEventListener('resize', adjustChatHeight);
    window.addEventListener('orientationchange', adjustChatHeight);

    const savedStateJson = localStorage.getItem('jp_returns_chat_state');
    
    if (savedStateJson) {
        // 【復元フロー】
        const savedState = JSON.parse(savedStateJson);
        Object.assign(state, savedState);
        state.questions = state.currentFlow === 'initial' ? initialQuestions : additionalQuestions;
        
        const urlParams = new URLSearchParams(window.location.search);
        getUtmParameters(urlParams);
        Object.assign(state.userResponses, state.utmParameters);

        if (typeof FAVICON_URL !== 'undefined' && FAVICON_URL) {
            const faviconLink = document.createElement('link');
            faviconLink.rel = 'icon'; faviconLink.href = FAVICON_URL;
            document.head.appendChild(faviconLink);
        }
        if (typeof BANNER_IMAGE_URL !== 'undefined' && BANNER_IMAGE_URL) displayBannerImage(BANNER_IMAGE_URL);

        state.isRestoring = true;
        
        // 挿入位置の特定（最後のユーザー発言の直後）
        let sysMsgInsertIndex = 0;
        for (let i = state.chatHistory.length - 1; i >= 0; i--) {
            if (state.chatHistory[i].sender === 'user') {
                sysMsgInsertIndex = i + 1;
                break;
            }
        }

        for (let i = 0; i < state.chatHistory.length; i++) {
            if (i === sysMsgInsertIndex) insertTimelineSystemMessage();

            const msg = state.chatHistory[i];
            if (msg.sender === 'bot') {
                await originalAddBotMessage(msg.text, msg.isHtml, msg.isError, msg.isEbookBtn);
            } else if (msg.sender === 'user') {
                originalAddUserMessage(msg.text);
            }
        }
        
        if (sysMsgInsertIndex === state.chatHistory.length) insertTimelineSystemMessage();

        state.isRestoring = false;
        calculateProgress();
        setTimeout(askQuestion, 150);

    } else {
        // 【新規フロー】
        const urlParams = new URLSearchParams(window.location.search);
        getUtmParameters(urlParams);
        state.currentFlow = 'initial';
        state.questions = initialQuestions;
        Object.assign(state.userResponses, state.utmParameters);
        state.currentSessionId = generateSessionId();

        if (typeof FAVICON_URL !== 'undefined' && FAVICON_URL) {
            const faviconLink = document.createElement('link');
            faviconLink.rel = 'icon'; faviconLink.href = FAVICON_URL;
            document.head.appendChild(faviconLink);
        }
        if (typeof BANNER_IMAGE_URL !== 'undefined' && BANNER_IMAGE_URL) displayBannerImage(BANNER_IMAGE_URL);

        await showSystemMessages(SYSTEM_MESSAGES.welcome);
        setTimeout(askQuestion, 150);
    }
}

// --- メイン会話フロー ---
async function askQuestion() {
    calculateProgress();
    let currentQuestion = findNextQuestion();
    if (!currentQuestion) {
        handleFlowCompletion();
        return;
    }
    
    const wasWaiting = state.waitingForInput;

    if (!wasWaiting) {
        if (currentQuestion.pre_message) await addBotMessage(currentQuestion.pre_message, true);
        if (currentQuestion.question && currentQuestion.answer_method !== 'text-pair') {
            await addBotMessage(currentQuestion.question, currentQuestion.isHtmlQuestion);
        }
    }
    
    switch(currentQuestion.answer_method) {
        case 'single-choice':
            displayChoices(currentQuestion, (selection, container) => handleSingleChoice(currentQuestion, selection, container));
            state.waitingForInput = true; saveState(); 
            break;
        case 'multi-choice':
            displayMultiChoices(currentQuestion, (selections, container) => handleMultiChoice(currentQuestion, selections, container));
            state.waitingForInput = true; saveState();
            break;
        case 'text': case 'tel': case 'email':
             displayNormalInput(currentQuestion, { onSend: (value, container) => handleTextInput(currentQuestion, value, container) });
             state.waitingForInput = true; saveState();
            break;
        case 'text-pair':
            handlePairedQuestion(currentQuestion, wasWaiting);
            break;
        case 'time-table':
            displayTimeTable(currentQuestion, (value, container) => handleTimeTableInput(currentQuestion, value, container));
            state.waitingForInput = true; saveState();
            break;
        case 'final-consent':
             displayFinalConsentScreen(currentQuestion, state.userResponses, initialQuestions, (container) => {
                if (container) disableInputs(container);
                state.waitingForInput = false; 
                state.userResponses[currentQuestion.key] = true;
                sendGaEvent(currentQuestion, 'true');
                submitDataToGAS(state.userResponses, false);
             });
             state.waitingForInput = true; saveState();
            break;
        default:
            proceedToNextStep();
    }
}

function findNextQuestion() {
    while (state.currentStep < state.questions.length) {
        const q = state.questions[state.currentStep];
        if (q.condition && (state.currentFlow === 'initial' ? state.userResponses : state.additionalUserResponses)[q.condition.key] !== q.condition.value) {
            state.currentStep++;
            continue;
        }
        return q;
    }
    return null;
}

function handleFlowCompletion() {
    if (state.currentFlow === 'additional') submitDataToGAS(state.additionalUserResponses, true);
}

function proceedToNextStep() {
    state.completedEffectiveQuestions++;
    state.currentStep++;
    state.subStep = 0;
    saveState();
    setTimeout(askQuestion, 150);
}

function saveAndProceed(question, saveValue, displayLabel, container, gaValue = saveValue) {
    if (container) disableInputs(container);
    state.waitingForInput = false; 
    addUserMessage(displayLabel); 
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = saveValue;
    sendGaEvent(question, gaValue);
    proceedToNextStep();
}

function handleSingleChoice(question, selection, container) {
    if (!question.validation(selection.value)) return;
    saveAndProceed(question, selection.value, selection.label.replace(/<br>/g, ' '), container);
}

function handleMultiChoice(question, selections, container) {
    if (!question.validation(selections.values)) return;
    saveAndProceed(question, selections.values.join(';'), selections.labels.join('、 '), container);
}

function handleTextInput(question, value, container) {
    const trimmedValue = value.trim();
    if (!question.validation(trimmedValue)) return;
    let gaAnswerValue = (question.type === 'email' || question.type === 'tel') ? '[REDACTED]' : trimmedValue;
    saveAndProceed(question, trimmedValue, trimmedValue, container, gaAnswerValue);
}

async function handlePairedQuestion(question, wasWaiting) {
    if (!wasWaiting) {
        if (state.subStep === 0 && question.question) await addBotMessage(question.question);
        await addBotMessage(question.prompt);
    }
    displayPairedInputs(question, (values, container) => {
        if (container) disableInputs(container);
        state.waitingForInput = false;
        const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
        question.inputs.forEach((inputConfig, index) => { responseSet[inputConfig.key] = values[index]; });
        addUserMessage(values.join(' ')); 
        sendGaEvent(question, '[REDACTED]');
        state.currentStep++;
        state.subStep = 0;
        state.completedEffectiveQuestions++;
        saveState();
        calculateProgress(); 
        setTimeout(askQuestion, 150);
    });
    state.waitingForInput = true; saveState();
}

function handleTimeTableInput(question, value, container) {
    if (!question.validation(value)) return;
    if (container) disableInputs(container);
    const timeLabel = question.timeSlots.find(slot => slot.value === value.time)?.label || value.time;
    state.waitingForInput = false; 
    addUserMessage(`${value.date} ${timeLabel}`); 
    const responseTarget = state.currentFlow === 'initial' ? state.userResponses : state.additionalUserResponses;
    responseTarget[question.keys.date] = value.date;
    responseTarget[question.keys.time] = value.time;
    sendGaEvent(question);
    proceedToNextStep();
}

function calculateProgress() {
    const questionsArray = (state.currentFlow === 'initial') ? initialQuestions : additionalQuestions;
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    let totalEffectiveQuestions = 0;
    for (const q of questionsArray) {
        if (q.condition && responseSet[q.condition.key] !== q.condition.value) continue;
        if (q.answer_method === 'text-pair' || (q.answer_method !== 'final-consent')) totalEffectiveQuestions++;
    }
    if (totalEffectiveQuestions === 0) { updateProgressBar(0); return; }
    updateProgressBar((state.completedEffectiveQuestions / totalEffectiveQuestions) * 100);
}

function getUtmParameters(urlParams) {
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmKeys.forEach(key => { if (urlParams.has(key)) state.utmParameters[key] = urlParams.get(key); });
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

async function submitDataToGAS(dataToSend, isAdditional) {
    showLoadingMessage();
    const payload = { ...dataToSend, "Session ID": state.currentSessionId };
    if (isAdditional) payload.isAdditionalData = true;
    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST', mode: 'no-cors', cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        hideLoadingMessage();

        if (!isAdditional && window.dataLayer) {
            const email = state.userResponses.email_address;
            const phoneNumber = state.userResponses.phone_number;
            const lastName = state.userResponses.last_name;
            const firstName = state.userResponses.first_name;

            let modifiedPhoneNumber = '';
            if (phoneNumber && typeof phoneNumber === 'string') {
                modifiedPhoneNumber = phoneNumber.substring(3);
            }

            let formattedPhoneNumber = '';
            if (phoneNumber && typeof phoneNumber === 'string') {
                if (phoneNumber.startsWith('0')) {
                    formattedPhoneNumber = '+81' + phoneNumber.substring(1);
                } else {
                    formattedPhoneNumber = '+81' + phoneNumber;
                }
            }

            const userData = {
                'email': email,
                'phone_number': formattedPhoneNumber,
                'address': {
                    'last_name': lastName,
                    'first_name': firstName
                }
            };

            window.dataLayer.push({
                'event': 'chat_form_submission_success',
                'user_data': userData,
                'modified_phone': modifiedPhoneNumber
            });
        }

        if (!isAdditional) {
            clearChatMessages();
            state.chatHistory = [];
            await showSystemMessages(SYSTEM_MESSAGES.initial_complete);
            startAdditionalQuestionsFlow();
        } else {
            await showSystemMessages(SYSTEM_MESSAGES.final_complete);
            clearState();
        }
    } catch (error) {
        hideLoadingMessage();
        console.error('Error:', error);
        await showSystemMessages(SYSTEM_MESSAGES.error);
    }
}

function startAdditionalQuestionsFlow() {
    state.currentFlow = 'additional';
    state.questions = additionalQuestions;
    state.currentStep = 0;
    state.completedEffectiveQuestions = 0;
    saveState();
    if(typeof updateProgressBar === 'function') updateProgressBar(0);
    askQuestion();
}