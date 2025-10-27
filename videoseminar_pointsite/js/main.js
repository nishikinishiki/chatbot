// js/main.js
// アプリケーションのメインロジック

// --- アプリケーションの状態管理 ---
const state = {
    currentSessionId: '',
    currentFlow: 'initial', // 'initial' or 'additional'
    currentStep: 0,
    subStep: 0,
    userResponses: {},
    additionalUserResponses: {},
    utmParameters: {},
    completedEffectiveQuestions: 0,
    questions: [],
    gaStepCounter: 0, // GAイベント用のステップカウンターを追加
    isTestMode: false, // ★★★ テストモードの状態を管理する変数を追加 ★★★
};

// --- ログ送信 ---
/**
 * 回答データをログ用スプレッドシートに送信する関数
 * @param {object} question
 * @param {string} answerValue
 */
function sendAnswerToLog(question, answerValue) {
    if (!GAS_LOG_APP_URL || GAS_LOG_APP_URL === 'ここに新しく取得したログ用GASのURLを貼り付け') {
        return; // ログ用URLが設定されていない場合は何もしない
    }

    const payload = {
        sessionId: state.currentSessionId,
        questionId: question.id.toString(),
        answerValue: answerValue,
        is_test: state.isTestMode,
        form_variant: window.location.pathname
    };

    // 'no-cors'モードでエラーをコンソールに出さないように送信
    fetch(GAS_LOG_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).catch(error => {
        // 意図的にエラーを無視する（バックグラウンドでの軽量なログ送信のため）
    });
}


// --- GAイベント送信 ---
/**
 * GA4にイベントを送信する関数
 * @param {object} question
 * @param {string} answerValue
 */
function sendGaEvent(question, answerValue) {
    // ★★★ テストモードの場合はGAイベントを送信しない ★★★
    if (state.isTestMode) {
        console.log("Test mode is active. GA event was not sent.");
        return;
    }
    
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
        'answer_value': answerValue
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

    const urlParams = new URLSearchParams(window.location.search);
    
    state.isTestMode = urlParams.get('test_mode') === 'true';
    if (state.isTestMode) {
        console.log("Test mode is active. Data will not be saved to spreadsheets.");
    }
    
    getUtmParameters(urlParams);
    state.currentFlow = 'initial';
    state.questions = initialQuestions;
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

    await addBotMessage("J.P.Returnsにご興味いただきありがとうございます！<br>30秒程度の簡単な質問をさせてください。", true);
    
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
        case 'multi-choice':
            displayMultiChoices(currentQuestion, (selections, container) => handleMultiChoice(currentQuestion, selections, container));
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
             displayFinalConsentScreen(currentQuestion, state.userResponses, initialQuestions, (container) => {
                if (container) disableInputs(container);
                state.userResponses[currentQuestion.key] = true;
                sendGaEvent(currentQuestion, 'true');
                sendAnswerToLog(currentQuestion, 'true');
                submitDataToGAS(state.userResponses, false);
             });
            break;
        default:
            console.warn(`未対応の回答方法です: ${currentQuestion.answer_method}`);
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
            const responses = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
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
    if (state.currentFlow === 'additional') {
        submitDataToGAS(state.additionalUserResponses, true);
    }
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
    
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = value;
    
    sendGaEvent(question, value);
    sendAnswerToLog(question, value);
    proceedToNextStep();
}

// ★★★ 新規追加: 複数選択の回答を処理する関数 ★★★
function handleMultiChoice(question, selections, container) {
    const values = selections.values; // 例: ["Google検索", "SNS (Facebook)"]
    const labels = selections.labels; // 例: ["Google検索", "SNS (Facebook)"]

    // バリデーション (配列を渡す)
    if (!question.validation(values)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    if (container) disableInputs(container);
    
    // ユーザーメッセージにはラベルをカンマ区切りで表示
    const userMessageLabel = labels.join(', ');
    addUserMessage(userMessageLabel);
    
    // 送信データにはvalueをカンマ区切りで保存 (スプレッドシートで見やすいため)
    const responseValue = values.join(',');
    
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = responseValue;
    
    sendGaEvent(question, responseValue);
    sendAnswerToLog(question, responseValue);
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
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = trimmedValue;

    sendAnswerToLog(question, trimmedValue);
    
    let gaAnswerValue = trimmedValue;
    if (question.type === 'email' || question.type === 'tel') {
        gaAnswerValue = '[REDACTED]';
    }
    sendGaEvent(question, gaAnswerValue);

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

        const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
        
        currentPair.inputs.forEach((inputConfig, index) => {
            responseSet[inputConfig.key] = values[index];
        });

        const userMessageText = values.join(' ');
        addUserMessage(userMessageText);
        
        sendAnswerToLog(question, userMessageText);
        sendGaEvent(question, '[REDACTED]');

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
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = value;
    sendGaEvent(question, value);
    sendAnswerToLog(question, value);
    proceedToNextStep();
}


function calculateProgress() {
    const questionsArray = (state.currentFlow === 'initial') ? initialQuestions : additionalQuestions;
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    
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

function getUtmParameters(urlParams) {
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

async function submitDataToGAS(dataToSend, isAdditional) {
    showLoadingMessage();
    
    const payload = { ...dataToSend };
    payload["Session ID"] = state.currentSessionId;
    if (isAdditional) {
        payload.isAdditionalData = true;
    }
    payload.is_test = state.isTestMode; 

    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        hideLoadingMessage();
        
        if (!isAdditional) {
            if (window.dataLayer && !state.isTestMode) { 
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
            await addBotMessage("動画セミナーは下記から閲覧できます！");
            await addBotMessage("動画セミナーを閲覧する", false, false, true);
            startAdditionalQuestionsFlow();

        } else {
            await addBotMessage("全ての情報を承りました。ご回答ありがとうございました！<br>後ほど担当よりご連絡いたします。", true);
            await addBotMessage("お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", true);
        }

    } catch (error) {
        hideLoadingMessage();
        console.error('Error sending data to Google Sheet:', error);
        await addBotMessage("エラーが発生し、データを送信できませんでした。お手数ですが、時間をおいて再度お試しください。", false, true);
    }
}

function startAdditionalQuestionsFlow() {
    state.currentFlow = 'additional';
    state.questions = additionalQuestions;
    state.currentStep = 0;
    state.completedEffectiveQuestions = 0;
    if(typeof updateProgressBar === 'function') updateProgressBar(0);
    askQuestion();
}
