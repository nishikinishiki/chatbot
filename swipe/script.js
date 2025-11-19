document.addEventListener('DOMContentLoaded', () => {
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
    
    // Pardot連携のためのフォームデータ
    const formData = {
        // Q1 投資経験 (Pardot連携では使用しないが、ここでは保持)
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
        last_name_kana: '',
        first_name_kana: '',
        
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
        const container = currentSlideElement.querySelector('.options-container');

        if (container) {
            const questionKey = container.dataset.question;
            const selectedValue = formData[questionKey];

            currentSlideElement.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            if (selectedValue) {
                const selectedBtn = currentSlideElement.querySelector(`.option-btn[data-value="${selectedValue}"]`);
                if (selectedBtn) {
                    selectedBtn.classList.add('selected');
                }
            }
        }
    }
    
    /**
     * Thanksページに回答内容を動的に挿入する
     * ★修正箇所: UTMパラメータを非表示にする
     */
    function renderSummary() {
        const summaryElement = document.querySelector('.thanks-slide .form-content');
        if (!summaryElement) return;

        let summaryHTML = `
            <h1>ご登録ありがとうございます！</h1>
            <p>ご入力いただいた内容をご確認ください。</p>
            <dl class="answers-summary">
        `;

        // ユーザーに提示する回答項目のみを定義
        const userFacingQuestions = {
            investment_experience: "Q1. 投資経験",
            occupation: "Q2. 職業区分",
            age_group: "Q3. 年齢帯",
            annual_income: "Q4. ご年収",
            email_address: "Q5. メールアドレス",
            phone_number: "Q6. 携帯電話番号",
            last_name_kana: "Q7. お名前(姓)",
            first_name_kana: "Q7. お名前(名)",
        };
        
        // ユーザー向け項目のみをループ
        for (const key in userFacingQuestions) {
            // formDataにキーが存在することを確認
            if (formData.hasOwnProperty(key)) {
                const label = userFacingQuestions[key];
                const value = formData[key] || '';
                
                const displayValue = value.trim() === '' || value === null ? '未回答' : value;

                summaryHTML += `
                    <dt>${label}</dt>
                    <dd>${displayValue}</dd>
                `;
            }
        }

        summaryHTML += `
            </dl>
            <p style="margin-top: 30px; font-size: 1rem;">上記内容にて担当者よりご連絡させていただきます。</p>
        `;
        
        summaryElement.innerHTML = summaryHTML;
        
        console.log("Final Form Data ready for GAS submission (including hidden UTMs):", formData);
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
        if (slideIndex < FIRST_FORM_SLIDE_INDEX || slideIndex === slideCount - 1) {
            return true;
        }

        if (slideIndex >= 5 && slideIndex <= 8) {
            const currentSlideElement = slides[slideIndex];
            const questionKey = currentSlideElement.querySelector('.options-container')?.dataset.question;
            return questionKey && formData[questionKey] !== null;
        }

        if (slideIndex >= 9 && slideIndex <= 11) {
            const nextBtn = slides[slideIndex].querySelector('.next-btn');
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
    
    const singleTextInputSlides = document.querySelectorAll('.text-input-slide:not(.name-input-slide)');

    singleTextInputSlides.forEach(slide => {
        const input = slide.querySelector('input');
        const nextBtn = slide.querySelector('.next-btn');
        const questionKey = input.dataset.question;

        const runValidationAndStore = () => {
            let isValid = input.value.trim() !== '';

            if (questionKey === 'email_address') {
                isValid = isValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
            } else if (questionKey === 'phone_number') {
                isValid = isValid && /^\d{7,}$/.test(input.value.trim());
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

    const nameSlide = document.querySelector('.name-input-slide');
    if (nameSlide) {
        const lastNameInput = nameSlide.querySelector('input[data-question="last_name_kana"]');
        const firstNameInput = nameSlide.querySelector('input[data-question="first_name_kana"]');
        const nextBtn = nameSlide.querySelector('.next-btn');

        const runNameValidationAndStore = () => {
            const lastName = lastNameInput.value.trim();
            const firstName = firstNameInput.value.trim();

            const isValid = lastName.length > 0 && firstName.length > 0;
            
            nextBtn.disabled = !isValid;
            
            formData.last_name_kana = lastName;
            formData.first_name_kana = firstName;
        };
        
        [lastNameInput, firstNameInput].forEach(input => {
            input.addEventListener('input', runNameValidationAndStore);
            
            // オートコンプリート対策
            input.addEventListener('focus', () => {
                 setTimeout(runNameValidationAndStore, 50);
            });
            input.addEventListener('change', runNameValidationAndStore);
            
            // Enterキーでの処理
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    if (input.dataset.question === 'last_name_kana') {
                        firstNameInput.focus();
                    } else if (input.dataset.question === 'first_name_kana' && !nextBtn.disabled) {
                        nextBtn.click();
                    }
                }
            });
        });

        runNameValidationAndStore();

        nextBtn.addEventListener('click', () => {
            if (!nextBtn.disabled) {
                console.log(`Answered last_name_kana: ${formData.last_name_kana}, first_name_kana: ${formData.first_name_kana}`);
                goToSlide(currentSlide + 1);
            }
        });
    }


    // 初期表示
    goToSlide(0);
});