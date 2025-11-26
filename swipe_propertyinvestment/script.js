document.addEventListener('DOMContentLoaded', () => {
    // 【重要】ここにデプロイしたGoogle Apps ScriptのウェブアプリURLを貼り付けてください
    const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwl46_zCUTKtbGV9dQlYfeu0hFHHzLJKfVdefea_zKDxMZ0DGAqiyfVWlFrqOJEsjET/exec';
    
    const lpContainer = document.getElementById('lp-container');
    const slideWrapper = document.getElementById('slide-wrapper');
    const slides = document.querySelectorAll('.slide');
    const slideCount = slides.length;
    let currentSlide = 0; // 0-indexed
    let touchStartX = 0;
    let touchStartY = 0; // Y軸座標も使用
    let touchEndX = 0;
    let touchEndY = 0; // Y軸座標も使用
    
    let swipeDirection = null; // 'horizontal' or 'vertical'
    
    // セッションIDの生成 (簡易的なUUID)
    const sessionId = 's_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);


    // Pardot連携のためのフォームデータ
    const formData = {
        // Q1 投資経験
        investment_experience: null, 
        // Q2 職業
        occupation: null,
        // Q3 年齢
        age_group: null,
        // Q4 年収
        annual_income: null,
        // Q5 メールアドレス
        email_address: '',
        // Q6 電話番号
        phone_number: '',
        // Q7 名前 (分割)
        last_name: '',
        first_name: '',
        // UTMパラメータ (Thanksページには表示しないが、送信データとして保持)
        utm_source: '',
        utm_campaign: '',
        utm_medium: '',
        utm_term: ''
    };
    
    const FIRST_FORM_SLIDE_INDEX = 5; 


    // UTMパラメータ取得と初期格納
    function getUtmParameters() {
        const params = new URLSearchParams(window.location.search);
        formData.utm_source = params.get('utm_source') || '';
        formData.utm_campaign = params.get('utm_campaign') || '';
        formData.utm_medium = params.get('utm_medium') || '';
        formData.utm_term = params.get('utm_term') || '';
        console.log("UTM Data Loaded:", {
            source: formData.utm_source,
            campaign: formData.utm_campaign
        });
    }
    getUtmParameters();


    /**
     * 現在のスライドの選択肢ボタンの状態を更新する (ハイライト)
     */
    function updateSelectedButtonState() {
        const currentSlideElement = slides[currentSlide];
        if (currentSlideElement.dataset.type !== 'option') return;

        const container = currentSlideElement.querySelector('.options-container');
        const questionKey = container.dataset.question;
        const selectedValue = formData[questionKey];

        currentSlideElement.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));

        if (selectedValue) {
            const selectedBtn = container.querySelector(`.option-btn[data-value="${selectedValue}"]`);
            if (selectedBtn) selectedBtn.classList.add('selected');
        }
    }
    
    /**
     * Thanksページに回答内容を動的に挿入し、GASへ送信する
     * ★修正箇所: GAS送信処理の呼び出しを追加
     */
    function renderSummary() {
        const container = document.querySelector('.answers-summary');
        if (!container) return;

        const fields = {
            investment_experience: "Q1. 投資経験",
            occupation: "Q2. 職業区分",
            age_group: "Q3. 年齢帯",
            annual_income: "Q4. ご年収",
            email_address: "Q5. メールアドレス",
            phone_number: "Q6. 携帯電話番号",
            last_name: "Q7. お名前(姓)",
            first_name: "Q7. お名前(名)",
        };

        let summaryHTML = ''; 

        for (const key in fields) {
            const label = fields[key];
            const value = (formData[key]?.trim() || '未回答');
                
            summaryHTML += `
                <dt>${label}</dt>
                <dd>${value}</dd>
            `;
        }

        container.innerHTML = summaryHTML; 
        console.log("Final Form Data ready for GAS submission:", formData);
        
        // ★追加: 最終スライド表示時にGASへデータを送信
        sendFormDataToGas(); 
    } 


    /**
     * GASのウェブアプリURLへフォームデータを送信する
     */
    function sendFormDataToGas() {
        // GASで必要とされる追加項目をデータに追加
        const finalData = {
            ...formData, // 既存のフォームデータとUTMパラメータ
            "Session_ID": sessionId,
            "Timestamp": new Date().toISOString(),
            "final_consent_given": true // Thanksページに到達したことで同意と見なす
        };

        if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes('【ここにデプロイしたGASのURLを貼り付けます】')) {
            console.error("GAS_WEB_APP_URLが設定されていません。データ送信はスキップされました。");
            return;
        }

        console.log("Sending Data to GAS:", finalData);
        
        // Fetch APIを使用してPOSTリクエストを送信
        fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            // GASへの送信ではCORSエラーを避けるため 'no-cors' が一般的
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalData),
        })
        .then(response => {
            // no-corsモードではレスポンス内容を確認できないため、ログのみ
            console.log("GAS request sent. (Response check limited due to no-cors mode.)");
        })
        .catch(error => {
            console.error('GAS POST Error:', error);
            // エラーが発生してもLPの動作は止めない
        });
    }


    /**
     * 指定されたインデックスのスライドに移動する
     */
    function goToSlide(index) {
        if (index < 0 || index >= slideCount) {
            return;
        }

        currentSlide = index;
        const offset = -currentSlide * 100;
        
        const transformType = (swipeDirection === 'vertical') ? 'translateY' : 'translateX';
        
        slideWrapper.style.transform = `${transformType}(${offset}%)`;
        
        updateSelectedButtonState();
        
        if (currentSlide === slideCount - 1) {
            renderSummary();
        }
    }
    
    /**
     * 現在のスライドで回答/入力が完了しているか判定する
     */
    function isFormAnswered(slideIndex) {
        const slide = slides[slideIndex];
        const type = slide.dataset.type;

        if (type === 'image' || type === 'thanks') return true;

        if (type === 'option') {
            const questionKey = slide.querySelector('.options-container')?.dataset.question;
            return questionKey && formData[questionKey] !== null;
        }

        if (type === 'text') {
            const nextBtn = slide.querySelector('.next-btn');
            return nextBtn ? !nextBtn.disabled : false;
        }

        if (type === 'name') {
            const nextBtn = slide.querySelector('.next-btn');
            return nextBtn ? !nextBtn.disabled : false;
        }

        return false;
    }


    // --- ナビゲーション処理 (タップ / スワイプ) ---

    // 画面タップナビゲーション
    lpContainer.addEventListener('click', (e) => {
        if (e.target.closest('.option-btn') || e.target.closest('input') || e.target.closest('.next-btn') || e.target.closest('a')) {
            return;
        }
        
        const mode = swipeDirection || 'horizontal'; 

        if (mode === 'horizontal') {
            const containerWidth = lpContainer.offsetWidth;
            const clickX = e.clientX - lpContainer.getBoundingClientRect().left;

            if (clickX > containerWidth / 2) {
                // 横モード: 右側タップ -> 次へ
                if (isFormAnswered(currentSlide)) {
                    goToSlide(currentSlide + 1);
                }
            } else {
                // 横モード: 左側タップ -> 戻る
                goToSlide(currentSlide - 1);
            }
        } else {
            const containerHeight = lpContainer.offsetHeight;
            const clickY = e.clientY - lpContainer.getBoundingClientRect().top;

            if (clickY > containerHeight / 2) {
                // 縦モード: 下側タップ -> 次へ
                if (isFormAnswered(currentSlide)) {
                    goToSlide(currentSlide + 1);
                }
            } else {
                // 縦モード: 上側タップ -> 戻る
                goToSlide(currentSlide - 1);
            }
        }
    });

    // スワイプナビゲーション
    lpContainer.addEventListener('touchstart', (e) => {
        if (e.target.closest('input') || e.target.closest('.option-btn') || e.target.closest('.next-btn')) {
             touchStartX = 0; 
             touchStartY = 0;
             return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY; 
    });

    lpContainer.addEventListener('touchend', (e) => {
        if (touchStartX === 0 && touchStartY === 0) return; 

        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY; 

        const dx = touchStartX - touchEndX; 
        const dy = touchStartY - touchEndY; 

        const threshold = 50; 

        // スワイプ方向の決定ロジック
        if (swipeDirection === null) {
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                swipeDirection = 'horizontal';
            } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
                swipeDirection = 'vertical';
            }
            
            if (swipeDirection) {
                slideWrapper.classList.add(`mode-${swipeDirection}`);
                console.log(`Slide mode set to: ${swipeDirection}`);
            }
        }

        // 確定したスワイプ方向のみで移動を処理
        if (swipeDirection === 'horizontal') {
            if (Math.abs(dx) > threshold) {
                if (dx > 0) {
                    // 左スワイプ -> 次へ
                    if (isFormAnswered(currentSlide)) {
                        goToSlide(currentSlide + 1);
                    }
                } else {
                    // 右スワイプ -> 戻る
                    goToSlide(currentSlide - 1);
                }
            }
        } else if (swipeDirection === 'vertical') {
            if (Math.abs(dy) > threshold) {
                if (dy > 0) {
                    // 上スワイプ -> 次へ
                    if (isFormAnswered(currentSlide)) {
                        goToSlide(currentSlide + 1);
                    }
                } else {
                    // 下スワイプ -> 戻る
                    goToSlide(currentSlide - 1);
                }
            }
        }
        
        touchStartX = 0; 
        touchStartY = 0;
    });


    // --- フォーム処理 (選択肢) ---

    const optionContainers = document.querySelectorAll('.options-container');

    optionContainers.forEach(container => {
        container.addEventListener('click', (e) => {
            const button = e.target.closest('.option-btn');
            if (button) {
                const questionKey = container.dataset.question;
                const value = button.dataset.value;

                formData[questionKey] = value;
                console.log(`Answered ${questionKey}: ${value}`);

                updateSelectedButtonState(); 

                goToSlide(currentSlide + 1);
            }
        });
    });


    // --- フォーム処理 (テキスト入力 - Q5, Q6) ---
    
    const singleTextInputSlides = document.querySelectorAll('.slide[data-type="text"]');

    singleTextInputSlides.forEach(slide => {
        const input = slide.querySelector('input');
        const nextBtn = slide.querySelector('.next-btn');
        const questionKey = input.dataset.question;

        const runValidationAndStore = () => {
            let isValid = input.value.trim() !== '';

            if (questionKey === 'email_address') {
                // 簡易的なメールアドレス検証
                isValid = isValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
            } else if (questionKey === 'phone_number') {
                // ハイフンなし9桁以上の数値検証
                isValid = isValid && /^\d{9,}$/.test(input.value.trim());
            }

            nextBtn.disabled = !isValid;
            
            if (isValid) {
                 formData[questionKey] = input.value.trim();
            } else {
                 formData[questionKey] = ''; 
            }
        };

        input.addEventListener('input', runValidationAndStore);
        
        // オートコンプリート対策
        input.addEventListener('focus', () => {
             setTimeout(runValidationAndStore, 50);
        });
        input.addEventListener('change', runValidationAndStore); 

        // Enterキーで「次へ」ボタンを押す処理
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !nextBtn.disabled) {
                e.preventDefault(); 
                nextBtn.click(); 
            }
        });

        // ページ再読み込み時などにデータが残っていた場合の対応
        if (formData[questionKey] && formData[questionKey].length > 0) {
             input.value = formData[questionKey]; 
             runValidationAndStore(); 
        }

        nextBtn.addEventListener('click', () => {
            if (!nextBtn.disabled) {
                console.log(`Answered ${questionKey}: ${input.value.trim()}`);
                goToSlide(currentSlide + 1);
            }
        });
    });


    // --- フォーム処理 (テキスト入力 - Q7 名前分割) ---

    const nameSlide = document.querySelector('.slide[data-type="name"]');
    if (nameSlide) {
        const lastNameInput = nameSlide.querySelector('input[data-question="last_name"]');
        const firstNameInput = nameSlide.querySelector('input[data-question="first_name"]');
        const nextBtn = nameSlide.querySelector('.next-btn');

        const runNameValidationAndStore = () => {
            const lastName = lastNameInput.value.trim();
            const firstName = firstNameInput.value.trim();

            const isValid = lastName.length > 0 && firstName.length > 0;
            
            nextBtn.disabled = !isValid;
            
            formData.last_name = lastName;
            formData.first_name = firstName;
        };
        
        [lastNameInput, firstNameInput].forEach(input => {
            input.addEventListener('input', runNameValidationAndStore);
            
            // オートコンプリート対策
            input.addEventListener('focus', () => {
                 setTimeout(runNameValidationAndStore, 50);
            });
            input.addEventListener('change', runNameValidationAndStore);
            
            // Enterキーでの処理 (姓でEnterを押すと名に移動、名でEnterを押すと次へ)
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    if (input.dataset.question === 'last_name') {
                        firstNameInput.focus();
                    } else if (input.dataset.question === 'first_name' && !nextBtn.disabled) {
                        nextBtn.click();
                    }
                }
            });
        });

        runNameValidationAndStore();

        nextBtn.addEventListener('click', () => {
            if (!nextBtn.disabled) {
                console.log(`Answered last_name: ${formData.last_name}, first_name: ${formData.first_name}`);
                goToSlide(currentSlide + 1);
            }
        });
    }


    // 初期表示
    goToSlide(0);
});