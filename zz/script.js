import { GIFT_TERMS } from './gift-terms.js';

document.addEventListener('DOMContentLoaded', () => {
    // ========================================================
    // 設定・定数
    // ========================================================
    // ★GAS URL（資料請求用のエンドポイントに差し替えてください）
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwLMap6IVQPwzVN6YahDid_2DS26Uk0m_BWk2GeLA2wugI5FhMWMEcdE4AH7Wad9k87/exec";

    const FINAL_STEP_NUM = 5;

    const BANNER_IMAGES = {
        step1: "/common/images/banner_no1_appeal.jpg",
        step2Plus: "/common/images/test2.jpg"
    };

    const FIELD_LABELS = {
        has_investment: "現在の投資状況",
        annual_income: "年収",
        assets: "保有資産",
        occupation: "職業",
        age: "年齢",
        last_name: "姓",
        first_name: "名",
        user_email: "メールアドレス",
        user_tel: "電話番号",
        digital_gift: "ご希望の選べるデジタルギフト"
    };

    const VALIDATION_RULES = {
        user_email: {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: "メールアドレスを正しく入力してください"
        },
        user_tel: {
            pattern: /^0\d{9,10}$/,
            message: "電話番号を正しく入力してください"
        }
    };

    // ========================================================
    // DOM要素
    // ========================================================
    const form = document.getElementById('investment-form');
    const bannerImg = document.getElementById('banner-img');
    const indicators = Array.from(document.querySelectorAll('.step-item'));
    const choiceButtons = Array.from(document.querySelectorAll('.choice-btn'));

    const pages = {
        input: document.getElementById('page-input'),
        thanks: document.getElementById('page-thanks')
    };

    const stepsMap = new Map(
        Array.from(document.querySelectorAll('.form-step')).map(el => [Number(el.dataset.step), el])
    );

    const btnSubmit = document.getElementById('btn-submit');

    const openGiftTermsBtn = document.getElementById('open-gift-terms-modal');
    const giftTermsModal = document.getElementById('gift-terms-modal');
    const giftTermsTitle = document.getElementById('gift-terms-title');
    const giftTermsBody = document.getElementById('gift-terms-body');
    const closeGiftTermsBtn = document.getElementById('close-gift-terms-modal');
    const okGiftTermsBtn = document.getElementById('ok-gift-terms-modal');

    let currentStepNum = 1;
    let lastFocusedElement = null;

    // ========================================================
    // バナー画像切り替え制御
    // ========================================================
    function updateBannerImage(stepNum) {
        if (!bannerImg) return;
        const nextSrc = stepNum === 1 ? BANNER_IMAGES.step1 : BANNER_IMAGES.step2Plus;
        if (bannerImg.getAttribute('src') !== nextSrc) {
            bannerImg.setAttribute('src', nextSrc);
        }
    }

    // ========================================================
    // ポップアップ（進呈条件の詳細）描画・制御
    // ========================================================
    function renderGiftTerms() {
        if (!giftTermsBody || !GIFT_TERMS) return;
        if (giftTermsTitle && GIFT_TERMS.title) {
            giftTermsTitle.textContent = GIFT_TERMS.title;
        }
        giftTermsBody.innerHTML = '';

        (GIFT_TERMS.sections || []).forEach(section => {
            const sectionEl = document.createElement('section');
            sectionEl.className = 'gift-terms-section';

            if (section.heading) {
                const h3 = document.createElement('h3');
                h3.className = 'gift-terms-heading';
                h3.textContent = section.heading;
                sectionEl.appendChild(h3);
            }

            (section.paragraphs || []).forEach(text => {
                const p = document.createElement('p');
                p.textContent = text;
                sectionEl.appendChild(p);
            });

            if (Array.isArray(section.items) && section.items.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'gift-terms-list';
                section.items.forEach(itemText => {
                    const li = document.createElement('li');
                    li.textContent = itemText;
                    ul.appendChild(li);
                });
                sectionEl.appendChild(ul);
            }

            giftTermsBody.appendChild(sectionEl);
        });
    }

    renderGiftTerms();

    function openGiftTermsModal() {
        if (!giftTermsModal) return;
        lastFocusedElement = document.activeElement;
        giftTermsModal.classList.add('is-open');
        giftTermsModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        closeGiftTermsBtn?.focus();
    }

    function closeGiftTermsModal() {
        if (!giftTermsModal || !giftTermsModal.classList.contains('is-open')) return;
        giftTermsModal.classList.remove('is-open');
        giftTermsModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        lastFocusedElement?.focus();
        lastFocusedElement = null;
    }

    // ========================================================
    // 入力整形・バリデーション・エラー表示
    // ========================================================
    function normalizeInputValue(input) {
        if (input.id === 'user_tel') {
            input.value = input.value.replace(/[-\s\u3000]/g, '');
        }
    }

    function getFieldLabel(input) {
        if (FIELD_LABELS[input.name]) {
            return FIELD_LABELS[input.name];
        }
        const formGroup = input.closest('.form-group');
        const labelEl = formGroup ? formGroup.querySelector('label') : null;
        return labelEl ? labelEl.textContent.trim() : input.name;
    }

    function checkInputValidity(input, { normalize = true } = {}) {
        if (normalize) {
            normalizeInputValue(input);
        }
        const value = input.value.trim();
        const label = getFieldLabel(input);

        if (!value) {
            const isSelection = input.type === 'hidden' || input.tagName === 'SELECT';
            return {
                isValid: false,
                message: `${label}${isSelection ? 'を選択してください' : 'を入力してください'}`
            };
        }

        const rule = VALIDATION_RULES[input.id];
        if (rule && !rule.pattern.test(value)) {
            return { isValid: false, message: rule.message };
        }

        return { isValid: true, message: '' };
    }

    function getErrorElement(formGroup, createIfMissing = false) {
        let errorEl = formGroup.querySelector('.error-text-message');
        if (!errorEl && createIfMissing) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-text-message';
            formGroup.appendChild(errorEl);
        }
        return errorEl;
    }

    function showInputError(input, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        const choiceGroup = formGroup.querySelector('.choice-btn-group');
        if (choiceGroup) {
            choiceGroup.classList.add('is-error');
        } else {
            input.classList.add('is-error');
        }

        const errorEl = getErrorElement(formGroup, true);
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    function clearInputError(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        const choiceGroup = formGroup.querySelector('.choice-btn-group');
        if (choiceGroup) {
            choiceGroup.classList.remove('is-error');
        }

        input.classList.remove('is-error');
        const errorEl = getErrorElement(formGroup, false);
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    function focusFirstInvalid(input) {
        if (input.type === 'hidden') {
            const firstBtn = input.closest('.form-group')?.querySelector('.choice-btn');
            firstBtn?.focus();
            return;
        }
        input.focus();
    }

    function isStepComplete(stepNum, { normalize = false } = {}) {
        const stepEl = stepsMap.get(stepNum);
        if (!stepEl) return true;

        const requiredInputs = Array.from(stepEl.querySelectorAll('[required]'));
        return requiredInputs.every(input => checkInputValidity(input, { normalize }).isValid);
    }

    function updateStepAdvanceButtonState(stepNum = currentStepNum) {
        const stepEl = stepsMap.get(stepNum);
        if (!stepEl) return;

        const advanceBtn = stepEl.querySelector('.btn-next, #btn-submit');
        if (!advanceBtn) return;

        advanceBtn.disabled = !isStepComplete(stepNum, { normalize: false });
    }

    function validateStep(stepNum) {
        const stepEl = stepsMap.get(stepNum);
        if (!stepEl) return true;

        const requiredInputs = Array.from(stepEl.querySelectorAll('[required]'));
        let firstInvalid = null;

        requiredInputs.forEach(input => {
            const result = checkInputValidity(input, { normalize: true });
            if (!result.isValid) {
                showInputError(input, result.message);
                if (!firstInvalid) firstInvalid = input;
            } else {
                clearInputError(input);
            }
        });

        updateStepAdvanceButtonState(stepNum);

        if (firstInvalid) {
            focusFirstInvalid(firstInvalid);
            return false;
        }
        return true;
    }

    // ========================================================
    // 画面・ステップ遷移制御
    // ========================================================
    function setActivePage(targetPageKey) {
        Object.values(pages).forEach(page => page?.classList.remove('active'));
        pages[targetPageKey]?.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * @param {number|'all-completed'} activeStepNum - 1〜5の現在ステップ番号。全完了時は 'all-completed'
     */
    function updateStepIndicator(activeStepNum) {
        indicators.forEach((el, index) => {
            const itemStep = index + 1;
            const circle = el.querySelector('.step-circle');
            const isAllCompleted = activeStepNum === 'all-completed';
            const isCompleted = isAllCompleted || (typeof activeStepNum === 'number' && itemStep < activeStepNum);
            const isActive = !isAllCompleted && itemStep === activeStepNum;

            el.classList.toggle('active', isActive);
            el.classList.toggle('completed', isCompleted && !isActive);

            if (circle) {
                circle.textContent = isCompleted ? '✓' : String(circle.dataset.stepNum || itemStep);
            }
        });
    }

    function goToStep(targetStepNum) {
        if (!stepsMap.has(targetStepNum)) return;

        stepsMap.forEach((stepEl, stepNum) => {
            stepEl.classList.toggle('active', stepNum === targetStepNum);
        });
        currentStepNum = targetStepNum;
        updateBannerImage(targetStepNum);
        updateStepAdvanceButtonState(targetStepNum);
        updateStepIndicator(targetStepNum);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========================================================
    // イベント登録
    // ========================================================
    openGiftTermsBtn?.addEventListener('click', openGiftTermsModal);
    closeGiftTermsBtn?.addEventListener('click', closeGiftTermsModal);
    okGiftTermsBtn?.addEventListener('click', closeGiftTermsModal);

    giftTermsModal?.addEventListener('click', (e) => {
        if (e.target === giftTermsModal) {
            closeGiftTermsModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && giftTermsModal?.classList.contains('is-open')) {
            e.preventDefault();
            closeGiftTermsModal();
        }
    });

    choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const { target, value, autoNext } = btn.dataset;
            const hiddenInput = target ? document.getElementById(target) : null;
            if (!hiddenInput || !value) return;

            choiceButtons.forEach(b => {
                if (b.dataset.target === target) {
                    b.classList.toggle('is-selected', b === btn);
                }
            });

            hiddenInput.value = value;
            clearInputError(hiddenInput);
            updateStepAdvanceButtonState(currentStepNum);

            if (autoNext) {
                goToStep(Number(autoNext));
            }
        });
    });

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStepNum)) {
                goToStep(Number(btn.dataset.next));
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            goToStep(Number(btn.dataset.prev));
        });
    });

    form.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
        e.preventDefault();

        if (typeof e.target.blur === 'function') {
            e.target.blur();
        }

        const activeStep = stepsMap.get(currentStepNum);
        if (!activeStep) return;

        const focusables = Array.from(
            activeStep.querySelectorAll('input:not([type="hidden"]), button.btn-next:not(:disabled), #btn-submit:not(:disabled)')
        ).filter(el => el.offsetParent !== null && !el.disabled);

        const currentIndex = focusables.indexOf(e.target);
        if (currentIndex > -1 && currentIndex < focusables.length - 1) {
            focusables[currentIndex + 1].focus();
        }
    });

    form.querySelectorAll('input:not([type="hidden"])').forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.hasAttribute('required')) return;
            const result = checkInputValidity(input, { normalize: true });
            if (!result.isValid) {
                showInputError(input, result.message);
            } else {
                clearInputError(input);
            }
            updateStepAdvanceButtonState(currentStepNum);
        });

        const handleInputUpdate = () => {
            if (input.value.trim()) {
                clearInputError(input);
            }
            updateStepAdvanceButtonState(currentStepNum);
        };
        input.addEventListener('input', handleInputUpdate);
        input.addEventListener('change', handleInputUpdate);
    });

    btnSubmit.addEventListener('click', async () => {
        if (!validateStep(FINAL_STEP_NUM)) return;

        const originalText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = "送信中...";

        const jsonBody = Object.fromEntries(new FormData(form).entries());

        try {
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(jsonBody),
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            setActivePage('thanks');
            updateStepIndicator('all-completed');
        } catch (error) {
            console.error('データの送信に失敗:', error);
            alert('通信エラーが発生しました。時間をおいて再度お試しください。');
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalText;
        }
    });

    // 初期表示
    stepsMap.forEach((_, stepNum) => {
        updateStepAdvanceButtonState(stepNum);
    });
    updateBannerImage(1);
    updateStepIndicator(1);
});