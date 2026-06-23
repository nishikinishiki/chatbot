document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------
    // 設定値 (GASのWebアプリURLを設定してください)
    // --------------------------------------------------------
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyYPdl_nlhcXvPyy4UwSX4PRrqLrP0KOQ5RYyEyQD1bYHL5YbmfiXISoV-BdOIJcOJ3rQ/exec";

    // フォーム関連要素
    const form = document.getElementById('estate-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const btnToConfirm = document.getElementById('btn-to-confirm'); // CTAボタン

    // 画面遷移用要素
    const pageInput = document.getElementById('page-input');
    const pageConfirm = document.getElementById('page-confirm');
    const pageThanks = document.getElementById('page-thanks');
    const currentPageNum = document.getElementById('current-page-num');

    // 操作ボタン
    const btnSubmit = document.getElementById('btn-submit');
    const btnBack = document.getElementById('btn-back');

    // --------------------------------------------------------
    // 1. プログレッシブ開示方式（ステップ制御）
    // --------------------------------------------------------
    function isStepValid(stepElement) {
        const requiredInputs = stepElement.querySelectorAll('[required]');
        for (let input of requiredInputs) {
            if (input.type === 'radio') {
                const name = input.getAttribute('name');
                const checked = stepElement.querySelector(`input[name="${name}"]:checked`);
                if (!checked) return false;
            } else {
                if (!input.value.trim()) return false;
            }
        }
        return true;
    }

    function evaluateFormProgress() {
        for (let i = 0; i < steps.length; i++) {
            const currentStep = steps[i];
            const nextStep = steps[i + 1];

            if (isStepValid(currentStep)) {
                if (nextStep && !nextStep.classList.contains('active')) {
                    nextStep.classList.add('active');
                }
            } else {
                for (let j = i + 1; j < steps.length; j++) {
                    steps[j].classList.remove('active');
                }
                btnToConfirm.disabled = true; // 未入力があればCTA無効化
                return;
            }
        }

        // すべてのステップが有効であれば、最終のCTAボタンを活性化
        if (isStepValid(steps[steps.length - 1])) {
            btnToConfirm.disabled = false;
        }
    }

    form.addEventListener('input', evaluateFormProgress);
    form.addEventListener('change', evaluateFormProgress);

    // --------------------------------------------------------
    // 2. 条件分岐（管理方法が「サブリース」の場合）
    // --------------------------------------------------------
    const managementRadios = document.querySelectorAll('input[name="management_method"]');
    const subleaseGroup = document.getElementById('sublease-company-group');
    const subleaseSelect = document.getElementById('sublease_company');

    managementRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
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
    });

    // --------------------------------------------------------
    // 3. マンション名オートコンプリート機能 (GAS照合)
    // --------------------------------------------------------
    const mansionInput = document.getElementById('mansion_name');
    const suggestList = document.getElementById('mansion-suggest-list');
    let debounceTimeout;

    mansionInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        const keyword = mansionInput.value.trim();

        if (!keyword) {
            suggestList.style.display = 'none';
            return;
        }

        debounceTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${GAS_API_URL}?action=searchMansion&keyword=${encodeURIComponent(keyword)}`);
                const mansions = await response.json();

                if (mansions && mansions.length > 0) {
                    suggestList.innerHTML = '';
                    mansions.forEach(name => {
                        const item = document.createElement('div');
                        item.className = 'suggest-item';
                        item.textContent = name;
                        item.addEventListener('click', () => {
                            mansionInput.value = name;
                            suggestList.style.display = 'none';
                            evaluateFormProgress();
                        });
                        suggestList.appendChild(item);
                    });
                    suggestList.style.display = 'block';
                } else {
                    suggestList.style.display = 'none';
                }
            } catch (error) {
                console.error('サジェストデータの取得に失敗:', error);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!mansionInput.contains(e.target) && !suggestList.contains(e.target)) {
            suggestList.style.display = 'none';
        }
    });

    // --------------------------------------------------------
    // 4. モーダル（ポップアップ）制御処理
    // --------------------------------------------------------
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetKey = trigger.getAttribute('data-modal');
            const titleText = trigger.textContent;

            // HTML下部に隠してあるテキスト要素を取得してモーダルにセット
            const textContent = document.getElementById(`text-${targetKey}`).innerHTML;

            modalTitle.textContent = titleText;
            modalBody.innerHTML = textContent;

            modalOverlay.classList.add('active');
        });
    });

    // 閉じるボタン
    modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    // 背景クリックで閉じる
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // --------------------------------------------------------
    // 5. 2ページ目（確認画面）への遷移ロジック
    // --------------------------------------------------------
    btnToConfirm.addEventListener('click', () => {
        const labels = {
            mansion_name: "マンション名", room_number: "部屋番号", floor_number: "所在階", area_size: "占有面積",
            floor_plan: "間取り", occupancy_status: "居住の状態", management_method: "管理方法", sublease_company: "サブリース会社",
            monthly_rent: "月額賃料", construction_year: "竣工年", ownership_period: "物件保有年数", valuation_purpose: "査定の目的",
            desired_timing: "売却希望時期", user_age: "年齢", user_name: "お名前", user_kana: "ふりがな", user_email: "メールアドレス", user_tel: "電話番号"
        };

        const formData = new FormData(form);
        const propertySummaryHtml = [];
        const userSummaryHtml = [];
        const units = { room_number: "号室", floor_number: "階", area_size: "㎡", monthly_rent: "円", construction_year: "年", user_age: "歳" };

        formData.forEach((value, key) => {
            if (!value) return;
            const displayValue = units[key] ? `${value} ${units[key]}` : value;
            const rowHtml = `
        <div class="confirm-row">
          <dt class="confirm-label">${labels[key] || key}</dt>
          <dd class="confirm-value">${displayValue}</dd>
        </div>
      `;
            if (['user_age', 'user_name', 'user_kana', 'user_email', 'user_tel'].includes(key)) {
                userSummaryHtml.push(rowHtml);
            } else {
                propertySummaryHtml.push(rowHtml);
            }
        });

        document.getElementById('summary-property').innerHTML = propertySummaryHtml.join('');
        document.getElementById('summary-user').innerHTML = userSummaryHtml.join('');

        pageInput.classList.remove('active');
        pageConfirm.classList.add('active');
        currentPageNum.textContent = "2";
        window.scrollTo(0, 0);
    });

    // 「戻る」ボタン
    btnBack.addEventListener('click', () => {
        pageConfirm.classList.remove('active');
        pageInput.classList.add('active');
        currentPageNum.textContent = "1";
        window.scrollTo(0, 0);
    });

    // --------------------------------------------------------
    // 6. 3ページ目（Thanks画面）への送信ロジック（GASデータ出力）
    // --------------------------------------------------------
    btnSubmit.addEventListener('click', async () => {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "送信中...";

        const formData = new FormData(form);
        const jsonBody = {};
        formData.forEach((value, key) => { jsonBody[key] = value; });

        try {
            await fetch(GAS_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(jsonBody)
            });

            pageConfirm.classList.remove('active');
            pageThanks.classList.add('active');
            currentPageNum.textContent = "3";
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('データの送信に失敗:', error);
            alert('通信エラーが発生しました。時間をおいて再度お試しください。');
            btnSubmit.disabled = false;
            btnSubmit.textContent = "送信する";
        }
    });

});