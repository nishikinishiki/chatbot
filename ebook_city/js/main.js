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

    state.gaStepCounter++; // イベントごとにステップ番号を1つ進める

    const eventData = {
        'event': 'question_answered',
        'form_variant': window.location.pathname,
        'step_number': state.gaStepCounter,
        'question_id': question.id.toString(), // IDを文字列として送信
        'question_item': question.item,
    };

    window.dataLayer.push(eventData);
    // デバッグ用にコンソールに出力
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
    state.currentFlow = 'initial';
    state.questions = initialQuestions;
    Object.assign(state.userResponses, state.utmParameters);
    state.currentSessionId = generateSessionId();
    state.gaStepCounter = 0; // 初期化

    if (typeof FAVICON_URL !== 'undefined' && FAVICON_URL) {
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.href = FAVICON_URL;
        document.head.appendChild(faviconLink);
    }
    
        // ▼▼▼【ここから追加】▼▼▼
    // バナー画像が設定されていれば表示する
    if (typeof BANNER_IMAGE_URL !== 'undefined' && BANNER_IMAGE_URL) {
        displayBannerImage(BANNER_IMAGE_URL);
    }
    // ▲▲▲【ここまで追加】▲▲▲

    await addBotMessage("J.P.Returnsにお問い合わせいただきありがとうございます！");
    await addBotMessage("30秒程度の簡単な質問をさせてください。");
    
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

    clearInputArea();
    
    // 事前メッセージの表示
    if (currentQuestion.pre_message) await addBotMessage(currentQuestion.pre_message, true);
    if (currentQuestion.pre_message_1) await addBotMessage(currentQuestion.pre_message_1);
    if (currentQuestion.pre_message_2) await addBotMessage(currentQuestion.pre_message_2);
    
    if (currentQuestion.question && currentQuestion.answer_method !== 'text-pair') {
        await addBotMessage(currentQuestion.question, currentQuestion.isHtmlQuestion);
    }
    
    // 回答方法に応じたUIを生成
    switch(currentQuestion.answer_method) {
        case 'single-choice':
            displayChoices(currentQuestion, (value) => handleSingleChoice(currentQuestion, value));
            break;
        case 'text':
        case 'tel':
        case 'email':
             displayNormalInput(currentQuestion, {
                onSend: (value) => handleTextInput(currentQuestion, value),
             });
            break;
        case 'text-pair':
            handlePairedQuestion(currentQuestion);
            break;
        case 'calendar':
            displayCalendar(currentQuestion, (value) => handleCalendarInput(currentQuestion, value));
            break;
        case 'final-consent':
             displayFinalConsentScreen(currentQuestion, state.userResponses, initialQuestions, () => {
                state.userResponses[currentQuestion.key] = true;
                sendGaEvent(currentQuestion);
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
    clearInputArea(); 
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


// --- 回答ハンドラ ---
function handleSingleChoice(question, value) {
    if (!question.validation(value)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    addUserMessage(value);
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = value;
    sendGaEvent(question);
    proceedToNextStep();
}

function handleTextInput(question, value) {
    const trimmedValue = value.trim();
    if (!question.validation(trimmedValue)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    addUserMessage(trimmedValue);
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = trimmedValue;
    sendGaEvent(question);
    proceedToNextStep();
}

// =================================================
// ▼▼▼ 変更点 ▼▼▼
// 質問の構造変更に伴い、この関数内のGAイベント送信ロジックをシンプルにしました。
// =================================================
async function handlePairedQuestion(question) {
    // text-pairの質問は常にpairs配列の最初の要素を扱う
    const currentPair = question.pairs[0];
    
    if (state.subStep === 0 && question.question) {
        await addBotMessage(question.question);
    }
    
    await addBotMessage(currentPair.prompt);

    displayPairedInputs(currentPair, (values) => {
        const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
        let userMessageText = "";

        currentPair.inputs.forEach((inputConfig, index) => {
            responseSet[inputConfig.key] = values[index];
            userMessageText += `${inputConfig.label}: ${values[index]}${index < currentPair.inputs.length - 1 ? ', ' : ''}`;
        });
        addUserMessage(userMessageText);
        
        // シンプルなGAイベント送信
        sendGaEvent(question);

        // 次の質問へ進む
        state.currentStep++;
        state.subStep = 0; // subStepは常にリセット
        state.completedEffectiveQuestions++;
        calculateProgress(); 
        setTimeout(askQuestion, 150);
    });
}

function handleCalendarInput(question, value) {
    if (!question.validation(value)) {
        addBotMessage(question.errorMessage, false, true);
        return;
    }
    addUserMessage(value);
    const responseSet = (state.currentFlow === 'initial') ? state.userResponses : state.additionalUserResponses;
    responseSet[question.key] = value;
    sendGaEvent(question);
    proceedToNextStep();
}


// --- ヘルパー関数 ---
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
            // text-pairは1質問としてカウント
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

// --- データ送信 ---
async function submitDataToGAS(dataToSend, isAdditional) {
    showLoadingMessage();
    
    const payload = { ...dataToSend };
    payload["Session ID"] = state.currentSessionId;
    if (isAdditional) {
        payload.isAdditionalData = true;
    }

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
            // =================================================
            // ▼▼▼【ここからが修正箇所です】▼▼▼
            // =================================================
            if (window.dataLayer) {
                // 1. 電話番号を取得
                const phoneNumber = state.userResponses.phone_number;
                let modifiedPhoneNumber = '';

                // 2. 電話番号が存在し、文字列であれば頭3桁を削除
                if (phoneNumber && typeof phoneNumber === 'string') {
                    modifiedPhoneNumber = phoneNumber.substring(3);
                }

                // 3. GTMのカスタムイベントと加工した電話番号をdataLayerに送信
                window.dataLayer.push({
                    'event': 'chat_form_submission_success',
                    'modified_phone': modifiedPhoneNumber 
                });
            }
            // =================================================
            // ▲▲▲【ここまでが修正箇所です】▲▲▲
            // =================================================

            clearChatMessages();
            await addBotMessage("送信が完了しました。<br>お問い合わせいただきありがとうございました！", true);
            startAdditionalQuestionsFlow();

        } else {
            await addBotMessage("全ての情報を承りました。ご回答ありがとうございました！<br>後ほど担当よりご連絡いたします。", true);
            await addBotMessage("お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", true);
            
            await addBotMessage("電子書籍は下記から閲覧できます！");
            await addBotMessage("電子書籍を閲覧する", false, false, true);
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