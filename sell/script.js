document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. 基本設定とDOM要素の取得
    // ========================================================
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyJpJBeBir3DXpssjkzveXUCun3wnRYzndX_Q1uyb9koTSQIkhzfGQZPa8pqqUx6Dh2pw/exec";

    const form = document.getElementById('estate-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));

    const pageInput = document.getElementById('page-input');
    const pageConfirm = document.getElementById('page-confirm');
    const pageThanks = document.getElementById('page-thanks');

    const btnToConfirm = document.getElementById('btn-to-confirm');
    const btnSubmit = document.getElementById('btn-submit');
    const btnBack = document.getElementById('btn-back');

    // ========================================================
    // 2. バリデーションルールの定義（正規表現とメッセージ）
    // ========================================================
    const VALIDATION_RULES = {
        user_email: {
            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: 'メールアドレスを正しく入力してください'
        },
        user_tel: {
            pattern: /^0\d{9,10}$/,
            message: 'ハイフンなしで正しく入力してください'
        },
        user_kana_last: {
            pattern: /^[ァ-ヶー]+$/,
            message: '全角カタカナで入力してください'
        },
        user_kana_first: {
            pattern: /^[ァ-ヶー]+$/,
            message: '全角カタカナで入力してください'
        }
    };

    // 入力値が正しいか判定し、結果とメッセージを返す共通関数
    function validateInput(input) {
        const value = input.value.trim();

        // 未入力チェック
        if (!value) {
            const formGroup = input.closest('.form-group');
            const label = formGroup ? formGroup.querySelector('label').textContent.replace('必須', '').trim() : '';
            const suffix = input.tagName.toLowerCase() === 'select' ? 'を選択してください' : 'を入力してください';
            return { isValid: false, message: `${label}${suffix}` };
        }

        // 形式チェック（ルールが定義されている項目のみ）
        const rule = VALIDATION_RULES[input.id];
        if (rule && !rule.pattern.test(value)) {
            return { isValid: false, message: rule.message };
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
            if (input.id === 'mansion_name') {
                if (input.getAttribute('data-selected') !== 'true') return false;
            } else {
                if (!validateInput(input).isValid) return false;
            }
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
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            e.target.blur();
            evaluateFormProgress();
        }
    });
    // 入力エラーの視覚的フィードバック ＆ フリガナ・電話番号の自動整形処理
    const allRequiredElements = document.querySelectorAll('input[required], select[required]');

    // ひらがな→カタカナ変換関数
    const toKatakana = (str) => {
        return str.replace(/[\u3041-\u3096]/g, match => String.fromCharCode(match.charCodeAt(0) + 0x60));
    };

    allRequiredElements.forEach(input => {
        if (input.id === 'mansion_name') return;

        const formGroup = input.closest('.form-group');
        const errorMsgEl = document.createElement('div');
        errorMsgEl.className = 'error-text-message';
        formGroup.appendChild(errorMsgEl);

        // フォーカスが外れた時（Enterキー確定時もここが動きます）
        input.addEventListener('blur', () => {
            // フリガナの場合はカタカナに変換
            if (input.id === 'user_kana_last' || input.id === 'user_kana_first') {
                input.value = toKatakana(input.value);
            }

            // ★追加：電話番号の場合はハイフンを全て削除
            if (input.id === 'user_tel') {
                input.value = input.value.replace(/-/g, '');
            }

            evaluateFormProgress(); // 値が変わったかもしれないので進行度を再評価

            // バリデーション実行
            const validation = validateInput(input);
            if (!validation.isValid) {
                input.classList.add('is-error');
                errorMsgEl.textContent = validation.message;
                errorMsgEl.style.display = 'block';
            } else {
                input.classList.remove('is-error');
                errorMsgEl.style.display = 'none';
            }
        });

        // 修正入力を始めたらエラーを隠す
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.remove('is-error');
                errorMsgEl.style.display = 'none';
            }
        });
    });

    // ========================================================
    // 5. サブリース条件分岐
    // ========================================================
    const managementSelect = document.getElementById('management_method');
    const subleaseGroup = document.getElementById('sublease-company-group');
    const subleaseSelect = document.getElementById('sublease_company');

    if (managementSelect) {
        managementSelect.addEventListener('change', (e) => {
            if (e.target.value === 'サブリース') {
                subleaseGroup.classList.add('active');
                subleaseSelect.setAttribute('required', 'required');
            } else {
                subleaseGroup.classList.remove('active');
                subleaseSelect.removeAttribute('required');
                subleaseSelect.value = "";
            }
            evaluateFormProgress();
        });
    }

    // ========================================================
    // 6. マンション名オートコンプリート
    // ========================================================
    const mansionInput = document.getElementById('mansion_name');
    const suggestList = document.getElementById('mansion-suggest-list');
    const errorBalloon = document.getElementById('mansion-error-balloon');
    // ★ヒント要素の代わりに、ステータスメッセージ要素を取得
    const mansionStatus = document.getElementById('mansion-status-message');
    let isComposing = false;

    mansionInput.addEventListener('compositionstart', () => isComposing = true);
    mansionInput.addEventListener('compositionend', () => {
        isComposing = false;
        searchMansion();
    });

    mansionInput.addEventListener('input', () => {
        if (!isComposing) searchMansion();
    });

    mansionInput.addEventListener('focus', () => {
        if (mansionInput.value.trim() && mansionInput.getAttribute('data-selected') === 'false') {
            searchMansion();
        }
    });

    // ★ blur時のエラー処理もステータスメッセージを使うように変更
    mansionInput.addEventListener('blur', () => {
        if (!mansionInput.value.trim() || mansionInput.getAttribute('data-selected') === 'false') {
            mansionInput.classList.add('is-error');
            mansionStatus.textContent = "候補からマンションを選択してください。";
            mansionStatus.className = 'status-message is-error';
            mansionStatus.style.display = 'block';
        }
    });

    function searchMansion() {
        mansionInput.setAttribute('data-selected', 'false');

        // ★ 検索開始時にステータスメッセージをリセットして隠す
        mansionStatus.style.display = 'none';
        mansionStatus.className = 'status-message';

        evaluateFormProgress();

        const keyword = mansionInput.value.trim();
        if (!keyword) {
            suggestList.style.display = 'none';
            errorBalloon.style.display = 'none';
            return;
        }

        const filteredMansions = MANSION_DB.filter(item =>
            item.name.includes(keyword) || item.address.includes(keyword)
        ).slice(0, 50);

        if (filteredMansions.length > 0) {
            errorBalloon.style.display = 'none';
            suggestList.innerHTML = '';

            filteredMansions.forEach(itemData => {
                const item = document.createElement('div');
                item.className = 'suggest-item';
                item.innerHTML = `<div class="suggest-name">${itemData.name}</div><div class="suggest-address">${itemData.address}</div>`;

                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    mansionInput.value = itemData.name;
                    suggestList.style.display = 'none';
                    mansionInput.setAttribute('data-selected', 'true');
                    mansionInput.classList.remove('is-error');

                    // ★ 選択成功時に緑色でメッセージを表示する
                    mansionStatus.textContent = "✔ マンション名が選択されました";
                    mansionStatus.className = 'status-message is-success';
                    mansionStatus.style.display = 'block';

                    evaluateFormProgress();
                });
                suggestList.appendChild(item);
            });
            suggestList.style.display = 'block';
        } else {
            suggestList.style.display = 'none';
            errorBalloon.style.display = 'block';
        }
    }

    document.addEventListener('click', (e) => {
        if (!mansionInput.contains(e.target) && !suggestList.contains(e.target) && (!errorBalloon || !errorBalloon.contains(e.target))) {
            suggestList.style.display = 'none';
            if (errorBalloon) errorBalloon.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!mansionInput.contains(e.target) && !suggestList.contains(e.target) && (!errorBalloon || !errorBalloon.contains(e.target))) {
            suggestList.style.display = 'none';
            if (errorBalloon) errorBalloon.style.display = 'none';
        }
    });


    // ========================================================
    // 7. モーダル制御処理
    // ========================================================
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modalTitle.textContent = trigger.textContent;
            modalBody.innerHTML = document.getElementById(`text-${trigger.getAttribute('data-modal')}`).innerHTML;
            modalOverlay.classList.add('active');
        });
    });

    modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });


    // ========================================================
    // 8. 画面遷移とデータ送信
    // ========================================================

    // 確認画面へ進む
    btnToConfirm.addEventListener('click', () => {
        const labels = {
            mansion_name: "マンション名", room_number: "部屋番号", floor_number: "所在階", area_size: "占有面積",
            floor_plan: "間取り", occupancy_status: "居住の状態", management_method: "管理方法", sublease_company: "サブリース会社",
            monthly_rent: "月額賃料", ownership_period: "物件保有年数", valuation_purpose: "査定の目的",
            desired_timing: "売却希望時期", user_email: "メールアドレス", user_tel: "電話番号"
        };
        const units = { room_number: "号室", floor_number: "階", area_size: "㎡", monthly_rent: "円" };

        const formData = new FormData(form);
        const propertySummaryHtml = [];
        const userSummaryHtml = [];

        formData.forEach((value, key) => {
            if (!value || ['user_name_last', 'user_name_first', 'user_kana_last', 'user_kana_first'].includes(key)) return;

            const displayValue = units[key] ? `${value} ${units[key]}` : value;
            const rowHtml = `
                <div class="confirm-row">
                    <dt class="confirm-label">${labels[key] || key}</dt>
                    <dd class="confirm-value">${displayValue}</dd>
                </div>
            `;
            if (['user_email', 'user_tel'].includes(key)) {
                userSummaryHtml.push(rowHtml);
            } else {
                propertySummaryHtml.push(rowHtml);
            }
        });

        userSummaryHtml.unshift(`
            <div class="confirm-row"><dt class="confirm-label">フリガナ</dt><dd class="confirm-value">${formData.get('user_kana_last')} ${formData.get('user_kana_first')}</dd></div>
        `);
        userSummaryHtml.unshift(`
            <div class="confirm-row"><dt class="confirm-label">お名前</dt><dd class="confirm-value">${formData.get('user_name_last')} ${formData.get('user_name_first')}</dd></div>
        `);

        document.getElementById('summary-property').innerHTML = propertySummaryHtml.join('');
        document.getElementById('summary-user').innerHTML = userSummaryHtml.join('');

        pageInput.classList.remove('active');
        pageConfirm.classList.add('active');
        updateStepIndicator(2);
        window.scrollTo(0, 0);
    });

    // (※HTMLに btn-back がある場合) 修正して戻る
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
        const jsonBody = Object.fromEntries(formData.entries()); // 短く書ける記法に変更

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
            btnSubmit.textContent = "送信する";
        }
    });

});