// ============================================================
// js/main.js (リファクタリング版)
// ============================================================

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
    isTestMode: false,
};

// --- ユーティリティ関数 ---
/**
 * 共通の回答処理ハンドラー
 * @param {object} question - 質問オブジェクト
 * @param {any} value - 回答値
 * @param {array} labels - 表示用ラベル（複数選択時）
 * @param {HTMLElement} container - 入力コンテナ
 */
function handleAnswer(question, value, container, labels = null) {
    if (!question.validation(Array.isArray(value) ? value : value)) {
        addBotMessage(question.errorMessage, false, true);
        return false;
    }

    if (container) disableInputs(container);

    // ユーザーメッセージを表示
    const displayValue = labels ? labels.join('、') : 
                         (typeof value === 'object' ? JSON.stringify(value) : value);
    const userMessageLabel = displayValue.toString().replace(/<br>/g, ' ');
    addUserMessage(userMessageLabel);

    // 回答を保存
    const responseSet = (state.currentFlow === 'initial') 
        ? state.userResponses 
        : state.additionalUserResponses;
    responseSet[question.key] = value;

    // ログ送信
    sendAnswerToLog(question, value.toString());

    // GA送信（個人情報はマスク）
    const gaValue = shouldMaskValue(question) ? '[REDACTED]' : value.toString();
    sendGaEvent(question, gaValue);

    proceedToNextStep();
    return true;
}

/**
 * 個人情報をマスクするべきか判定
 * @param {object} question
 * @returns {boolean}
 */
function shouldMaskValue(question) {
    return question.type === 'email' || question.type === 'tel';
}

/**
 * ログ送信
 */
function sendAnswerToLog(question, answerValue) {
    if (!GAS_LOG_APP_URL || GAS_LOG_APP_URL === 'ここに新しく取得したログ用GASのURLを貼り付け') {
        return;
    }

    const payload = {
        sessionId: state.currentSessionId,
        questionId: question.id.toString(),
        answerValue: answerValue,
        is_test: state.isTestMode,
        form_variant: window.location.pathname
    };

    fetch(GAS_LOG_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).catch(() => {
        // エラー無視（バックグラウンド処理）
    });
}

/**
 * GA4イベント送信
 */
function sendGaEvent(question, answerValue) {
    if (state.isTestMode || !window.dataLayer) {
        if (state.isTestMode) console.log("Test mode: GA event skipped");
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
    console.log("GA Event:", eventData);
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', initializeChat);

async function initializeChat() {
    initializeUI();
    adjustChatHeight();
    window.addEventListener('resize', adjustChatHeight);
    window.addEventListener('orientationchange', adjustChatHeight);

    // 状態をリセット
    resetState();

    const urlParams = new URLSearchParams(window.location.search);
    state.isTestMode = urlParams.get('test_mode') === 'true';
    
    if (state.isTestMode) {
        console.log("Test mode active");
    }

    getUtmParameters(urlParams);
    state.currentFlow = 'initial';
    state.questions = initialQuestions;
    Object.assign(state.userResponses, state.utmParameters);
    state.currentSessionId = generateSessionId();

    setupPageElements();
    
    await addBotMessage("J.P.Returnsにご興味いただきありがとうございます！<br>30秒程度の簡単な質問をさせてください。", true);
    setTimeout(askQuestion, 150);
}

/**
 * 状態をリセット
 */
function resetState() {
    state.currentStep = 0;
    state.subStep = 0;
    state.completedEffectiveQuestions = 0;
    state.gaStepCounter = 0;
    state.userResponses = {};
    state.additionalUserResponses = {};
}

/**
 * ページ要素のセットアップ（ファビコン、バナー）
 */
function setupPageElements() {
    if (typeof FAVICON_URL !== 'undefined' && FAVICON_URL) {
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.href = FAVICON_URL;
        document.head.appendChild(faviconLink);
    }

    if (typeof BANNER_IMAGE_URL !== 'undefined' && BANNER_IMAGE_URL) {
        displayBannerImage(BANNER_IMAGE_URL);
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

    if (currentQuestion.pre_message) {
        await addBotMessage(currentQuestion.pre_message, true);
    }

    if (currentQuestion.question && currentQuestion.answer_method !== 'text-pair') {
        await addBotMessage(currentQuestion.question, currentQuestion.isHtmlQuestion);
    }

    // 質問タイプごとの処理
    switch (currentQuestion.answer_method) {
        case 'single-choice':
            displayChoices(currentQuestion, (selection, container) => {
                handleAnswer(currentQuestion, selection.value, container, [selection.label]);
            });
            break;
        case 'multi-choice':
            displayMultiChoices(currentQuestion, (selections, container) => {
                handleAnswer(currentQuestion, selections.values.join(';'), container, selections.labels);
            });
            break;
        case 'text':
        case 'tel':
        case 'email':
            displayNormalInput(currentQuestion, {
                onSend: (value, container) => {
                    handleAnswer(currentQuestion, value.trim(), container);
                }
            });
            break;
        case 'text-pair':
            handlePairedQuestion(currentQuestion);
            break;
        case 'time-table':
            displayTimeTable(currentQuestion, (value, container) => {
                handleAnswer(currentQuestion, value, container, 
                    [`${value.date} ${getTimeLabel(currentQuestion, value.time)}`]);
            });
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
            console.warn(`Unsupported answer method: ${currentQuestion.answer_method}`);
            proceedToNextStep();
    }
}

/**
 * 時間スロットのラベルを取得
 */
function getTimeLabel(question, timeValue) {
    const slot = question.timeSlots?.find(s => s.value === timeValue);
    return slot ? slot.label : timeValue;
}

function findNextQuestion() {
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

/**
 * ペアで入力される質問を処理
 */
async function handlePairedQuestion(question) {
    if (state.subStep === 0 && question.question) {
        await addBotMessage(question.question);
    }

    await addBotMessage(question.prompt);

    displayPairedInputs(question, (values, container) => {
        if (container) disableInputs(container);

        const responseSet = (state.currentFlow === 'initial') 
            ? state.userResponses 
            : state.additionalUserResponses;

        question.inputs.forEach((inputConfig, index) => {
            responseSet[inputConfig.key] = values[index];
        });

        addUserMessage(values.join(' '));
        sendAnswerToLog(question, values.join(' '));
        sendGaEvent(question, '[REDACTED]');

        state.currentStep++;
        state.subStep = 0;
        state.completedEffectiveQuestions++;
        calculateProgress();
        setTimeout(askQuestion, 150);
    });
}

function calculateProgress() {
    const questionsArray = (state.currentFlow === 'initial') 
        ? initialQuestions 
        : additionalQuestions;
    const responseSet = (state.currentFlow === 'initial') 
        ? state.userResponses 
        : state.additionalUserResponses;

    let totalEffectiveQuestions = 0;
    for (const q of questionsArray) {
        if (q.condition && responseSet[q.condition.key] !== q.condition.value) {
            continue;
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

/**
 * 電話番号をGA形式にフォーマット（+81形式）
 */
function formatPhoneNumberForGA(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') return '';
    return phoneNumber.startsWith('0') 
        ? '+81' + phoneNumber.substring(1)
        : '+81' + phoneNumber;
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
                const userData = {
                    'email': state.userResponses.email_address,
                    'phone_number': formatPhoneNumberForGA(state.userResponses.phone_number),
                    'address': {
                        'last_name': state.userResponses.last_name,
                        'first_name': state.userResponses.first_name
                    }
                };

                window.dataLayer.push({
                    'event': 'chat_form_submission_success',
                    'user_data': userData
                });
            }

            clearChatMessages();
            await addBotMessage("送信が完了しました。<br>お問い合わせいただきありがとうございました！", true);
            await addBotMessage("デジタル書籍は下記から閲覧できます！");
            await addBotMessage("デジタル書籍を閲覧する", false, false, true);
            startAdditionalQuestionsFlow();
        } else {
            await addBotMessage("全ての情報を承りました。ご回答ありがとうございました！<br>後ほど担当よりご連絡いたします。", true);
            await addBotMessage("お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", true);
        }
    } catch (error) {
        hideLoadingMessage();
        console.error('Error sending data:', error);
        await addBotMessage("エラーが発生しました。時間をおいて再度お試しください。", false, true);
    }
}

function startAdditionalQuestionsFlow() {
    state.currentFlow = 'additional';
    state.questions = additionalQuestions;
    state.currentStep = 0;
    state.completedEffectiveQuestions = 0;
    if (typeof updateProgressBar === 'function') updateProgressBar(0);
    askQuestion();
}