// js/main.js
// アプリケーションのメインロジック

// --- アプリケーションの状態管理 ---
const state = {
    currentSessionId: '',
    isTestMode: true,
    submitting: false,
    submitted: { initial: false, additional: false },
    currentFlow: 'initial',
    currentStep: 0,
    subStep: 0,
    userResponses: {},
    additionalUserResponses: {},
    utmParameters: {},
    completedEffectiveQuestions: 0,
    questions: [],
    gaStepCounter: 0,
    waitingForInput: false // 増殖バグ防止用フラグ
};

// URLパラメータからutm_sourceを取得
const urlParams = new URLSearchParams(window.location.search);
const utmSource = urlParams.get('utm_source');

let styleUrl = STYLE_DEFAULT;

// ★ 変更: 部分一致で判定
if (utmSource && typeof STYLE_CAMPAIGN !== 'undefined') {
    for (const key in STYLE_CAMPAIGN) {
        if (utmSource.includes(key)) {
            styleUrl = STYLE_CAMPAIGN[key];
            break; // 最初に見つかった時点でループを抜ける
        }
    }
}

// linkタグのhrefを書き換え
document.getElementById('main-stylesheet').href = styleUrl;

// --- GAイベント送信 ---
function sendGaEvent(question, answerValue) {
    if (state.isTestMode || !window.dataLayer) return;
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


// ==========================================
// UTMパラメータに応じた動的URL取得ロジック（記述順優先・部分一致対応）
// ==========================================
function getDynamicAssetUrl(defaultUrl, assetMap) {
    if (!assetMap) return defaultUrl || null;

    // 検索対象のUTMパラメータ
    const targetParams = ['utm_campaign', 'utm_source'];

    // 1. config.jsで定義された順番（上から順）でループを回す
    for (const key in assetMap) {
        // 2. そのキーワードが、utm_campaign または utm_source に含まれているか判定
        for (const param of targetParams) {
            const paramValue = state.utmParameters[param];

            // 含まれていれば、その時点で最優先としてURLを返して終了
            if (paramValue && paramValue.includes(key)) {
                return assetMap[key];
            }
        }
    }

    return defaultUrl || null;
}

// ==========================================
// ★ 各種出し分け用ラッパー関数
// ==========================================
function getBannerUrl() {
    const defaultUrl = typeof BANNER_DEFAULT !== 'undefined' ? BANNER_DEFAULT : null;
    const assetMap = typeof BANNER_CAMPAIGN !== 'undefined' ? BANNER_CAMPAIGN : null;

    return getDynamicAssetUrl(defaultUrl, assetMap);
}

function getBotIconUrl() {
    const defaultUrl = typeof ICON_DEFAULT !== 'undefined' ? ICON_DEFAULT : null;
    const assetMap = typeof ICON_CAMPAIGN !== 'undefined' ? ICON_CAMPAIGN : null;

    return getDynamicAssetUrl(defaultUrl, assetMap);
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', initializeChat);

async function initializeChat() {
    initializeUI();
    adjustChatHeight();
    window.addEventListener('resize', adjustChatHeight);
    window.addEventListener('orientationchange', adjustChatHeight);

    // 常に新規フローとして開始する
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
    const bannerUrl = getBannerUrl();
    if (bannerUrl) {
        displayBannerImage(bannerUrl);
    }

    await showSystemMessages(SYSTEM_MESSAGES.welcome);
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

    const wasWaiting = state.waitingForInput;

    if (!wasWaiting) {
        // pre_message の処理
        if (currentQuestion.pre_message) {
            const preMsgText = typeof currentQuestion.pre_message === 'function'
                ? currentQuestion.pre_message(state.utmParameters)
                : currentQuestion.pre_message;

            // isHtmlPreMessageが設定されていればそれを、無ければtrue(既存仕様)を使用
            const isHtml = currentQuestion.hasOwnProperty('isHtmlPreMessage')
                ? currentQuestion.isHtmlPreMessage
                : true;

            await addBotMessage(preMsgText, isHtml);
        }

        // question の処理
        if (currentQuestion.question && currentQuestion.answer_method !== 'text-pair') {
            const questionText = typeof currentQuestion.question === 'function'
                ? currentQuestion.question(state.utmParameters)
                : currentQuestion.question;

            await addBotMessage(questionText, currentQuestion.isHtmlQuestion);
        }
    }

    switch (currentQuestion.answer_method) {
        case 'single-choice':
            displayChoices(currentQuestion, (selection, container) => handleSingleChoice(currentQuestion, selection, container));
            state.waitingForInput = true;
            break;
        case 'multi-choice':
            displayMultiChoices(currentQuestion, (selections, container) => handleMultiChoice(currentQuestion, selections, container));
            state.waitingForInput = true;
            break;
        case 'text': case 'tel': case 'email':
            displayNormalInput(currentQuestion, { onSend: (value, container) => handleTextInput(currentQuestion, value, container) });
            state.waitingForInput = true;
            break;
        case 'text-pair':
            handlePairedQuestion(currentQuestion, wasWaiting);
            break;
        case 'time-table':
            displayTimeTable(currentQuestion, (value, container) => handleTimeTableInput(currentQuestion, value, container));
            state.waitingForInput = true;
            break;
        case 'final-consent':
            displayFinalConsentScreen(currentQuestion, state.userResponses, initialQuestions, (container) => {
                if (container) disableInputs(container);
                state.waitingForInput = false;
                state.userResponses[currentQuestion.key] = true;
                sendGaEvent(currentQuestion, 'true');
                submitDataToGAS(state.userResponses, false);
            });
            state.waitingForInput = true;
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
        // スキップ判定
        if (typeof q.shouldSkip === 'function' && q.shouldSkip(state.utmParameters)) {
            state.currentStep++; // 質問を飛ばして次へ
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

        calculateProgress();
        setTimeout(askQuestion, 150);
    });
    state.waitingForInput = true;
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
        // ★スキップされる質問は「有効な質問数（分母）」にカウントしない
        if (typeof q.shouldSkip === 'function' && q.shouldSkip(state.utmParameters)) continue;
        if (q.answer_method === 'text-pair' || (q.answer_method !== 'final-consent')) totalEffectiveQuestions++;
    }
    if (totalEffectiveQuestions === 0) { updateProgressBar(0); return; }
    updateProgressBar((state.completedEffectiveQuestions / totalEffectiveQuestions) * 100);
}

function getUtmParameters(urlParams) {
    // gclid, yclid, fbclid を配列に追加
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'yclid', 'fbclid'];
    utmKeys.forEach(key => {
        if (urlParams.has(key)) state.utmParameters[key] = urlParams.get(key);
    });
}

function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// 既存の呼び出し名を維持。送信先はテスト用Pardotのみ。
async function submitDataToGAS(dataToSend, isAdditional) {
    const step = isAdditional ? 'additional' : 'initial';
    if (state.submitting || state.submitted[step]) return;
    state.submitting = true;
    showLoadingMessage();
    try {
        const result = await window.PardotTest.submit({
            ...dataToSend,
            email_address: state.userResponses.email_address,
            submission_id: state.currentSessionId,
            form_variant: 'ebook_test',
            meeting_date_answered: isAdditional && dataToSend.first_choice_date ? 'YES' : 'NO'
        }, isAdditional);
        state.submitted[step] = true;
        hideLoadingMessage();
        await addBotMessage(result.dryRun
            ? '送信予定内容を確認しました。Pardotへの実送信・メール送信はしていません。'
            : 'Pardotへの送信が完了しました。');
        if (!isAdditional) startAdditionalQuestionsFlow();
        else await addBotMessage('第2ステップのテストが完了しました。');
    } catch (error) {
        hideLoadingMessage();
        await addBotMessage(error.message, false, true);
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = '同じ内容で再試行';
        retry.addEventListener('click', () => {
            retry.remove();
            submitDataToGAS(dataToSend, isAdditional);
        }, { once: true });
        document.getElementById('chatMessages').appendChild(retry);
    } finally {
        state.submitting = false;
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
