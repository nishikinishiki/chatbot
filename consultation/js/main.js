// js/main.js (Modified for AB Test)
// アプリケーションのメインロジック

// --- アプリケーションの状態管理 ---
const state = {
    currentSessionId: '',
    currentStep: 0,
    subStep: 0,
    userResponses: {},
    utmParameters: {},
    completedEffectiveQuestions: 0,
    questions: [],
    gaStepCounter: 0, 
};

// --- GAイベント送信 ---
/**
 * GA4にイベントを送信する関数
 * @param {object} question - questions.jsから取得した質問オブジェクト
 */
function sendGaEvent(question) {
    if (!window.dataLayer) {
        console.warn("dataLayer is not available. GA event was not sent.");
        return;
    }

    state.gaStepCounter++; 

    const eventData = {
        'event': 'question_answered',
        'form_variant': window.location.pathname,
        'step_number': state.gaStepCounter,
        'question_id': question.id.toString(), 
        'question_item': question.item,
    };

    window.dataLayer.push(eventData);
    console.log("GA Event Sent:", eventData);
}


// --- 初期化 ---
document.addEventListener('DOMContentLoaded', initializeChat);

async function initializeChat() {
    initializeUI();
    
    adjustChatHeight();
    window.addEventListener('resize', adjustChatHeight);
    window.addEventListener('orientationchange', adjustChatHeight);

    // 状態のリセット
    Object.keys(state).forEach(key => {
        if (typeof state[key] === 'object' && state[key] !== null) {
            state[key] = Array.isArray(state[key]) ? [] : {};
        } else if (typeof state[key] === 'number') {
            state[key] = 0;
        } else if (typeof state[key] === 'string') {
            state[key] = '';
        }
    });

    getUtmParameters();
    state.questions = questions; // Use the unified questions list
    Object.assign(state.userResponses, state.utmParameters);
    state.currentSessionId = generateSessionId();
    state.gaStepCounter = 0; 

    if (typeof FAVICON_URL !== 'undefined' && FAVICON_URL) {
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.href = FAVICON_URL;
        document.head.appendChild(faviconLink);
    }
    
    if (typeof BANNER_IMAGE_URL !== 'undefined' && BANNER_IMAGE_URL) {
        displayBannerImage(BANNER_IMAGE_URL);
    }

    await addBotMessage("お問い合わせありがとうございます！<br>30秒程度の簡単な質問をさせてください。", true);
    
    setTimeout(askQuestion, 150);
}

// --- メイン会話フロー ---
async function askQuestion() {
    calculateProgress();
    
    let currentQuestion = findNextQuestion();

    if (!currentQuestion) {
        handleFlowCompletion();
        return;
    }
    
    if (currentQuestion.pre_message) await addBotMessage(currentQuestion.pre_message, true);
    if (currentQuestion.pre_message_1) await addBotMessage(currentQuestion.pre_message_1);
    if (currentQuestion.pre_message_2) await addBotMessage(currentQuestion.pre_message_2);
    
    if (currentQuestion.question && currentQuestion.answer_method !== 'text-pair') {
        await addBotMessage(currentQuestion.question, currentQuestion.isHtmlQuestion);
    }
    
    switch(currentQuestion.answer_method) {
        case 'single-choice':
            displayChoices(currentQuestion, (selection, container) => handleSingleChoice(currentQuestion, selection, container));
            break;
        case 'text':
        case 'tel':
        case 'email':
             displayNormalInput(currentQuestion, {
                onSend: (value, container) => handleTextInput(currentQuestion, value, container),
             });
            break;
        case 'text-pair':
            handlePairedQuestion(currentQuestion);
            break;
        case 'calendar':
            displayCalendar(currentQuestion, (value, container) => handleCalendarInput(currentQuestion, value, container));
            break;
        case 'final-consent':
             displayFinalConsentScreen(currentQuestion, state.userResponses, state.questions, (container) => {
                if (container) disableInputs(container);
                state.userResponses[currentQuestion.key] = true;
                sendGaEvent(currentQuestion);
                submitDataToGAS(state.userResponses);
             });
            break;
        default:
            console.warn(`Unsupported answer method: ${currentQuestion.answer_method}`);
            proceedToNextStep();
    }
}

function findNextQuestion() {
    if (state.questions[state.currentStep]?.answer_method === 'text-pair' && state.subStep > 0) {
        return state.questions[state.currentStep];
    }

    while (state.currentStep < state.questions.length) {
        const q = state.questions[state.currentStep];
        if (q.condition) {
            const responses = state.userResponses;
            if (responses[q.condition.key] !== q.condition.value) {
                state.currentStep++;
                continue;
            }
        }
        return q;
    }
    return null;
}

function handleFlowCompletion() {
    // This function is called when all questions are asked, before the final consent.
    // No action is needed here in the unified flow as submission is handled by the consent button.
    console.log("All questions completed. Waiting for final consent.");
}

function proceedToNextStep() {
    state.completedEffectiveQuestions++;
    state.currentStep++;
    state.subStep = 0;
    setTimeout(askQuestion, 150);
}

function handleSingleChoice(question, selection, container) {
    const value = (typeof selection === 'object' && selection.value) ? selection.value : selection;
    const label = (typeof selection === 'object' && selection.label) ? selection.label : selection;

    if (!question.validation(value)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    if (container) disableInputs(container);
    
    const userMessageLabel = label.replace(/<br>/g, ' ');
    addUserMessage(userMessageLabel);
    
    state.userResponses[question.key] = value;
    
    sendGaEvent(question);
    proceedToNextStep();
}

function handleTextInput(question, value, container) {
    const trimmedValue = value.trim();
    if (!question.validation(trimmedValue)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    if (container) disableInputs(container);
    addUserMessage(trimmedValue);
    state.userResponses[question.key] = trimmedValue;
    sendGaEvent(question);
    proceedToNextStep();
}

async function handlePairedQuestion(question) {
    const currentPair = question.pairs[0];
    
    if (state.subStep === 0 && question.question) {
        await addBotMessage(question.question);
    }
    
    await addBotMessage(currentPair.prompt);
    
    displayPairedInputs(currentPair, (values, container) => {
        if (container) disableInputs(container);
        
        currentPair.inputs.forEach((inputConfig, index) => {
            state.userResponses[inputConfig.key] = values[index];
        });

        const userMessageText = values.join(' ');
        addUserMessage(userMessageText);
        
        sendGaEvent(question);

        state.currentStep++;
        state.subStep = 0;
        state.completedEffectiveQuestions++;
        calculateProgress(); 
        setTimeout(askQuestion, 150);
    });
}

function handleCalendarInput(question, value, container) {
    if (!question.validation(value)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    if (container) disableInputs(container);
    addUserMessage(value);
    state.userResponses[question.key] = value;
    sendGaEvent(question);
    proceedToNextStep();
}


function calculateProgress() {
    const questionsArray = state.questions;
    const responseSet = state.userResponses;
    
    let totalEffectiveQuestions = 0;
    for (const q of questionsArray) {
        if (q.condition) {
            if (responseSet[q.condition.key] !== q.condition.value) {
                continue;
            }
        }
        if (q.answer_method === 'text-pair') {
            totalEffectiveQuestions++;
        } else if (q.answer_method !== 'final-consent') {
            totalEffectiveQuestions++;
        }
    }

    if (totalEffectiveQuestions === 0) {
        updateProgressBar(0);
        return;
    }
    
    const progress = (state.completedEffectiveQuestions / totalEffectiveQuestions) * 100;
    updateProgressBar(progress);
}

function getUtmParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmKeys.forEach(key => {
        if (urlParams.has(key)) {
            state.utmParameters[key] = urlParams.get(key);
        }
    });
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

async function submitDataToGAS(dataToSend) {
    showLoadingMessage();
    
    const payload = { ...dataToSend };
    payload["Session ID"] = state.currentSessionId;

    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        hideLoadingMessage();
        
        if (window.dataLayer) {
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

        clearChatMessages();
        await addBotMessage("送信が完了しました。<br>お問い合わせいただきありがとうございました！", true);
        await addBotMessage("全ての情報を承りました。ご回答ありがとうございました！<br>後ほど担当よりご連絡いたします。", true);
        await addBotMessage("お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", true);
        await addBotMessage("デジタル書籍は下記から閲覧できます！");
        await addBotMessage("デジタル書籍を閲覧する", false, false, true);

    } catch (error) {
        hideLoadingMessage();
        console.error('Error sending data to Google Sheet:', error);
        await addBotMessage("エラーが発生し、データを送信できませんでした。お手数ですが、時間をおいて再度お試しください。", false, true);
    }
}
