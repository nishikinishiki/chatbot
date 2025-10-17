// **********************************************
// 1. 設定とスコアリングロジック
// **********************************************
const app = document.getElementById('chatbot-container');
const messagesDiv = document.getElementById('messages');
const optionsDiv = document.getElementById('options');

// 【要設定】連携先URL
const CONSULT_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0hveDzBAYfcVixNRX-JL7uInchOSY4CTaS17GXTh1EVh7zoilZEVaMM8QjdlVSb6jJaawNFsgy";
const VIDEO_URL = "https://www.youtube.com/watch?v=eqBnS-vwwlE";

// 【キャンペーン設定】
const IS_CAMPAIGN_ACTIVE = true;

// 与信枠計算の閾値
const HYPER_CORE_THRESHOLD_AMOUNT = 10000;
const CORE_THRESHOLD = 3000;
const MIN_ANNUAL_SALARY = 600;

// タックスメリット計算の最小値
const MIN_TAX_BENEFIT = 100;

// **********************************************
// 初期状態の定義
// **********************************************
let currentStep = 'start';
let totalScore = 0;
let userData = {};

// **********************************************
// 2. チャットボットのステップ定義
// **********************************************
const steps = {
    'start': {
        message: "Salesforce様 限定の戦略的資産形成プログラムへようこそ。まずは、あなたの現在の課題に最も近いものをお選びください。",
        options: [
            { text: "A. 信用力・タックスコントロールを<br>活用した資産拡大戦略を検討したい", next: 'Q1_age', score: 0 },
            { text: "B. 節税の仕組みがわからないので、そこを学びたい", next: 'Q0_tax_approach', score: 0 },
            { text: "C. 不動産相場が上がり過ぎてて買い時はもう遅い？", next: 'Q0_bubble', score: 0 },
            { text: "D. 他社で検討中、<br>もしくは既に所有済み", next: 'Q0_status', score: 0 }
        ]
    },
    'Q0_tax_approach': {
        message: "承知いたしました。節税の仕組みについて、あなたの理想的なアプローチをお聞かせください。",
        options: [
            { text: "面倒なのは嫌なので、丸投げできるなら専門家に頼みたい", next: 'Q1_age', score: 0 },
            { text: "全部理解しないと気が済まないので、じっくり仕組みが知りたい", next: 'end_video', score: 0 }
        ]
    },
    'Q0_bubble': {
        message: "市場環境の懸念、承知いたしました。では、もし仮に相場よりまだ割安で手に入る「勝ち筋の物件」があるとしたら、あなたの考えはどちらに近いですか？",
        options: [
            { text: "相場より割安で手に入る物件なら、検討する価値あるかも", next: 'Q1_age', score: 0 },
            { text: "バブルは怖いから無理かも", next: 'end_video', score: 0 }
        ]
    },
    'Q0_status': {
        message: "承知いたしました。現在のご状況をお聞かせください。",
        options: [
            { text: "他社で具体的な物件提案を受け、<br>比較検討中です", next: 'Q1_age', score: 2500 },
            { text: "既に不動産を所有しており、<br>運用・出口戦略を相談したい", next: 'Q1_age', score: 1000 }
        ]
    },
    'Q1_age': {
        message: "Q1. はじめに、あなたの年齢を教えていただけますか？",
        is_input: true,
        next: 'Q2_salary'
    },
    'Q2_salary': {
        message: "Q2. あなたの現在の年収（税引前、万円単位）をご入力ください。",
        is_input: true,
        next: 'Q3_loan'
    },
    'Q3_loan': {
        message: "Q3. 住宅ローンや、投資物件ローン、車、その他本人名義の借り入れ（残債、万円単位）を概算でご入力ください。ない場合は「0」をご入力ください。",
        is_input: true,
        next: 'Q4_experience'
    },
    'Q4_experience': {
        message: "Q4. 過去にマンション投資を検討し、具体的な物件選定やシミュレーションまで進めた経験はありますか？",
        options: [
            { text: "はい、具体的に動いたことがあります", next: 'Q5_barrier', score: 500 },
            { text: "いいえ、情報収集段階です", next: 'Q5_barrier', score: 0 },
        ]
    },
    'Q5_barrier': {
        message: "Q5. その他に、現在の検討状況で『解消できていない明確な課題』はありますか？",
        options: [
            { text: "はい、明確な課題（不安）がありました", next: 'calc_score', score: 500 },
            { text: "いいえ、特にありません", next: 'calc_score', score: 250 },
            { text: "特になく、すでに所有済みなので、その活用方法や出口戦略を相談したい", next: 'calc_score', score: 250 }
        ]
    },
    'calc_score': {
        message: "スコアリングが完了しました。あなたの「休眠信用資産（与信枠）」のポテンシャルを推定します...",
        next: 'final_result',
        options: []
    },
    'final_result': {
        message: "",
        options: [
            { text: ``, next: 'redirect_consult', is_cta: true, class: 'final-cta' },
            { text: "② まずは無料動画を視聴する（キャンペーン対象外）", next: 'redirect_video', is_cta: true, class: 'option-button-2' },
        ]
    },
    'end_video': {
        message: "承知いたしました。まずは知識武装から始めるのが賢明です。高年収者が確実に資産を築くための「タックスコントロール基礎動画」を無料公開しています。こちらからご視聴ください。",
        options: [
            { text: "無料動画視聴ページへ進む", next: 'redirect_video', is_cta: true, class: 'option-button' },
        ]
    },
    'redirect_consult': {
        message: "個別電話ヒアリング予約ページへ移動します...",
        action: () => window.open(CONSULT_URL, '_blank')
    },
    'redirect_video': {
        message: "無料動画視聴ページへ移動します...",
        action: () => window.open(VIDEO_URL, '_blank')
    }
};

// **********************************************
// 3. メイン処理関数
// **********************************************

function displayMessage(text, isUser = false) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ' + (isUser ? 'user-message' : 'bot-message');
    bubble.innerHTML = text;
    messagesDiv.appendChild(bubble);
    scrollToBottom();
}

function displayOptions(stepName) {
    optionsDiv.innerHTML = '';
    const step = steps[stepName];
    if (step.action) {
        step.action();
        return;
    }
    if (step.is_input) {
        displayInputField(stepName, step.input_type);
        return;
    }
    if (step.options && step.options.length > 0) {
        step.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-button';
            if (option.class) button.classList.add(option.class);
            if (stepName === 'final_result') {
                if (option.next === 'redirect_consult') {
                    const signClass = IS_CAMPAIGN_ACTIVE ? '' : 'inactive';
                    const signText = IS_CAMPAIGN_ACTIVE ? '✨ 社内福利厚生キャンペーン対象！今すぐご予約ください ✨' : '（キャンペーン対象外）';
                    button.innerHTML = `
                        ① 【AI診断によるおすすめプラン】<br>専門家へ個別相談を予約する
                        <span class="cta-sign-flow">
                            まずは日程確保。専門スタッフが電話でヒアリング<br>
                            （コンサル選定・WEB/来社相談を決定）
                        </span>
                        <span class="cta-sign ${signClass}">${signText}</span>`;
                } else {
                    button.innerHTML = option.text;
                }
            } else {
                button.innerHTML = option.text;
            }
            button.onclick = () => handleOptionClick(option, stepName);
            optionsDiv.appendChild(button);
        });
    }
    scrollToBottom();
}

function displayInputField(stepName, inputType = 'number') {
    const placeholderText = stepName === 'Q1_age' ? "例: 35" :
        stepName === 'Q2_salary' ? "例: 1200 (万円)" :
        "例: 200 (万円) または 0";
    const isNumber = inputType === 'number';
    optionsDiv.innerHTML = `
        <div class="input-group">
            <input type="${isNumber ? 'number' : 'text'}" id="userInput" placeholder="${placeholderText}" ${isNumber ? 'min="0"' : ''}>
            <button onclick="handleInputSubmit('${stepName}', ${isNumber})">送信</button>
        </div>
        <div id="inputError" class="error-message"></div>`;
    document.getElementById('userInput')?.focus();
}

async function handleInputSubmit(stepName, isNumber) {
    const inputElement = document.getElementById('userInput');
    const errorElement = document.getElementById('inputError');
    const inputValue = inputElement.value.trim();
    errorElement.textContent = '';
    if (!inputValue || (isNumber && (isNaN(parseInt(inputValue)) || parseInt(inputValue) < 0))) {
        errorElement.textContent = isNumber ? '有効な数字を入力してください。' : '内容を入力してください。';
        return;
    }
    displayMessage(inputValue, true);
    optionsDiv.innerHTML = '';
    
    if (stepName === 'Q1_age') {
        userData.age = parseInt(inputValue);
    } else if (stepName === 'Q2_salary') {
        userData.annualSalary = parseInt(inputValue);
    } else if (stepName === 'Q3_loan') {
        userData.loanRemaining = parseInt(inputValue);
    }
    
    currentStep = steps[stepName].next;
    if (steps[currentStep]) {
        displayMessage(steps[currentStep].message);
        displayOptions(currentStep);
    }
}

function handleOptionClick(option, stepName) {
    const answerText = option.text.replace(/<br>/g, ' ');
    displayMessage(answerText, true);

    userData[stepName] = answerText;
    
    if (option.score > 0) {
        userData[stepName + '_score'] = option.score;
    }

    totalScore += option.score;
    currentStep = option.next;
    optionsDiv.innerHTML = '';

    if (currentStep === 'calc_score') {
        if (typeof userData.annualSalary !== 'number' || typeof userData.loanRemaining !== 'number') {
            displayMessage("エラーが発生しました。年収と残債を正しく入力してください。", false);
            currentStep = 'start';
            displayOptions(currentStep);
            return;
        }
        displayMessage(steps['calc_score'].message);
        calculateCreditScore();
        calculateAndDisplayResult();
        return;
    }

    if (steps[currentStep]) {
        displayMessage(steps[currentStep].message);
        displayOptions(currentStep);
    }
}

function calculateCreditScore() {
    const annualSalary = userData.annualSalary || 0;
    const loanRemaining = userData.loanRemaining || 0;
    const SOLID_MULTIPLIER = 9;
    const solidCreditTotal = Math.max(0, annualSalary * SOLID_MULTIPLIER - loanRemaining);
    const maxMultiplier = (annualSalary >= 1201) ? 12 : (annualSalary >= 801) ? 10 : 8;
    const maxCreditTotal = Math.max(0, annualSalary * maxMultiplier - loanRemaining);
    const taxMultiplier = (annualSalary >= 1801) ? 0.30 : (annualSalary >= 901) ? 0.25 : (annualSalary >= 696) ? 0.20 : 0.15;
    const calculatedTaxBenefit = Math.floor(annualSalary * taxMultiplier);

    userData.solidCredit = solidCreditTotal;
    userData.maxCredit = maxCreditTotal;
    userData.taxBenefitEstimate = { min: MIN_TAX_BENEFIT, max: calculatedTaxBenefit };
    userData.scoreForFiltering = solidCreditTotal + totalScore;
}

function calculateAndDisplayResult() {
    const annualSalary = userData.annualSalary || 0;
    const solidCredit = userData.solidCredit || 0;
    userData.totalScore = totalScore;

    if (annualSalary < MIN_ANNUAL_SALARY || solidCredit < CORE_THRESHOLD) {
        currentStep = 'end_video';
        const message = annualSalary < MIN_ANNUAL_SALARY ? `年収が${MIN_ANNUAL_SALARY}万円未満の場合、まずは動画での学習をお勧めしております。` : "診断の結果、まずは動画での学習をお勧めしております。";
        displayMessage(message);
        displayMessage(steps[currentStep].message);
        displayOptions(currentStep);
        sendDataToSheet(userData);
        return;
    }
    
    const maxCredit = userData.maxCredit || 0;
    const taxBenefitEstimate = userData.taxBenefitEstimate;
    const totalPotentialMan = maxCredit + taxBenefitEstimate.max;
    const totalPotentialDisplay = formatTotalPotential(totalPotentialMan);
    let loanMessage;
    if (totalPotentialMan >= HYPER_CORE_THRESHOLD_AMOUNT) {
        loanMessage = `<strong style="color:var(--jp-teal);">【AI診断による休眠信用試算（与信枠）】</strong><br>貴方の信用力は総額 ${totalPotentialDisplay}の超優良資産に匹敵します。このポテンシャルを活かすため、<strong class="score-value">部長クラスの敏腕コンサル</strong>が担当をお約束します。`;
    } else {
        loanMessage = `貴方の信用力は**総額 ${totalPotentialDisplay}** の休眠信用資産に匹敵します。あなたのお悩みをしっかり解決へ導く、<strong class="score-value">ベテランコンサル</strong>が担当をお約束します。`;
    }
    const solidValueDisplay = `${Math.floor(solidCredit).toLocaleString()} 万円`;
    const maxValueDisplay = `${Math.floor(maxCredit).toLocaleString()} 万円`;
    const taxValueDisplay = `${taxBenefitEstimate.min.toLocaleString()} 万円 〜 ${taxBenefitEstimate.max.toLocaleString()} 万円`;
    let currentMaxMultiplier = (annualSalary >= 1201) ? 12 : (annualSalary >= 801) ? 10 : 8;
    const scoreDisplayHtml = `
        <div class="double-score-container">
            <div class="score-block solid-block"><div class="block-title">① 堅実低金利安定枠（年収×9倍－残債）</div><div class="block-value" style="color: var(--jp-teal);">${solidValueDisplay}</div></div>
            <div class="score-block full-block"><div class="block-title">② 信用力ポテンシャル最大活用枠（年収×${currentMaxMultiplier}倍－残債）</div><div class="block-value" style="color: var(--jp-gold);">${maxValueDisplay}</div></div>
            <div class="score-block tax-block"><div class="block-title">③ TAX機会損失額（初年度概算）</div><div class="block-value" style="color: #d97706;">${taxValueDisplay}</div><p style="text-align: right; font-size: 0.8rem; color: #4a5568; margin-top: 5px;">※この効果は、中古物件なら初年度だけでなく、その後も4〜15年にわたって継続可能です</p></div>
        </div>
        <p style="margin-top: 15px;">${loanMessage}</p>`;
    messagesDiv.lastChild.innerHTML = steps['calc_score'].message + scoreDisplayHtml;
    
    currentStep = 'final_result';
    displayOptions(currentStep);

    sendDataToSheet(userData);
}

async function sendDataToSheet(data) {
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzlUz67WU1KI_GxSmhckR2duh94pnE5pOwMpr119rAjfDQNM1EF6s0CSv-SiXTVZb4L/exec';
    if (GAS_WEB_APP_URL.includes('ここに')) {
        console.warn('GASのURLが設定されていません。スプレッドシートへのデータ送信はスキップされました。');
        return;
    }
    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify(data)
        });
        console.log('Success: データは正常に送信リクエストされました。');
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayMessage(steps[currentStep].message);
    displayOptions(currentStep);
});

function formatTotalPotential(totalPotentialMan) {
    const oku = Math.floor(totalPotentialMan / 10000);
    if (totalPotentialMan < 10000) {
        return `<span class="okuen-main">${Math.floor(totalPotentialMan).toLocaleString()}</span><span class="man-remainder">万円</span>`;
    } else {
        return `<span class="okuen-main">約 ${oku.toLocaleString()}億円</span>`;
    }
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}