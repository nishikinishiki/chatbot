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

async function addBotMessage(messageText, isHtml = false, isError = false, isEbookBtn = false) {
    showTypingIndicator();
    let msgElem;
    if (isEbookBtn) {
        msgElem = createEbookButtonMessage(messageText);
        hideTypingIndicator();
    } else {
        msgElem = addMessage(messageText, 'bot', isHtml, isError);
    }
    scrollToBottom();
    return msgElem;
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

function disableInputs(container) {
    const inputs = container.querySelectorAll('input, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
    container.classList.add('inputs-disabled');
}


function displayNormalInput(question, callbacks) {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container-wrapper';

    inputContainer.innerHTML = `
        <div class="input-area" id="normalInputArea" style="display: flex;">
          <span id="inputIconContainer" class="input-icon-container"></span>
          <input type="text" id="userInput" placeholder="ここに入力">
          <button id="sendButton" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>`;
    
    dom.chatMessages.appendChild(inputContainer);
    scrollToBottom();

    const userInput = inputContainer.querySelector('#userInput');
    const sendButton = inputContainer.querySelector('#sendButton');
    const iconContainer = inputContainer.querySelector('#inputIconContainer');

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
    
    const handleSend = () => callbacks.onSend(userInput.value, inputContainer);

    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            e.preventDefault();
            handleSend();
        }
    });
}

function displayChoices(question, onSelect) {
    const choicesAreaWrapper = document.createElement('div');
    choicesAreaWrapper.className = 'input-container-wrapper';
    
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'choices-container';

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'choice-button';

        const isObjectOption = typeof option === 'object' && option.hasOwnProperty('label') && option.hasOwnProperty('value');
        
        const label = isObjectOption ? option.label : option;
        const value = isObjectOption ? option.value : option;

        button.innerHTML = label;
        button.dataset.value = value;

        button.addEventListener('click', () => onSelect({ label, value }, choicesAreaWrapper));
        choicesContainer.appendChild(button);
    });

    choicesAreaWrapper.appendChild(choicesContainer);
    
    dom.chatMessages.appendChild(choicesAreaWrapper);
    scrollToBottom();
}

function displayMultiChoices(question, onSelect) {
    const choicesAreaWrapper = document.createElement('div');
    choicesAreaWrapper.className = 'input-container-wrapper multi-choice-wrapper';
    
    const innerWrapper = document.createElement('div');
    innerWrapper.className = 'multi-choice-inner-wrapper';

    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'choices-container';

    const selectedValues = new Set();

    const submitActionsContainer = document.createElement('div');
    submitActionsContainer.className = 'multi-choice-submit-actions'; // カレンダーと類似のクラス名

    const submitButton = document.createElement('button');
    submitButton.className = 'multi-choice-submit-button'; // 新しい専用クラス
    submitButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    submitButton.disabled = true; // 最初は無効

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'choice-button';

        const isObjectOption = typeof option === 'object' && option.hasOwnProperty('label') && option.hasOwnProperty('value');
        const label = isObjectOption ? option.label : option;
        const value = isObjectOption ? option.value : option;

        button.innerHTML = `<span class="multi-choice-check">✓</span><span class="multi-choice-label">${label}</span>`;
        button.dataset.value = value;

        button.addEventListener('click', () => {
            if (selectedValues.has(value)) {
                selectedValues.delete(value);
                button.classList.remove('multi-selected');
            } else {
                selectedValues.add(value);
                button.classList.add('multi-selected');
            }
            
            // バリデーションチェックして決定ボタンの有効/無効を切り替え
            const currentSelectionArray = Array.from(selectedValues);
            const isValid = question.validation(currentSelectionArray);
            submitButton.disabled = !isValid;
            if (isValid) {
                submitButton.classList.add('enabled');
            } else {
                submitButton.classList.remove('enabled');
            }
        });
        choicesContainer.appendChild(button);
    });

    // 決定ボタンのイベント
    submitButton.addEventListener('click', () => {
        const selectedArray = Array.from(selectedValues);
        // ラベルは .multi-choice-label から取得
        const selectedLabels = Array.from(choicesContainer.querySelectorAll('.choice-button.multi-selected .multi-choice-label'))
                                   .map(span => span.innerText.replace(/<br>/g, ' '));
                                   
        // { values: [値...], labels: [ラベル...] } の形式でコールバックを呼ぶ
        onSelect({ values: selectedArray, labels: selectedLabels }, choicesAreaWrapper);
    });
    
    // 組み立て
    innerWrapper.appendChild(choicesContainer);
    submitActionsContainer.appendChild(submitButton);
    innerWrapper.appendChild(submitActionsContainer);
    choicesAreaWrapper.appendChild(innerWrapper);

    dom.chatMessages.appendChild(choicesAreaWrapper);
    scrollToBottom();
}

function displayPairedInputs(question, onSubmit) {
    const pairedInputAreaWrapper = document.createElement('div');
    pairedInputAreaWrapper.className = 'input-container-wrapper paired-input-area-wrapper';

    const pairedInputContainer = document.createElement('div');
    pairedInputContainer.className = 'paired-input-container';
    
    const inputsArray = [];

    question.inputs.forEach((inputConfig, index) => {
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

        if (index === question.inputs.length - 1) { 
            const sendPairedButton = document.createElement('button');
            sendPairedButton.className = 'paired-input-send-button'; 
            sendPairedButton.disabled = true; 
            sendPairedButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;            

            const handleSubmit = () => {
                const values = inputsArray.map(inp => inp.value.trim());
                if (question.combinedValidation(...values)) {
                    onSubmit(values, pairedInputAreaWrapper);
                } else {
                    addBotMessage(question.combinedErrorMessage, false, true);
                }
            };

            sendPairedButton.addEventListener('click', handleSubmit);

            const validateAndToggleButton = () => {
                const values = inputsArray.map(inp => inp.value.trim());
                if (question.combinedValidation(...values)) {
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
            inputRow.appendChild(sendPairedButton);

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
    
    dom.chatMessages.appendChild(pairedInputAreaWrapper);
    scrollToBottom();
    
    if (inputsArray.length > 0) inputsArray[0].focus();
}


function displayTimeTable(question, onSubmit) {
    const timeTableWrapper = document.createElement('div');
    timeTableWrapper.className = 'input-container-wrapper';

    const timeTableContainer = document.createElement('div');
    timeTableContainer.className = 'time-table-container';

    let currentStartDate = new Date();
    let selectedCell = null;
    const numDaysToShow = 7; // 表示日数を7日に固定

    const render = (startDate) => {
        // Sanitize the start date to prevent time-of-day issues
        startDate.setHours(0, 0, 0, 0);

        timeTableContainer.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'time-table-header';
        
        const prevButton = document.createElement('button');
        prevButton.className = 'time-table-nav';
        prevButton.innerHTML = '&lt;';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate <= today) {
            prevButton.disabled = true;
        } else {
            prevButton.onclick = () => {
                const newStartDate = new Date(startDate);
                newStartDate.setDate(newStartDate.getDate() - numDaysToShow);
                render(newStartDate);
            };
        }

        const monthYearDisplay = document.createElement('span');
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + numDaysToShow - 1);

        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        let monthYearText = `${startYear}年 ${startMonth}月`;
        if (startYear !== endYear) {
            monthYearText = `${startYear}年${startMonth}月 - ${endYear}年${endMonth}月`;
        } else if (startMonth !== endMonth) {
            monthYearText += ` - ${endMonth}月`;
        }
        monthYearDisplay.textContent = monthYearText;

        const nextButton = document.createElement('button');
        nextButton.className = 'time-table-nav';
        nextButton.innerHTML = '&gt;';
        nextButton.onclick = () => {
            const newStartDate = new Date(startDate);
            newStartDate.setDate(newStartDate.getDate() + numDaysToShow);
            render(newStartDate);
        };

        header.appendChild(prevButton);
        header.appendChild(monthYearDisplay);
        header.appendChild(nextButton);
        timeTableContainer.appendChild(header);

        const table = document.createElement('table');
        table.className = 'time-table';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        headerRow.insertCell(); // Empty cell for time labels

        const dates = [];
        for (let i = 0; i < numDaysToShow; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dates.push(date);
            const th = document.createElement('th');
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            th.innerHTML = `${date.getDate()}<br><span>(${dayOfWeek})</span>`;
            if (date.getDay() === 0) th.classList.add('sunday');
            if (date.getDay() === 6) th.classList.add('saturday');
            headerRow.appendChild(th);
        }

        const tbody = table.createTBody();
        const now = new Date(); // Get current date and time

        question.timeSlots.forEach(slot => {
            const row = tbody.insertRow();
            const labelCell = row.insertCell();
            labelCell.className = 'time-label-cell';
            labelCell.textContent = slot.label;

            dates.forEach(date => {
                const cell = row.insertCell();
                cell.className = 'time-slot-cell';
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                const dateString = `${y}/${m}/${d}`;

                let isDisabled = false;
                if (date < today) {
                    isDisabled = true;
                } else if (date.getTime() === today.getTime()) {
                    const slotStartHourText = slot.value.split('：')[0];
                    if (!isNaN(slotStartHourText)) {
                        const slotStartHour = parseInt(slotStartHourText, 10);
                        if (now.getHours() >= slotStartHour) {
                            isDisabled = true;
                        }
                    }
                }

                if (isDisabled) {
                    cell.classList.add('disabled');
                    cell.innerHTML = '<span>×</span>';
                } else {
                    cell.innerHTML = '<span>○</span>';
                    cell.dataset.date = dateString;
                    cell.dataset.value = slot.value;
                    cell.onclick = () => {
                        if (selectedCell) {
                            selectedCell.classList.remove('selected');
                        }
                        selectedCell = cell;
                        selectedCell.classList.add('selected');
                        submitButton.disabled = false;
                        submitButton.classList.add('enabled');
                    };
                }
            });
        });
        timeTableContainer.appendChild(table);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'time-table-actions';
        const submitButton = document.createElement('button');
        submitButton.className = 'time-table-submit-button';
        submitButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
        submitButton.disabled = !selectedCell;
        if (selectedCell) submitButton.classList.add('enabled');
        
        submitButton.onclick = () => {
            if (selectedCell) {
                const selectedDate = selectedCell.dataset.date;
                const selectedTimeValue = selectedCell.dataset.value;
                onSubmit({ date: selectedDate, time: selectedTimeValue }, timeTableWrapper);
            }
        };
        actionsDiv.appendChild(submitButton);
        timeTableContainer.appendChild(actionsDiv);
    };
    
    render(currentStartDate);

    timeTableWrapper.appendChild(timeTableContainer);
    dom.chatMessages.appendChild(timeTableWrapper);
    scrollToBottom();
}

function displayFinalConsentScreen(question, userResponses, initialQuestions, onSubmit) {
    if (!dom.chatMessages) return;
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
    summaryAdjacentConsentTextDiv.appendChild(document.createTextNode("に同意する。"));
    dom.chatMessages.appendChild(summaryAdjacentConsentTextDiv);

    const submitButtonAreaWrapper = document.createElement('div');
    submitButtonAreaWrapper.className = 'input-container-wrapper';

    const finalSubmitButton = document.createElement('button');
    finalSubmitButton.className = 'choice-button final-consent-submit-button';
    finalSubmitButton.innerHTML = `<span>${question.submit_button_text}</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    

    finalSubmitButton.addEventListener('click', () => {
        finalSubmitButton.disabled = true;
        onSubmit(submitButtonAreaWrapper);
    });
    submitButtonAreaWrapper.appendChild(finalSubmitButton);
    
    dom.chatMessages.appendChild(submitButtonAreaWrapper);
    scrollToBottom();
}

function displaySummaryArea(userResponses, initialQuestions) {
    const summaryMessageWrapper = createMessageWrapper('bot');
    summaryMessageWrapper.classList.add('summary-message-wrapper');
    const summaryArea = document.createElement('div');
    summaryArea.className = 'summary-area-wrapper';
    const summaryTitle = document.createElement('h3');
    summaryTitle.textContent = 'ご入力内容';
    summaryArea.appendChild(summaryTitle);

    const summaryList = document.createElement('ul');
    let nameDisplayed = false; 

    initialQuestions.forEach(q => {
        if (!q.item || q.answer_method === 'final-consent') return;

        if (q.key_group === "name_details") {
            if (!nameDisplayed) { 
                const kanjiLastName = userResponses["last_name"] || '';
                const kanjiFirstName = userResponses["first_name"] || '';
                if (kanjiLastName || kanjiFirstName) {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="summary-item-label">お名前 </span><span class="summary-item-value">${kanjiLastName} ${kanjiFirstName}</span>`;
                    summaryList.appendChild(li);
                }
                const kanaLastName = userResponses["last_name_kana"] || '';
                const kanaFirstName = userResponses["first_name_kana"] || '';
                if (kanaLastName || kanaFirstName) {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="summary-item-label">フリガナ </span><span class="summary-item-value">${kanaLastName} ${kanaFirstName}</span>`;
                    summaryList.appendChild(li);
                }
                nameDisplayed = true; 
            }
        } 
        else if (userResponses[q.key]) {
            let displayValue = userResponses[q.key];

            // 'single-choice'で、optionsがオブジェクト配列の場合、対応するlabelを探す
            if (q.answer_method === 'single-choice' && Array.isArray(q.options) && typeof q.options[0] === 'object') {
                const selectedOption = q.options.find(opt => opt.value === displayValue);
                if (selectedOption) {
                    displayValue = selectedOption.label.replace(/<br>/g, ' '); // labelを使い、<br>はスペースに置換
                }
            }
            
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span class="summary-item-label">${q.item}  </span><span class="summary-item-value">${displayValue}</span>`;
            summaryList.appendChild(listItem);
        }
    });

    summaryArea.appendChild(summaryList);
    const messageContent = summaryMessageWrapper.querySelector('.message');
    if (messageContent) {
        messageContent.innerHTML = ''; 
        messageContent.appendChild(summaryArea);
    }
    
    if (dom.chatMessages) {
        dom.chatMessages.appendChild(summaryMessageWrapper);
    }
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
}

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
        if (isHtml) {
            messageElement.innerHTML = text;
        } else {
            messageElement.textContent = text;
        }
    }
    
    if (dom.chatMessages) {
        dom.chatMessages.appendChild(wrapper);
    }
    return messageElement;
}

function createEbookButtonMessage(text) {
    const wrapper = createMessageWrapper('bot');
    const messageContainer = wrapper.querySelector('.message');

    if(messageContainer){
        messageContainer.classList.add('ebook-button-message-content');
        const buttonLink = document.createElement('a');
        buttonLink.href = "https://jpreturns.com/ebook/";
        buttonLink.target = "_blank";
        buttonLink.rel = "noopener noreferrer";
        buttonLink.className = "ebook-button-link";
        buttonLink.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        <span>${text}</span>
        `;
        messageContainer.appendChild(buttonLink);
    }
    
    if (dom.chatMessages) {
        dom.chatMessages.appendChild(wrapper);
    }
    return wrapper;
}


function displayBannerImage(imageUrl) {
    if (!dom.chatMessages) return;

    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'banner-image-wrapper';

    const bannerImage = document.createElement('img');
    bannerImage.src = imageUrl;
    bannerImage.alt = 'キャンペーンバナー';
    bannerImage.className = 'chat-banner-image';

    bannerImage.onerror = () => {
        console.error('バナー画像の読み込みに失敗しました:', imageUrl);
        bannerWrapper.remove();
    };

    bannerWrapper.appendChild(bannerImage);
    dom.chatMessages.prepend(bannerWrapper);
    scrollToBottom();
}