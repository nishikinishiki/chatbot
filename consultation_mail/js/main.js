// js/main.js
// アプリケーションのメインロジック

// --- アプリケーションの状態管理 ---
const state = {
    currentSessionId: '',
    currentStep: 0,
    userResponses: {},
    utmParameters: {},
    completedEffectiveQuestions: 0,
    gaStepCounter: 0, 
};

// --- GAイベント送信 ---
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
    Object.assign(state, {
        currentSessionId: generateSessionId(),
        currentStep: 0,
        userResponses: {},
        utmParameters: {},
        completedEffectiveQuestions: 0,
        gaStepCounter: 0,
    });
    
    getUtmParameters();
    Object.assign(state.userResponses, state.utmParameters);

    if (typeof FAVICON_URL !== 'undefined' && FAVICON_URL) {
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.href = FAVICON_URL;
        document.head.appendChild(faviconLink);
    }
    
    if (typeof BANNER_IMAGE_URL !== 'undefined' && BANNER_IMAGE_URL) {
        displayBannerImage(BANNER_IMAGE_URL);
    }

    await addBotMessage("お問い合わせありがとうございます！", true);
    
    setTimeout(askQuestion, 150);
}

// --- メイン会話フロー ---
async function askQuestion() {
    calculateProgress();
    
    let currentQuestion = findNextQuestion();

    if (!currentQuestion) {
        // 全ての質問が完了した場合の処理は現在定義されていません
        // 必要であればここに追加
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
        case 'time-table':
            displayTimeTable(currentQuestion, (value, container) => handleTimeTableInput(currentQuestion, value, container));
            break;
        case 'final-consent':
             displayFinalConsentScreen(currentQuestion, state.userResponses, questions, (container) => {
                if (container) disableInputs(container);
                state.userResponses[currentQuestion.key] = true;
                sendGaEvent(currentQuestion);
                submitDataToGAS(state.userResponses);
             });
            break;
        default:
            console.warn(`未対応の回答方法です: ${currentQuestion.answer_method}`);
            proceedToNextStep();
    }
}

function findNextQuestion() {
    while (state.currentStep < questions.length) {
        const q = questions[state.currentStep];
        if (q.condition) {
            if (state.userResponses[q.condition.key] !== q.condition.value) {
                state.currentStep++;
                continue;
            }
        }
        return q;
    }
    return null;
}

function proceedToNextStep() {
    state.completedEffectiveQuestions++;
    state.currentStep++;
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
    
    if (question.question) {
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
        state.completedEffectiveQuestions++;
        calculateProgress(); 
        setTimeout(askQuestion, 150);
    });
}

function handleTimeTableInput(question, value, container) {
    if (!question.validation(value)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    if (container) disableInputs(container);
    
    // Find the label corresponding to the selected time value
    const timeLabel = question.timeSlots.find(slot => slot.value === value.time)?.label || value.time;
    addUserMessage(`${value.date} ${timeLabel}`);

    // Store the actual values
    state.userResponses[question.keys.date] = value.date;
    state.userResponses[question.keys.time] = value.time;

    sendGaEvent(question);
    proceedToNextStep();
}

function calculateProgress() {
    let totalEffectiveQuestions = 0;
    for (const q of questions) {
        if (q.condition) {
            if (state.userResponses[q.condition.key] !== q.condition.value) {
                continue;
            }
        }
        if (q.answer_method !== 'final-consent') {
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
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'source'];
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

        clearInputArea(); // 入力エリアをクリア
        await addBotMessage("送信が完了しました。<br>お問い合わせいただきありがとうございました！", true);
        await addBotMessage("ご情報を確認し、後ほど担当よりご連絡いたします。", true);
        await addBotMessage("お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", true);
        await addBotMessage("デジタル書籍が以下から閲覧可能です！<br>不動産投資と節税の仕組み等、役立つ情報が満載ですのでぜひご覧ください。", true);
        await addBotMessage("デジタル書籍を閲覧する", false, false, true);

    } catch (error) {
        hideLoadingMessage();
        console.error('Error sending data to Google Sheet:', error);
        await addBotMessage("エラーが発生し、データを送信できませんでした。お手数ですが、時間をおいて再度お試しください。", false, true);
    }
}


