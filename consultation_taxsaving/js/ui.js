// --- 定数: アイコン (Feather Icons) ---
const ICONS = {
    ARROW_RIGHT: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    SEND: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    PHONE: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
    MAIL: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-mail"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    BOOK: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`
};

// --- DOM要素保持 ---
const dom = {
    chatContainer: null,
    chatMessages: null,
    progressBar: null,
    giftTermsModal: null,
    modalTitle: null,
    modalBody: null,
    modalCloseButton: null,
};

let loadingMessageElement = null;

// --- 初期化・基本操作 ---

function initializeUI() {
    dom.chatContainer = document.querySelector('.chat-container');
    dom.chatMessages = document.getElementById('chatMessages');
    dom.progressBar = document.getElementById('progressBar');
    dom.giftTermsModal = document.getElementById('giftTermsModal');
    dom.modalTitle = document.getElementById('modalTitle');
    dom.modalBody = document.getElementById('modalBody');
    dom.modalCloseButton = document.getElementById('modalCloseButton');

    if (dom.modalCloseButton) {
        dom.modalCloseButton.addEventListener('click', () => hideModal());
    }
    window.addEventListener('click', (e) => {
        if (e.target == dom.giftTermsModal) hideModal();
    });
}

function adjustChatHeight() {
    if (dom.chatContainer) dom.chatContainer.style.height = window.innerHeight + 'px';
}

function updateProgressBar(progress) {
    if (dom.progressBar) dom.progressBar.style.width = Math.min(progress, 100) + '%';
}

function clearChatMessages() {
    if (dom.chatMessages) dom.chatMessages.innerHTML = '';
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        if (dom.chatMessages) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    });
}

// --- メッセージ生成 ---

function createMessageWrapper(sender) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', `${sender}-message-wrapper`);

    if (sender === 'bot') {
        const botIcon = document.createElement('div');
        botIcon.className = 'bot-icon';
        if (typeof BOT_ICON_URL !== 'undefined' && BOT_ICON_URL) {
            botIcon.style.backgroundImage = `url('${BOT_ICON_URL}')`;
        }
        wrapper.appendChild(botIcon);
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    wrapper.appendChild(messageElement);
    return wrapper;
}

async function addBotMessage(text, isHtml = false, isError = false, isEbookBtn = false) {
    let msgElem;
    if (isEbookBtn) {
        msgElem = createEbookButtonMessage(text);
    } else {
        const wrapper = createMessageWrapper('bot');
        msgElem = wrapper.querySelector('.message');
        if (isError) msgElem.classList.add('error-text');
        isHtml ? (msgElem.innerHTML = text) : (msgElem.textContent = text);
        dom.chatMessages.appendChild(wrapper);
    }
    scrollToBottom();
    return msgElem;
}

function addUserMessage(text) {
    const wrapper = createMessageWrapper('user');
    wrapper.querySelector('.message').textContent = text;
    dom.chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function createEbookButtonMessage(text) {
    const wrapper = createMessageWrapper('bot');
    const container = wrapper.querySelector('.message');
    container.classList.add('ebook-button-message-content');

    const link = document.createElement('a');
    link.href = "https://jpreturns.com/ebook/";
    link.target = "_blank";
    link.className = "ebook-button-link";
    link.innerHTML = `${ICONS.BOOK}<span>${text}</span>`;
    
    container.appendChild(link);
    dom.chatMessages.appendChild(wrapper);
    return wrapper;
}

// ==========================================
// ★新規: UIラッパー生成・共通関数
// ==========================================
function createInputWrapper(extraClasses = '') {
    const wrapper = document.createElement('div');
    wrapper.className = `input-container-wrapper ${extraClasses}`.trim();
    return wrapper;
}

function mountInputWrapper(wrapper) {
    dom.chatMessages.appendChild(wrapper);
    scrollToBottom();
}

// ==========================================
// ★新規: オートフォーマット（自動整形）関数
// ==========================================
function formatInputValue(value, type, key) {
    let val = value;
    
    // 1. 全角英数記号を半角に変換 (電話番号・メール)
    if (type === 'tel' || type === 'email' || key === 'email_address') {
        val = val.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    }
    
    // 2. ハイフン等を除去 (電話番号)
    if (type === 'tel') {
        val = val.replace(/[ー－‐-]/g, '');
    }
    
    // 3. ひらがなを全角カタカナに変換 (フリガナ)
    if (key && key.includes('kana')) {
        val = val.replace(/[ぁ-ん]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
    }
    
    return val;
}

// --- 入力UI生成 ---

function disableInputs(container) {
    container.querySelectorAll('input, button').forEach(el => el.disabled = true);
    container.classList.add('inputs-disabled');
}

// 通常入力 (電話・メール等)
function displayNormalInput(question, callbacks) {
    // 共通化関数を使用
    const wrapper = createInputWrapper('column-layout');

    wrapper.innerHTML = `
        <div class="input-area">
          <span class="input-icon-container"></span>
          <input type="text" class="user-input-field" placeholder="${question.placeholder || 'ここに入力'}">
          <button class="circular-submit-btn" disabled>${ICONS.ARROW_RIGHT}</button>
        </div>
        <div class="input-error-message">${question.errorMessage || '入力内容を確認してください。'}</div>`;
    
    mountInputWrapper(wrapper);

    const input = wrapper.querySelector('.user-input-field');
    const btn = wrapper.querySelector('.circular-submit-btn');
    const iconBox = wrapper.querySelector('.input-icon-container');
    const errorMsg = wrapper.querySelector('.input-error-message');

    if (question.type === 'tel') iconBox.innerHTML = ICONS.PHONE;
    if (question.type === 'email') iconBox.innerHTML = ICONS.MAIL;

    input.type = question.type || "text";
    input.focus();

    let hasInteracted = false;
    let isComposing = false; // IME入力中フラグ

    const checkInput = () => {
        const val = input.value.trim();
        const isValid = question.validation(val);
        
        btn.disabled = !isValid;
        btn.classList.toggle('enabled', isValid);
        
        if (isValid) {
            errorMsg.classList.remove('show');
        } else if (hasInteracted && val.length > 0) {
            errorMsg.classList.add('show');
        } else {
            errorMsg.classList.remove('show');
        }
    };

    // 日本語入力（IME）の開始・終了を検知
    input.addEventListener('compositionstart', () => isComposing = true);
    input.addEventListener('compositionend', () => {
        isComposing = false;
        input.value = formatInputValue(input.value, question.type, question.key);
        checkInput();
    });

    input.addEventListener('input', () => {
        // IME入力中でなければ即座にフォーマット
        if (!isComposing) {
            input.value = formatInputValue(input.value, question.type, question.key);
            checkInput();
        }
    });

    input.addEventListener('blur', () => {
        hasInteracted = true;
        // フォーカスが外れた際にも念のためフォーマット
        input.value = formatInputValue(input.value, question.type, question.key);
        checkInput();
    });
    
    const handleSend = () => callbacks.onSend(input.value, wrapper);
    btn.addEventListener('click', handleSend);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!btn.disabled) {
                handleSend();
            } else {
                hasInteracted = true;
                checkInput();
            }
        }
    });
}

// 単一選択
function displayChoices(question, onSelect) {
    const wrapper = createInputWrapper();
    const container = document.createElement('div');
    container.className = 'choices-container';

    question.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-button';
        const label = typeof opt === 'object' ? opt.label : opt;
        const value = typeof opt === 'object' ? opt.value : opt;
        btn.innerHTML = label;
        btn.onclick = () => onSelect({ label, value }, wrapper);
        container.appendChild(btn);
    });

    wrapper.appendChild(container);
    mountInputWrapper(wrapper);
}

// 複数選択
function displayMultiChoices(question, onSelect) {
    const wrapper = createInputWrapper('multi-choice-wrapper');
    
    const inner = document.createElement('div');
    inner.className = 'multi-choice-inner-wrapper';
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'choices-container';

    const selectedValues = new Set();
    const submitBtn = document.createElement('button');
    submitBtn.className = 'circular-submit-btn'; // クラス統合
    submitBtn.innerHTML = ICONS.SEND;
    submitBtn.disabled = true;

    question.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-button';
        const label = typeof opt === 'object' ? opt.label : opt;
        const value = typeof opt === 'object' ? opt.value : opt;

        btn.innerHTML = `<span class="multi-choice-check">✓</span><span class="multi-choice-label">${label}</span>`;
        btn.onclick = () => {
            selectedValues.has(value) ? selectedValues.delete(value) : selectedValues.add(value);
            btn.classList.toggle('multi-selected');
            const isValid = question.validation(Array.from(selectedValues));
            submitBtn.disabled = !isValid;
            submitBtn.classList.toggle('enabled', isValid);
        };
        choicesContainer.appendChild(btn);
    });

    submitBtn.onclick = () => {
        const labels = Array.from(wrapper.querySelectorAll('.choice-button.multi-selected .multi-choice-label')).map(s => s.innerText);
        onSelect({ values: Array.from(selectedValues), labels }, wrapper);
    };

    inner.appendChild(choicesContainer);
    const actions = document.createElement('div');
    actions.className = 'multi-choice-submit-actions';
    actions.appendChild(submitBtn);
    inner.appendChild(actions);
    wrapper.appendChild(inner);
    mountInputWrapper(wrapper);
}

// ペア入力 (名前・フリガナ)
function displayPairedInputs(question, onSubmit) {
    const wrapper = createInputWrapper('column-layout');

    let html = `<div class="paired-input-container">`;
    question.inputs.forEach((conf, idx) => {
        const isLast = idx === question.inputs.length - 1;
        html += `
            <div class="paired-input-row">
                <label>${conf.label}</label>
                <input type="${conf.type || 'text'}" placeholder="${conf.placeholder || ''}" data-idx="${idx}">
                ${isLast 
                    ? `<button class="circular-submit-btn" disabled>${ICONS.ARROW_RIGHT}</button>` 
                    : `<div class="circular-submit-btn placeholder"></div>`
                }
            </div>`;
    });
    html += `</div>`;
    html += `<div class="input-error-message">${question.combinedErrorMessage || '入力内容を確認してください。'}</div>`;
    
    wrapper.innerHTML = html;
    mountInputWrapper(wrapper);

    const inputs = Array.from(wrapper.querySelectorAll('input'));
    const btn = wrapper.querySelector('button.circular-submit-btn'); // クラス統合
    const errorMsg = wrapper.querySelector('.input-error-message');

    let hasInteractedLast = false;

    const checkValidation = () => {
        const vals = inputs.map(i => i.value.trim());
        const isValid = question.combinedValidation(...vals);
        
        btn.disabled = !isValid;
        btn.classList.toggle('enabled', isValid);

        const hasAnyInput = vals.some(v => v.length > 0);
        
        if (isValid) {
            errorMsg.classList.remove('show');
        } else if (hasInteractedLast && hasAnyInput) {
            errorMsg.classList.add('show');
        } else {
            errorMsg.classList.remove('show');
        }
        
        return { isValid, vals };
    };

    const handleFinalSubmit = () => {
        const { isValid, vals } = checkValidation();
        if (isValid) onSubmit(vals, wrapper);
    };

    btn.addEventListener('click', handleFinalSubmit);

    inputs.forEach((input, idx) => {
        const conf = question.inputs[idx];
        let isComposing = false;

        input.addEventListener('compositionstart', () => isComposing = true);
        input.addEventListener('compositionend', () => {
            isComposing = false;
            input.value = formatInputValue(input.value, conf.type, conf.key);
            checkValidation();
        });

        input.addEventListener('input', () => {
            if (!isComposing) {
                input.value = formatInputValue(input.value, conf.type, conf.key);
                checkValidation();
            }
        });

        if (idx === inputs.length - 1) {
            input.addEventListener('blur', () => {
                hasInteractedLast = true;
                input.value = formatInputValue(input.value, conf.type, conf.key);
                checkValidation();
            });
        } else {
            input.addEventListener('blur', () => {
                input.value = formatInputValue(input.value, conf.type, conf.key);
                checkValidation();
            });
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                } else {
                    if (!btn.disabled) {
                        handleFinalSubmit();
                    } else {
                        hasInteractedLast = true;
                        checkValidation();
                    }
                }
            }
        });
    });

    inputs[0].focus();
}

// カレンダー形式
function displayTimeTable(question, onSubmit) {
    const wrapper = createInputWrapper();
    const container = document.createElement('div');
    container.className = 'time-table-container';

    let currentStart = new Date();
    let selected = null;

    const render = (startDate) => {
        startDate.setHours(0,0,0,0);
        container.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'time-table-header';
        
        const prev = document.createElement('button');
        prev.className = 'time-table-nav';
        prev.innerHTML = '&lt;';
        const today = new Date(); today.setHours(0,0,0,0);
        prev.disabled = startDate <= today;
        prev.onclick = () => { startDate.setDate(startDate.getDate() - 7); render(startDate); };

        const next = document.createElement('button');
        next.className = 'time-table-nav';
        next.innerHTML = '&gt;';
        next.onclick = () => { startDate.setDate(startDate.getDate() + 7); render(startDate); };

        header.append(prev, `${startDate.getFullYear()}年 ${startDate.getMonth()+1}月`, next);
        container.appendChild(header);

        const table = document.createElement('table');
        table.className = 'time-table';
        const thr = table.createTHead().insertRow(); thr.insertCell();
        const dates = [];
        for(let i=0; i<7; i++){
            const d = new Date(startDate); d.setDate(d.getDate()+i); dates.push(d);
            const th = document.createElement('th');
            if (d.getDay() === 0) th.classList.add('sunday');
            if (d.getDay() === 6) th.classList.add('saturday');
            th.innerHTML = `${d.getDate()}<br><span>(${['日','月','火','水','木','金','土'][d.getDay()]})</span>`;
            thr.appendChild(th);
        }

        const tbody = table.createTBody();
        question.timeSlots.forEach(slot => {
            const tr = tbody.insertRow();
            tr.insertCell().textContent = slot.label;
            dates.forEach(d => {
                const cell = tr.insertCell();
                cell.className = 'time-slot-cell';
                const isPast = d < today || (d.getTime() === today.getTime() && new Date().getHours() >= parseInt(slot.value));
                if(isPast) {
                    cell.classList.add('disabled'); cell.innerHTML = '×';
                } else {
                    cell.innerHTML = '○';
                    cell.onclick = () => {
                        if(selected) selected.classList.remove('selected');
                        selected = cell; cell.classList.add('selected');
                        subBtn.disabled = false; subBtn.classList.add('enabled');
                        selected.dataset.date = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
                        selected.dataset.val = slot.value;
                    };
                }
            });
        });
        container.appendChild(table);

        const subBtn = document.createElement('button');
        subBtn.className = 'circular-submit-btn'; // クラス統合
        subBtn.innerHTML = ICONS.ARROW_RIGHT;
        subBtn.disabled = true;
        subBtn.onclick = () => onSubmit({ date: selected.dataset.date, time: selected.dataset.val }, wrapper);
        
        const act = document.createElement('div'); act.className = 'time-table-actions';
        act.appendChild(subBtn);
        container.appendChild(act);
    };

    render(currentStart);
    wrapper.appendChild(container);
    mountInputWrapper(wrapper);
}

// 最終確認画面
function displayFinalConsentScreen(question, userResponses, initialQuestions, onSubmit) {
    displaySummaryArea(userResponses, initialQuestions);
    
    const consentText = document.createElement('div');
    consentText.className = 'summary-adjacent-consent-text';
    consentText.innerHTML = `<a href="${question.privacy_policy_url}" target="_blank">${question.privacy_policy_link_text}</a>に同意する。`;
    dom.chatMessages.appendChild(consentText);

    const wrapper = createInputWrapper();
    const btn = document.createElement('button');
    // ※ここのボタンだけはテキストを含む横長なので、circular-submit-btnにはしません
    btn.className = 'choice-button final-consent-submit-button';
    btn.innerHTML = `<span>${question.submit_button_text}</span>${ICONS.SEND}`;
    btn.onclick = () => { btn.disabled = true; onSubmit(wrapper); };
    
    wrapper.appendChild(btn);
    mountInputWrapper(wrapper);
}

// 入力サマリー表示
function displaySummaryArea(responses, questions) {
    const wrapper = createMessageWrapper('bot');
    wrapper.classList.add('summary-message-wrapper');
    const area = document.createElement('div');
    area.className = 'summary-area-wrapper';
    area.innerHTML = `<h3>ご入力内容</h3><ul></ul>`;
    const list = area.querySelector('ul');

    let nameDone = false;
    questions.forEach(q => {
        // 表示項目名（item）がない、または最終確認自体はスキップ
        if (!q.item || q.answer_method === 'final-consent') return;

        // 1. お名前・フリガナの処理 (key_group判定)
        if (q.key_group === "name_details") {
            if (!nameDone) {
                list.innerHTML += `<li><span class="summary-item-label">お名前 </span><span class="summary-item-value">${responses.last_name||''} ${responses.first_name||''}</span></li>`;
                list.innerHTML += `<li><span class="summary-item-label">フリガナ </span><span class="summary-item-value">${responses.last_name_kana||''} ${responses.first_name_kana||''}</span></li>`;
                nameDone = true;
            }
        } 
        // 2. ★修正箇所: タイムテーブル（面談希望日時）の処理
        // keys オブジェクトから日付と時間をそれぞれ抽出して結合します
        else if (q.answer_method === 'time-table' && q.keys) {
            const dateVal = responses[q.keys.date];
            const timeVal = responses[q.keys.time];
            if (dateVal && timeVal) {
                // 保存されている値（例: "10：00～12：00"）を、
                // 表示用のラベル（例: "10:00~"）に変換してスッキリ表示させます
                const timeLabel = q.timeSlots.find(slot => slot.value === timeVal)?.label || timeVal;
                list.innerHTML += `<li><span class="summary-item-label">${q.item} </span><span class="summary-item-value">${dateVal} ${timeLabel}</span></li>`;
            }
        }
        // 3. 通常の入力項目の処理 (単一の 'key' を持つもの)
        else if (q.key && responses[q.key]) {
            let val = responses[q.key];
            
            // 単一選択の場合は、保存値ではなく表示用のラベルを探して表示
            if (q.answer_method === 'single-choice' && Array.isArray(q.options)) {
                const opt = q.options.find(o => o.value === val);
                if (opt) val = opt.label.replace(/<br>/g, ' ');
            }
            // 複数選択の場合は、セミコロン区切りを「、 」に変えて読みやすくします
            if (q.answer_method === 'multi-choice') {
                val = val.replace(/;/g, '、 ');
            }

            list.innerHTML += `<li><span class="summary-item-label">${q.item} </span><span class="summary-item-value">${val}</span></li>`;
        }
    });

    wrapper.querySelector('.message').appendChild(area);
    dom.chatMessages.appendChild(wrapper);
}

// --- その他UI操作 ---

function showLoadingMessage() {
    if (loadingMessageElement) return;
    const wrapper = createMessageWrapper('bot');
    const msg = wrapper.querySelector('.message');
    msg.innerHTML = `情報を送信中<span class="loading-dots"><span></span><span></span><span></span></span>`;
    dom.chatMessages.appendChild(wrapper);
    loadingMessageElement = wrapper;
    scrollToBottom();
}

function hideLoadingMessage() {
    if (loadingMessageElement) { loadingMessageElement.remove(); loadingMessageElement = null; }
}

function showModal(title, content) {
    dom.modalTitle.textContent = title;
    dom.modalBody.innerHTML = content;
    dom.giftTermsModal.classList.add('show'); 
}

function hideModal() {
    dom.giftTermsModal.classList.remove('show'); 
}

function displayBannerImage(url) {
    const wrapper = document.createElement('div');
    wrapper.className = 'banner-image-wrapper';
    const img = document.createElement('img');
    img.src = url; img.className = 'chat-banner-image';
    img.onerror = () => wrapper.remove();
    wrapper.appendChild(img);
    dom.chatMessages.prepend(wrapper);
}