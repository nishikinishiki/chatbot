// **********************************************
// 1. 設定とスコアリングロジック
// **********************************************
const app = document.getElementById('chatbot-container');
const messagesDiv = document.getElementById('messages');
const optionsDiv = document.getElementById('options');
const BOT_IDENTIFIER = 'test';

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
        message: "ここではあなたの信用力を円換算で算出できます。<br>まずは、あなたの現在の課題に最も近いものをお選びください。",

        options: [
            { text: "A. 信用力・タックスコントロールを活用した資産拡大戦略を検討したい", next: 'Q1_age', score: 0 },
            { text: "B. 節税の仕組みが分からないので学びたい", next: 'Q0_tax_approach', score: 0 },
            { text: "C. 不動産相場が上がり過ぎて、買い時はもう遅いと感じている", next: 'Q0_bubble', score: 0 },
            { text: "D. 不動産投資を他社で検討中、または既に所有している", next: 'Q0_status', score: 0 }
        ]
    },
    'Q0_tax_approach': {
        message: "承知いたしました。<br>節税への取り組みについて、あなたの理想をお聞かせください。",
        options: [
            { text: "面倒なのは嫌なので、専門家に丸投げしたい", next: 'Q1_age', score: 0 },
            { text: "全部理解しないと気が済まないので、自分で学びたい", next: 'end_video', score: 0 }
        ]
    },
    'Q0_bubble': {
        message: "市場環境の懸念、承知いたしました。<br>では、もし仮に相場よりまだ割安で手に入る「勝ち筋の物件」があるとしたら、あなたの考えはどちらに近いですか？",
        options: [
            { text: "相場より割安で手に入る物件なら検討する価値あるかも", next: 'Q1_age', score: 0 },
            { text: "バブルは怖いから無理かも", next: 'end_video', score: 0 }
        ]
    },
    'Q0_status': {
        message: "承知いたしました。<br>現在のご状況をお聞かせください。",
        options: [
            { text: "他社で具体的な物件提案を受け、比較検討中", next: 'Q1_age', score: 2500 },
            { text: "既に不動産を所有しており、運用・出口戦略を相談したい", next: 'Q1_age', score: 1000 }
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
        message: "Q3. 住宅ローンや、投資物件ローン、車、その他本人名義の借り入れ（残債、万円単位）を概算でご入力ください。<br>ない場合は「0」をご入力ください。",
        is_input: true,
        next: 'Q4_experience'
    },
    'Q4_experience': {
        message: "Q4. 過去に不動産投資を検討し、具体的な物件選定やシミュレーションまで進めた経験はありますか？",
        options: [
            { text: "はい", next: 'Q5_barrier', score: 500 },
            { text: "いいえ", next: 'Q5_barrier', score: 0 },
        ]
    },
    'Q5_barrier': {
        message: "Q5. その他に、現在の検討状況で『解消できていない明確な課題』はありますか？",
        options: [
            { text: "はい", next: 'calc_score', score: 500 },
            { text: "いいえ", next: 'calc_score', score: 250 }
        ]
    },
    'calc_score': {
        message: "スコアリングが完了しました。<br>あなたの「休眠信用資産（与信枠）」のポテンシャルは以下の通りです",
        next: 'final_result',
        options: []
    },
    'final_result': {
        message: "",
        options: [
            { text: ``,
              action: () => window.open(CONSULT_URL, '_blank'),
              is_cta: true,
              class: 'final-cta' },
            { text: "② まずは無料動画を視聴する<br>（キャンペーン対象外）",
              action: () => window.open(VIDEO_URL, '_blank'),
              is_cta: true, 
              class: 'option-button-2' },
        ]
    },
    'end_video': {
        message: "まずは知識武装から始めるのが賢明です。<br>高年収者が確実に資産を築くための「タックスコントロール基礎動画」を無料公開しています。下記からご視聴ください。",
        options: [
            { text: "無料動画視聴ページへ進む", 
              action: () => window.open(VIDEO_URL, '_blank'),
              is_cta: true, 
              class: 'option-button' },
        ]
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
                // 'final-cta' クラスを持つボタンかどうかで判別
                if (option.class && option.class.includes('final-cta')) { 
                    const signClass = IS_CAMPAIGN_ACTIVE ? '' : 'inactive';
                    const signText = IS_CAMPAIGN_ACTIVE ? '✨ 社内福利厚生キャンペーン対象！<br>今すぐご予約ください ✨' : '（キャンペーン対象外）';
                    button.innerHTML = `
                        ① 【AI診断によるおすすめプラン】<br>専門家へ個別相談を予約する
                        <span class="cta-sign-flow">
                            専門スタッフが電話でヒアリングいたします。
                        </span>
                        <span class="cta-sign ${signClass}">${signText}</span>`;
                } else {
                    // 2番目のボタン (option-button-2)
                    button.innerHTML = option.text;
                }
            } else {
                // 'final_result' 以外のすべてのステップのボタン
                button.innerHTML = option.text;
            }
            button.onclick = () => handleOptionClick(option, stepName);
            optionsDiv.appendChild(button);
        });
    }
    scrollToBottom();
}

// ★変更点: エンターキーでの送信処理を追加
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
    
    const inputElement = document.getElementById('userInput');
    inputElement?.focus();

    // ▼▼▼ ここから追加 ▼▼▼
    // エンターキーが押されたら送信関数を実行
    inputElement?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // フォームのデフォルト送信をキャンセル
            handleInputSubmit(stepName, isNumber);
        }
    });
    // ▲▲▲ ここまで追加 ▲▲▲
}

async function handleInputSubmit(stepName, isNumber) {
    const inputElement = document.getElementById('userInput');
    // ★変更点: inputElementがnullの場合を考慮して早期リターン
    if (!inputElement) return; 

    const errorElement = document.getElementById('inputError');
    const inputValue = inputElement.value.trim();

    // ★変更点: errorElementがnullの場合も考慮
    if (errorElement) errorElement.textContent = ''; 

    if (!inputValue || (isNumber && (isNaN(parseInt(inputValue)) || parseInt(inputValue) < 0))) {
        if (errorElement) errorElement.textContent = isNumber ? '有効な数字を入力してください。' : '内容を入力してください。';
        return;
    }

    // ★変更点: 重複送信を防ぐため、一度ボタンを押したら入力をクリア
    optionsDiv.innerHTML = ''; 

    displayMessage(inputValue, true);
    
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
    if (option.action) {
        option.action(); // actionを実行
        return; // メッセージ追加やボタン消去を行わずに処理を終了
    }
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
        loanMessage = `<strong style="color:var(--jp-teal);">【AI診断による休眠信用試算（与信枠）】</strong><br>貴方の信用力は総額 ${totalPotentialDisplay}の超優良資産に匹敵します。<br>このポテンシャルを活かすため、<strong class="score-value">部長クラスのコンサル</strong>が担当をお約束します。`;
    } else {
        loanMessage = `貴方の信用力は総額 ${totalPotentialDisplay}の休眠信用資産に匹敵します。<br>あなたのお悩みを解決へ導く、<strong class="score-value">ベテランコンサル</strong>が担当をお約束します。`;
    }
    const solidValueDisplay = `${Math.floor(solidCredit).toLocaleString()}万円`;
    const maxValueDisplay = `${Math.floor(maxCredit).toLocaleString()}万円`;
    const taxValueDisplay = `${taxBenefitEstimate.min.toLocaleString()}万円 ~${taxBenefitEstimate.max.toLocaleString()}万円`;
    let currentMaxMultiplier = (annualSalary >= 1201) ? 12 : (annualSalary >= 801) ? 10 : 8;
    const scoreDisplayHtml = `
        <div class="double-score-container">
            <div class="score-block solid-block"><div class="block-title">① 堅実低金利安定枠<br>（年収×9倍－残債）</div><div class="block-value" style="color: var(--main);">${solidValueDisplay}</div></div>
            <div class="score-block full-block"><div class="block-title">② 信用力ポテンシャル最大活用枠<br>（年収×${currentMaxMultiplier}倍－残債）</div><div class="block-value" style="color: var(--jp-gold);">${maxValueDisplay}</div></div>
            <div class="score-block tax-block"><div class="block-title">③ 節税機会損失額（初年度概算）</div><div class="block-value" style="color: #d90606ff;">${taxValueDisplay}</div><p style="text-align: left; font-size: 0.8rem; color: #4a5568; margin-top: 5px;">※中古物件の場合は4〜15年にわたって継続可能</p></div>
        </div>
        <p style="margin-top: 15px;">${loanMessage}</p>`;
    messagesDiv.lastChild.innerHTML = steps['calc_score'].message + scoreDisplayHtml;
    
    currentStep = 'final_result';
    displayOptions(currentStep);

    sendDataToSheet(userData);
}

async function sendDataToSheet(data) {
    data.botIdentifier = BOT_IDENTIFIER;
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxwhMNiNUatpOaP6Dtok9pYUBBQO0_HZc7GCERMhJN3pnYy7Cr66ju6dPmthd1jSSTw/exec';
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