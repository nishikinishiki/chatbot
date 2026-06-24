document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------
    // 設定値 (GASのWebアプリURLを設定してください)
    // --------------------------------------------------------
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzXO2_jiJabT49RgEnKHyAgqm-B-rhXjrgC87tZ-FGimsZLk1i4Ceev8uknpdv0g5xing/exec";

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

    // ステップインジケーター（上部のバー）の表示を更新する関数
    function updateStepIndicator(stepNum) {
        document.getElementById('indicator-1').classList.remove('active');
        document.getElementById('indicator-2').classList.remove('active');
        document.getElementById('indicator-3').classList.remove('active');
        document.getElementById(`indicator-${stepNum}`).classList.add('active');
    }

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
            } else if (input.id === 'mansion_name') {
                if (input.getAttribute('data-selected') !== 'true') return false;
            } else {
                if (!input.value.trim()) return false;
            }
        }
        return true;
    }

    // 入力の度に動的に次のステップを開示、または最終ボタンを活性化
    function evaluateFormProgress() {
        let isFormCompletelyValid = true; // フォーム全体が有効かどうかを判定するフラグ

        for (let i = 0; i < steps.length; i++) {
            const currentStep = steps[i];
            const nextStep = steps[i + 1];

            // 現在のステップが表示されている場合のみ判定
            if (currentStep.classList.contains('active')) {
                if (isStepValid(currentStep)) {
                    // 条件クリア：次のステップが存在し、かつまだ非表示なら表示する
                    if (nextStep && !nextStep.classList.contains('active')) {
                        nextStep.classList.add('active');
                    }
                } else {
                    // ★ 修正：条件を満たさなくなっても、すでに表示された次のステップを非表示にしない！
                    // 代わりに、フォーム全体としては「まだ未完了（エラーあり）」のフラグを立てておく
                    isFormCompletelyValid = false;
                }
            }
        }

        // すべてのステップが有効（未入力がない）で、かつ最後のステップまで到達していればCTAを活性化
        const lastStep = steps[steps.length - 1];
        if (isFormCompletelyValid && lastStep.classList.contains('active') && isStepValid(lastStep)) {
            btnToConfirm.disabled = false;
        } else {
            btnToConfirm.disabled = true; // どこか一つでも文字が消されていればボタンは押せない
        }
    }


    // プルダウンやラジオボタンの変更時、または入力欄からフォーカスが外れた時に判定
    form.addEventListener('change', evaluateFormProgress);
    form.addEventListener('focusout', evaluateFormProgress);

    // エンターキーを押して「確定」した瞬間に判定・次へ進む処理
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // エンターキーによる意図しないフォーム送信（画面リロード）を防止

            // 日本語の変換中（IME操作中）のエンターキーは除外する
            if (!e.isComposing && e.keyCode !== 229) {
                e.target.blur(); // 確定と同時にフォーカスを外し、エラー判定なども連動して動かす
                evaluateFormProgress();
            }
        }
    });

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
    // 3. マンション名オートコンプリート機能 (日本語変換の待機対応版)
    // --------------------------------------------------------
    const mansionInput = document.getElementById('mansion_name');
    const suggestList = document.getElementById('mansion-suggest-list');
    const errorBalloon = document.getElementById('mansion-error-balloon');
    const mansionHint = document.getElementById('mansion-hint');

    let isComposing = false; // 日本語入力（変換）中かどうかを判定するフラグ

    // 変換開始（ひらがな入力開始）
    mansionInput.addEventListener('compositionstart', () => {
        isComposing = true;
    });

    // 変換確定（Enterを押して漢字やカタカナが確定した瞬間）
    mansionInput.addEventListener('compositionend', () => {
        isComposing = false;
        searchMansion(); // 確定した文字で検索を実行
    });

    // 文字が入力・変更された時の処理
    mansionInput.addEventListener('input', () => {
        // ひらがな入力中（変換前）は何もしないで処理を抜ける
        if (isComposing) return;

        // 英数字の入力や、バックスペースでの削除時はここが動く
        searchMansion();
    });

    mansionInput.addEventListener('focus', () => {
        const keyword = mansionInput.value.trim();
        if (keyword && mansionInput.getAttribute('data-selected') === 'false') {
            searchMansion(); // 再検索してリストを開く
        }
    });

    // 検索と表示切り替えのメインロジック
    // 検索と表示切り替えのメインロジック
    function searchMansion() {
        mansionInput.setAttribute('data-selected', 'false');
        // ▼ 修正1：ここにあった「赤枠にする処理」を削除し、入力中は赤くならないようにしました
        mansionHint.style.color = 'var(--error-color)';
        mansionHint.textContent = "候補からマンションを選択してください。";
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

                const nameEl = document.createElement('div');
                nameEl.className = 'suggest-name';
                nameEl.textContent = itemData.name;

                const addressEl = document.createElement('div');
                addressEl.className = 'suggest-address';
                addressEl.textContent = itemData.address;

                item.appendChild(nameEl);
                item.appendChild(addressEl);

                // ▼ 修正2：'click' を 'mousedown' に変更し、フォーカス外れの誤作動をブロック！
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // ← 超重要：これで入力欄からフォーカスが外れるのを防ぎます

                    mansionInput.value = itemData.name;
                    suggestList.style.display = 'none';
                    mansionInput.setAttribute('data-selected', 'true');
                    mansionInput.classList.remove('is-error'); // エラーを解除
                    mansionHint.style.color = 'var(--text-muted)';
                    mansionHint.textContent = "✔ マンション名が選択されました";
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
    // リスト外をクリックした時にサジェストやバルーンを閉じる
    document.addEventListener('click', (e) => {
        if (!mansionInput.contains(e.target) && !suggestList.contains(e.target) && (!errorBalloon || !errorBalloon.contains(e.target))) {
            suggestList.style.display = 'none';
            if (errorBalloon) errorBalloon.style.display = 'none';
        }
    });

    // ★追加：マンション名からフォーカスが外れた時のエラー判定
    mansionInput.addEventListener('blur', () => {
        // 空っぽの場合、または候補から選択されていない場合
        if (!mansionInput.value.trim() || mansionInput.getAttribute('data-selected') === 'false') {
            mansionInput.classList.add('is-error');
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
        updateStepIndicator(2);
        window.scrollTo(0, 0);
    });

    // 「戻る」ボタン
    btnBack.addEventListener('click', () => {
        pageConfirm.classList.remove('active');
        pageInput.classList.add('active');
        updateStepIndicator(1);
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

// --------------------------------------------------------
// 4. 入力エラー時の視覚的フィードバック（赤枠とメッセージ表示）
// --------------------------------------------------------
// 必須属性(required)がついている入力欄をすべて取得
const allRequiredElements = document.querySelectorAll('input[required], select[required]');

allRequiredElements.forEach(input => {
    // マンション名は専用の吹き出しがあり、ラジオボタンは挙動が異なるため除外
    if (input.id === 'mansion_name' || input.type === 'radio') return;

    // 入力欄を囲んでいるform-groupを取得し、エラーメッセージ用の要素を裏側で作成
    const formGroup = input.closest('.form-group');
    const errorMsgEl = document.createElement('div');
    errorMsgEl.className = 'error-text-message';
    formGroup.appendChild(errorMsgEl);

    // ラベルのテキストを取得（※もし「必須」という文字が含まれていれば除去する）
    const label = formGroup.querySelector('label');
    const labelName = label ? label.textContent.replace('必須', '').trim() : '';

    // 入力欄からフォーカスが外れた時（blurイベント）
    input.addEventListener('blur', () => {
        // 未入力（空っぽ）の場合
        if (!input.value.trim()) {
            input.classList.add('is-error'); // 赤枠・赤背景のクラスを付与

            // inputタグかselectタグかで語尾を自然な日本語に切り替え
            const suffix = input.tagName.toLowerCase() === 'select' ? 'を選択してください' : 'を入力してください';
            errorMsgEl.textContent = `${labelName}${suffix}`;
            errorMsgEl.style.display = 'block'; // エラーテキストを表示
        }
    });

    // ユーザーが文字を入力（または選択）し始めたらエラーを解除
    input.addEventListener('input', () => {
        if (input.value.trim()) {
            input.classList.remove('is-error');
            errorMsgEl.style.display = 'none';
        }
    });
});