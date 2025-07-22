// js/ui.js
// このファイルはUIの生成と操作に特化します。

// --- DOM要素の保持用オブジェクト ---
const dom = {
    chatContainer: null,
    chatMessages: null,
    inputMethodWrapper: null,
    progressBar: null,
    giftTermsModal: null,
    modalTitle: null,
    modalBody: null,
    modalCloseButton: null,
};

let isBotTyping = false;
let loadingMessageElement = null;

// --- Public UI Functions ---

function adjustChatHeight() {
    if (dom.chatContainer) {
        dom.chatContainer.style.height = window.innerHeight + 'px';
    }
}

function initializeUI() {
    dom.chatContainer = document.querySelector('.chat-container');
    dom.chatMessages = document.getElementById('chatMessages');
    dom.inputMethodWrapper = document.getElementById('inputMethodWrapper');
    dom.progressBar = document.getElementById('progressBar');
    dom.giftTermsModal = document.getElementById('giftTermsModal');
    dom.modalTitle = document.getElementById('modalTitle');
    dom.modalBody = document.getElementById('modalBody');
    dom.modalCloseButton = document.getElementById('modalCloseButton');

    if (dom.modalCloseButton) {
        dom.modalCloseButton.addEventListener('click', () => hideModal());
    }
    window.addEventListener('click', (event) => {
        if (event.target == dom.giftTermsModal) {
            hideModal();
        }
    });
}


function updateProgressBar(progress) {
    if (dom.progressBar) {
        dom.progressBar.style.width = Math.min(progress, 100) + '%';
    }
}

function clearChatMessages() {
    if (dom.chatMessages) {
        dom.chatMessages.innerHTML = '';
    }
}

function addBotMessage(messageText, isHtml = false, isError = false, isEbookBtn = false) {
    showTypingIndicator();
    return new Promise(resolve => {
        setTimeout(() => {
            let msgElem;
            if (isEbookBtn) {
                msgElem = createEbookButtonMessage(messageText);
                hideTypingIndicator();
            } else {
                msgElem = addMessage(messageText, 'bot', isHtml, isError);
            }
            scrollToBottom();
            resolve(msgElem);
        }, 100 + Math.random() * 100);
    });
}

function addUserMessage(messageText) {
    addMessage(messageText, 'user');
    scrollToBottom();
}

function showLoadingMessage() {
    if (loadingMessageElement) return;
    const messageWrapper = createMessageWrapper('bot');
    const messageElement = messageWrapper.querySelector('.message');
    if (messageElement) {
        messageElement.textContent = "情報を送信中";
        const dots = document.createElement('span');
        dots.className = 'loading-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        messageElement.appendChild(dots);
    }
    if (dom.chatMessages) dom.chatMessages.appendChild(messageWrapper);
    loadingMessageElement = messageWrapper;
    scrollToBottom();
}

function hideLoadingMessage() {
    if (loadingMessageElement) {
        loadingMessageElement.remove();
        loadingMessageElement = null;
    }
}

function showModal(title, content) {
    if (dom.modalTitle) dom.modalTitle.textContent = title;
    if (dom.modalBody) dom.modalBody.innerHTML = content;
    if (dom.giftTermsModal) dom.giftTermsModal.style.display = 'flex';
}

function hideModal() {
    if (dom.giftTermsModal) dom.giftTermsModal.style.display = 'none';
}

function clearInputArea() {
    if (dom.inputMethodWrapper) {
        dom.inputMethodWrapper.innerHTML = '';
        dom.inputMethodWrapper.style.display = 'none';
    }
}

function displayNormalInput(question, callbacks) {
    if (!dom.inputMethodWrapper) return;
    dom.inputMethodWrapper.style.display = 'flex';
    dom.inputMethodWrapper.innerHTML = `
        <div class="input-area" id="normalInputArea" style="display: flex;">
          <span id="inputIconContainer" class="input-icon-container"></span>
          <input type="text" id="userInput" placeholder="ここに入力">
          <button id="sendButton" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>`;

    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const iconContainer = document.getElementById('inputIconContainer');

    if (question.type === 'tel') {
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
    } else if (question.type === 'email') {
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-mail"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
    }

    userInput.type = question.type || "text";
    userInput.placeholder = question.placeholder || `ここに入力`;
    userInput.focus();

    userInput.addEventListener('input', () => {
        if (question.validation(userInput.value.trim())) {
            sendButton.disabled = false;
            sendButton.classList.add('enabled');
            userInput.classList.remove('input-error');
        } else {
            sendButton.disabled = true;
            sendButton.classList.remove('enabled');
        }
    });

    applyRippleEffect(sendButton);

    sendButton.addEventListener('click', () => callbacks.onSend(userInput.value));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            e.preventDefault();
            callbacks.onSend(userInput.value);
        }
    });
}

function displayChoices(question, onSelect) {
    if (!dom.inputMethodWrapper) return;
    dom.inputMethodWrapper.style.display = 'block';
    const choicesAreaWrapper = document.createElement('div');
    choicesAreaWrapper.className = 'choices-area-wrapper';
    
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'choices-container';

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = option;
        button.dataset.value = option;
        applyRippleEffect(button);
        button.addEventListener('click', () => onSelect(option));
        choicesContainer.appendChild(button);
    });

    choicesAreaWrapper.appendChild(choicesContainer);
    dom.inputMethodWrapper.innerHTML = ''; 
    dom.inputMethodWrapper.appendChild(choicesAreaWrapper);
}

function displayPairedInputs(pairData, onSubmit) {
    if (!dom.inputMethodWrapper) return;
    dom.inputMethodWrapper.style.display = 'block';
    
    const pairedInputAreaWrapper = document.createElement('div');
    pairedInputAreaWrapper.className = 'paired-input-area-wrapper';

    const pairedInputContainer = document.createElement('div');
    pairedInputContainer.className = 'paired-input-container';
    
    const inputsArray = [];

    pairData.inputs.forEach((inputConfig, index) => {
        const inputRow = document.createElement('div');
        inputRow.className = 'paired-input-row';
        
        const label = document.createElement('label');
        label.textContent = inputConfig.label;
        
        const input = document.createElement('input');
        input.type = inputConfig.type || "text";
        input.placeholder = inputConfig.placeholder || "";
        input.dataset.key = inputConfig.key;
        inputsArray.push(input);

        inputRow.appendChild(label);
        inputRow.appendChild(input);

        if (index === pairData.inputs.length - 1) { 
            const sendPairedButton = document.createElement('button');
            sendPairedButton.className = 'paired-input-send-button'; 
            sendPairedButton.disabled = true; 
            sendPairedButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
            
            applyRippleEffect(sendPairedButton);

            sendPairedButton.addEventListener('click', () => {
                const values = inputsArray.map(inp => inp.value.trim());
                if (pairData.combinedValidation(...values)) {
                    onSubmit(values);
                } else {
                    addBotMessage(pairData.combinedErrorMessage, false, true);
                }
            });

            inputRow.appendChild(sendPairedButton);

            const validateAndToggleButton = () => {
                const values = inputsArray.map(inp => inp.value.trim());
                if (pairData.combinedValidation(...values)) {
                    sendPairedButton.disabled = false;
                    sendPairedButton.classList.add('enabled');
                } else {
                    sendPairedButton.disabled = true;
                    sendPairedButton.classList.remove('enabled');
                }
            };
            inputsArray.forEach(inp => inp.addEventListener('input', validateAndToggleButton));
            
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter' && !sendPairedButton.disabled) {
                    event.preventDefault(); 
                    sendPairedButton.click();
                }
            });
        } else {
            const placeholderButton = document.createElement('div');
            placeholderButton.className = 'paired-input-send-button placeholder';
            inputRow.appendChild(placeholderButton);
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    inputsArray[index + 1]?.focus();
                }
            });
        }
        pairedInputContainer.appendChild(inputRow);
    });

    pairedInputAreaWrapper.appendChild(pairedInputContainer);
    dom.inputMethodWrapper.innerHTML = '';
    dom.inputMethodWrapper.appendChild(pairedInputAreaWrapper);
    
    if (inputsArray.length > 0) inputsArray[0].focus();
}

function displayCalendar(question, onSubmit) {
    // ... (この関数は変更なし) ...
}

function displayFinalConsentScreen(question, userResponses, initialQuestions, onSubmit) {
    if (!dom.inputMethodWrapper || !dom.chatMessages) return;
    displaySummaryArea(userResponses, initialQuestions);
    
    const summaryAdjacentConsentTextDiv = document.createElement('div');
    summaryAdjacentConsentTextDiv.className = 'summary-adjacent-consent-text';
    const privacyLinkSmall = document.createElement('a');
    privacyLinkSmall.href = question.privacy_policy_url;
    privacyLinkSmall.target = "_blank";
    privacyLinkSmall.rel = "noopener noreferrer";
    privacyLinkSmall.textContent = question.privacy_policy_link_text;
    const giftTermsLinkSmall = document.createElement('a');
    giftTermsLinkSmall.href = "#";
    giftTermsLinkSmall.textContent = question.gift_terms_link_text;
    giftTermsLinkSmall.onclick = (e) => {
        e.preventDefault();
        showModal(question.gift_terms_popup_title, question.gift_terms_popup_content);
    };
    summaryAdjacentConsentTextDiv.appendChild(privacyLinkSmall);
    summaryAdjacentConsentTextDiv.appendChild(document.createTextNode("・"));
    summaryAdjacentConsentTextDiv.appendChild(giftTermsLinkSmall);
    summaryAdjacentConsentTextDiv.appendChild(document.createTextNode("に同意の上、送信してください。"));
    dom.chatMessages.appendChild(summaryAdjacentConsentTextDiv);

    dom.inputMethodWrapper.style.display = 'block';
    const submitButtonAreaWrapper = document.createElement('div');
    submitButtonAreaWrapper.className = 'choices-area-wrapper';
    const finalSubmitButton = document.createElement('button');
    finalSubmitButton.className = 'choice-button final-consent-submit-button';
    finalSubmitButton.innerHTML = `<span>${question.submit_button_text}</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    
    applyRippleEffect(finalSubmitButton);

    finalSubmitButton.addEventListener('click', () => {
        finalSubmitButton.disabled = true;
        onSubmit();
    });
    submitButtonAreaWrapper.appendChild(finalSubmitButton);
    dom.inputMethodWrapper.innerHTML = '';
    dom.inputMethodWrapper.appendChild(submitButtonAreaWrapper);

    scrollToBottom();
}

function displaySummaryArea(userResponses, initialQuestions) {
    // ... (この関数は変更なし) ...
}

// --- Private Helper Functions ---
function scrollToBottom() {
    requestAnimationFrame(() => {
        if (dom.chatMessages) {
            dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
        }
    });
}

function showTypingIndicator() {
    return;
}

function hideTypingIndicator() {
    if (!dom.chatMessages) return;
    const indicator = dom.chatMessages.querySelector('.typing-indicator-wrapper');
    if (indicator) indicator.remove();
    isBotTyping = false;
}

function createMessageWrapper(sender) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', `${sender}-message-wrapper`);

    if (sender === 'bot') {
        const botIcon = document.createElement('div');
        botIcon.className = 'bot-icon';
        if (typeof BOT_ICON_URL !== 'undefined' && BOT_ICON_URL !== 'YOUR_BOT_ICON_URL_HERE') {
            botIcon.style.backgroundImage = `url('${BOT_ICON_URL}')`;
        }
        wrapper.appendChild(botIcon);
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    wrapper.appendChild(messageElement);

    return wrapper;
}

function addMessage(text, sender, isHtml = false, isError = false) {
    hideTypingIndicator();
    const wrapper = createMessageWrapper(sender);
    const messageElement = wrapper.querySelector('.message');
    
    if(messageElement){
        if (isError) messageElement.classList.add('error-text');
        if (isHtml) messageElement.innerHTML = text;
        else messageElement.textContent = text;
    }
    
    if (dom.chatMessages) {
        dom.chatMessages.appendChild(wrapper);
    }
    return messageElement;
}

function createEbookButtonMessage(text) {
    // ... (この関数は変更なし) ...
}

function applyRippleEffect(buttonElement) {
    buttonElement.addEventListener('mousedown', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    });
}

// ▼▼▼【ここから新規追加】▼▼▼
/**
 * バナー画像をチャットエリアの最上部に表示する関数
 * @param {string} imageUrl - 表示する画像のURL
 */
function displayBannerImage(imageUrl) {
    if (!dom.chatMessages) return;

    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'banner-image-wrapper';

    const bannerImage = document.createElement('img');
    bannerImage.src = imageUrl;
    bannerImage.alt = 'キャンペーンバナー'; // 代替テキスト
    bannerImage.className = 'chat-banner-image';

    // 画像の読み込みに失敗した場合のエラーハンドリング
    bannerImage.onerror = () => {
        console.error('バナー画像の読み込みに失敗しました:', imageUrl);
        bannerWrapper.remove(); // 読み込めなかったら要素ごと削除
    };

    bannerWrapper.appendChild(bannerImage);
    // 最初のメッセージの前にバナーを挿入
    dom.chatMessages.prepend(bannerWrapper);
    scrollToBottom();
}
// ▲▲▲【ここまで新規追加】▲▲▲
