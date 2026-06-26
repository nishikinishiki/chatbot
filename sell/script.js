document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. 基本設定とDOM要素の取得
    // ========================================================
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwhBWk7tI-uF6MYs5LH_6cCl8_b01T53CFNL4z1ChwY2_CTIfJTSp6yFP6AfNv9xYXbGQ/exec";

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
            pattern: /^[ァ-ヶー\s]+$/
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
        // エンターキーが押された時（日本語変換中のエンターは除く）
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
            e.preventDefault(); // 意図しない画面リロード（フォーム送信）を防止

            const currentInput = e.target;
            currentInput.blur(); // 一旦フォーカスを外して、エラー判定やフリガナ変換を走らせる

            evaluateFormProgress(); // 値が確定したことで、次のステップが開くか評価する

            // 現在画面上に表示されている（display: none ではない）入力項目をすべて取得
            const focusableElements = Array.from(form.querySelectorAll('input, select')).filter(el => {
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
        if (input.id === 'mansion_name') return;

        const formGroup = input.closest('.form-group');

        // ★変更：グループ内に既にエラーメッセージ要素があるか探し、無ければ1つだけ作る
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

                // ★追加：同じグループ内に「他にエラーになっている入力欄」がないかチェック
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
    // 6. マンション名オートコンプリート（Supabase通信版）
    // ========================================================
    // ★あとでSupabaseのダッシュボードで発行されるURLとキーをここに入力します
    const SUPABASE_URL = 'https://onedgdlwknwajshunhiq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZWRnZGx3a253YWpzaHVuaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDU0MjIsImV4cCI6MjA5ODAyMTQyMn0.F68s6awM0O4Q6y_Y5l1pwsqRukW0B2ZIM2Mi07AT1jI';

    const mansionInput = document.getElementById('mansion_name');
    const suggestList = document.getElementById('mansion-suggest-list');
    const errorBalloon = document.getElementById('mansion-error-balloon');
    const mansionStatus = document.getElementById('mansion-status-message');
    const loadingSpinner = document.getElementById('mansion-loading');

    let isComposing = false;
    let debounceTimer; // ★ APIの無駄打ちを防ぐためのタイマー変数

    mansionInput.addEventListener('compositionstart', () => isComposing = true);
    mansionInput.addEventListener('compositionend', () => {
        isComposing = false;
        triggerSearch();
    });

    mansionInput.addEventListener('input', () => {
        if (!isComposing) triggerSearch();
    });

    mansionInput.addEventListener('focus', () => {
        if (mansionInput.value.trim() && mansionInput.getAttribute('data-selected') === 'false') {
            triggerSearch();
        }
    });

    mansionInput.addEventListener('blur', () => {
        if (!mansionInput.value.trim() || mansionInput.getAttribute('data-selected') === 'false') {
            mansionInput.classList.add('is-error');
            mansionStatus.textContent = "候補からマンションを選択してください。";
            mansionStatus.className = 'status-message is-error';
            mansionStatus.style.display = 'block';
        }
    });

    // ★入力が連続している間は通信を待ち、0.3秒間入力が止まったら検索を実行する（デバウンス処理）
    function triggerSearch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(searchMansion, 300);
    }

    async function searchMansion() {
        mansionInput.setAttribute('data-selected', 'false');
        mansionStatus.style.display = 'none';
        mansionStatus.className = 'status-message';
        evaluateFormProgress();

        const keyword = mansionInput.value.trim();
        if (!keyword) {
            suggestList.style.display = 'none';
            errorBalloon.style.display = 'none';
            return;
        }

        loadingSpinner.style.display = 'block';

        try {
            // ★ SupabaseのAPIに検索リクエストを送信 (name か address に keyword が含まれるものを最大50件取得)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/mansions?or=(name.ilike.*${keyword}*,address.ilike.*${keyword}*)&limit=50`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('データベース通信エラー');

            // 取得した結果をJSONとして読み込む
            const filteredMansions = await response.json();

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
        } catch (error) {
            console.error('検索エラー:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    document.addEventListener('click', (e) => {
        if (!mansionInput.contains(e.target) && !suggestList.contains(e.target) && (!errorBalloon || !errorBalloon.contains(e.target))) {
            suggestList.style.display = 'none';
            if (errorBalloon) errorBalloon.style.display = 'none';
        }
    });
    // ========================================================
    // 7. 画面遷移とデータ送信
    // ========================================================
    btnToConfirm.addEventListener('click', () => {
        const labels = {
            mansion_name: "マンション名", room_number: "部屋番号", floor_number: "所在階", area_size: "占有面積",
            floor_plan: "間取り", occupancy_status: "居住の状態", monthly_rent: "月額賃料", management_method: "管理方法", sublease_company: "サブリース会社",
            ownership_period: "物件保有年数", valuation_purpose: "査定の目的", desired_timing: "売却希望時期",
            user_name: "お名前", user_kana: "フリガナ", user_email: "メールアドレス", user_tel: "電話番号", request_notes: "その他ご要望"
        };
        const units = { room_number: "号室", floor_number: "階", area_size: "㎡", monthly_rent: "円" };

        const formData = new FormData(form);
        const propertySummaryHtml = [];
        const userSummaryHtml = [];

        formData.forEach((value, key) => {
            if (!value) return;

            const displayValue = units[key] ? `${value} ${units[key]}` : value;
            const rowHtml = `
                <div class="confirm-row">
                    <dt class="confirm-label">${labels[key] || key}</dt>
                    <dd class="confirm-value">${displayValue}</dd>
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