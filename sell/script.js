document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. 基本設定とDOM要素の取得
    // ========================================================
    // ★GAS URL
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwLMap6IVQPwzVN6YahDid_2DS26Uk0m_BWk2GeLA2wugI5FhMWMEcdE4AH7Wad9k87/exec";

    const form = document.getElementById('estate-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));

    const pageInput = document.getElementById('page-input');
    const pageConfirm = document.getElementById('page-confirm');
    const pageThanks = document.getElementById('page-thanks');

    const btnToConfirm = document.getElementById('btn-to-confirm');
    const btnSubmit = document.getElementById('btn-submit');
    const btnBack = document.getElementById('btn-back');

    // ========================================================
    // 2. バリデーションルールの定義（正規表現のみに特化）
    // ========================================================
    const VALIDATION_RULES = {
        user_email: {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        },
        user_tel: {
            pattern: /^0\d{9,10}$/
        },
        user_kana: {
            // カタカナとスペース（半角・全角）を許容
            pattern: /^[ァ-ヶー\s ]+$/
        }
    };

    // 入力値が正しいか判定し、結果とメッセージを返す共通関数
    function validateInput(input) {
        const value = input.value.trim();

        // 共通：エラーメッセージ用にラベル名を取得
        const formGroup = input.closest('.form-group');
        const label = formGroup ? formGroup.querySelector('label').textContent.replace('必須', '').trim() : '';

        // 未入力チェック
        if (!value) {
            const suffix = input.tagName.toLowerCase() === 'select' ? 'を選択してください' : 'を入力してください';
            return { isValid: false, message: `${label}${suffix}` };
        }

        // 形式チェック（ルールが定義されている項目のみ）
        const rule = VALIDATION_RULES[input.id];
        if (rule && !rule.pattern.test(value)) {
            return { isValid: false, message: `${label}を正しく入力してください` };
        }

        return { isValid: true, message: '' };
    }


    // ========================================================
    // 3. UI更新・プログレッシブ制御処理
    // ========================================================
    function updateStepIndicator(stepNum) {
        [1, 2, 3].forEach(num => {
            document.getElementById(`indicator-${num}`).classList.remove('active');
        });
        document.getElementById(`indicator-${stepNum}`).classList.add('active');
    }

    function isStepValid(stepElement) {
        const requiredInputs = stepElement.querySelectorAll('[required]');
        for (let input of requiredInputs) {
            if (!validateInput(input).isValid) return false;
        }
        return true;
    }

    function evaluateFormProgress() {
        let isFormCompletelyValid = true;

        for (let i = 0; i < steps.length; i++) {
            const currentStep = steps[i];
            const nextStep = steps[i + 1];

            if (currentStep.classList.contains('active')) {
                if (isStepValid(currentStep)) {
                    if (nextStep && !nextStep.classList.contains('active')) {
                        nextStep.classList.add('active');
                    }
                } else {
                    isFormCompletelyValid = false;
                }
            }
        }

        const lastStep = steps[steps.length - 1];
        btnToConfirm.disabled = !(isFormCompletelyValid && lastStep.classList.contains('active') && isStepValid(lastStep));
    }


    // ========================================================
    // 4. イベントリスナー（共通入力・エラー表示・変換）
    // ========================================================
    form.addEventListener('change', evaluateFormProgress);

    form.addEventListener('keydown', (e) => {
        if (e.target.tagName.toLowerCase() === 'textarea') {
            return;
        }
        // エンターキーが押された時（日本語変換中のエンターは除く）
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
            e.preventDefault(); // 意図しない画面リロード（フォーム送信）を防止

            const currentInput = e.target;
            currentInput.blur(); // 一旦フォーカスを外して、エラー判定やフリガナ変換を走らせる

            evaluateFormProgress(); // 値が確定したことで、次のステップが開くか評価する

            // 現在画面上に表示されている（display: none ではない）入力項目をすべて取得
            const focusableElements = Array.from(form.querySelectorAll('input, select, textarea')).filter(el => {
                return el.type !== 'hidden' && el.offsetParent !== null && !el.disabled;
            });

            // 今入力していた項目が、配列の何番目かを探す
            const currentIndex = focusableElements.indexOf(currentInput);

            // 次の入力項目が存在すれば、そこにフォーカスを移す
            if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
                focusableElements[currentIndex + 1].focus();
            }
        }
    });

    // 入力エラーの視覚的フィードバック ＆ フリガナ・電話番号の自動整形処理
    const allRequiredElements = document.querySelectorAll('input[required], select[required]');

    // ひらがな→カタカナ変換関数
    const toKatakana = (str) => {
        return str.replace(/[\u3041-\u3096]/g, match => String.fromCharCode(match.charCodeAt(0) + 0x60));
    };

    allRequiredElements.forEach(input => {
        const formGroup = input.closest('.form-group');

        // グループ内に既にエラーメッセージ要素があるか探し、無ければ1つだけ作る
        let errorMsgEl = formGroup.querySelector('.error-text-message');
        if (!errorMsgEl) {
            errorMsgEl = document.createElement('div');
            errorMsgEl.className = 'error-text-message';
            formGroup.appendChild(errorMsgEl);
        }

        input.addEventListener('blur', () => {
            if (input.id === 'user_kana') {
                input.value = toKatakana(input.value);
            }
            if (input.id === 'user_tel') {
                input.value = input.value.replace(/-/g, '');
            }

            evaluateFormProgress();

            const validation = validateInput(input);
            if (!validation.isValid) {
                input.classList.add('is-error');
                // エラーメッセージ要素のテキストを上書きして表示
                errorMsgEl.textContent = validation.message;
                errorMsgEl.style.display = 'block';
            } else {
                input.classList.remove('is-error');

                // 同じグループ内に「他にエラーになっている入力欄」がないかチェック
                const siblingInputs = formGroup.querySelectorAll('input[required], select[required]');
                const hasOtherErrors = Array.from(siblingInputs).some(sibling => sibling.classList.contains('is-error'));

                // 他にもエラーがあればメッセージは残し、両方綺麗になったらメッセージを消す
                if (!hasOtherErrors) {
                    errorMsgEl.style.display = 'none';
                }
            }
        });

        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.remove('is-error');

                const siblingInputs = formGroup.querySelectorAll('input[required], select[required]');
                const hasOtherErrors = Array.from(siblingInputs).some(sibling => sibling.classList.contains('is-error'));

                if (!hasOtherErrors) {
                    errorMsgEl.style.display = 'none';
                }
            }
        });
    });

    // ========================================================
    // 5. 管理方法「その他」条件分岐
    // ========================================================
    const managementSelect = document.getElementById('management_method');
    const managementOtherGroup = document.getElementById('management-other-group');
    const managementOtherInput = document.getElementById('management_other');

    if (managementSelect && managementOtherGroup && managementOtherInput) {
        managementSelect.addEventListener('change', (e) => {
            if (e.target.value === 'その他') {
                managementOtherGroup.classList.add('active');
                managementOtherInput.setAttribute('required', 'required');
            } else {
                managementOtherGroup.classList.remove('active');
                managementOtherInput.removeAttribute('required');
                managementOtherInput.value = "";
                managementOtherInput.classList.remove('is-error');
                const otherErrorEl = managementOtherGroup.querySelector('.error-text-message');
                if (otherErrorEl) {
                    otherErrorEl.style.display = 'none';
                }
            }
            evaluateFormProgress();
        });
    }

    // ========================================================
    // 6. 画面遷移とデータ送信
    // ========================================================
    btnToConfirm.addEventListener('click', () => {
        const labels = {
            type: "種別", name: "物件名", room_number: "部屋番号",
            monthly_rent: "家賃", monthly_fee: "管理費等", management_method: "管理方法", management_other: "管理方法（その他）",
            user_name: "お名前", user_kana: "フリガナ", user_email: "メールアドレス", user_tel: "電話番号", preferred_time: "ご連絡の希望時間帯", request_notes: "その他ご要望"
        };
        const units = { monthly_rent: "円", monthly_fee: "円" };

        const formData = new FormData(form);
        const propertySummaryHtml = [];
        const userSummaryHtml = [];

        formData.forEach((value, key) => {
            if (!value) return;

            const displayValue = units[key] ? `${value} ${units[key]}` : value;
            const formattedValue = typeof displayValue === 'string' ? displayValue.replace(/\n/g, '<br>') : displayValue;

            const rowHtml = `
                <div class="confirm-row">
                    <dt class="confirm-label">${labels[key] || key}</dt>
                    <dd class="confirm-value">${formattedValue}</dd>
                </div>
            `;
            if (['user_name', 'user_kana', 'user_email', 'user_tel', 'request_notes'].includes(key)) {
                userSummaryHtml.push(rowHtml);
            } else {
                propertySummaryHtml.push(rowHtml);
            }
        });

        document.getElementById('summary-property').innerHTML = propertySummaryHtml.join('');
        document.getElementById('summary-user').innerHTML = userSummaryHtml.join('');

        pageInput.classList.remove('active');
        pageConfirm.classList.add('active');
        updateStepIndicator(2);
        window.scrollTo(0, 0);
    });

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            pageConfirm.classList.remove('active');
            pageInput.classList.add('active');
            updateStepIndicator(1);
            window.scrollTo(0, 0);
        });
    }

    // GASへ送信
    btnSubmit.addEventListener('click', async () => {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "送信中...";

        const formData = new FormData(form);
        const jsonBody = Object.fromEntries(formData.entries());

        try {
            await fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(jsonBody),
                redirect: 'follow'
            });

            pageConfirm.classList.remove('active');
            pageThanks.classList.add('active');
            updateStepIndicator(3);
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('データの送信に失敗:', error);
            alert('通信エラーが発生しました。時間をおいて再度お試しください。');
            btnSubmit.disabled = false;
            btnSubmit.textContent = "物件を査定する";
        }
    });

});